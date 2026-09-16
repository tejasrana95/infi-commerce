-- =============================================================================
-- Dedicated logging schema for Infi Commerce
-- Target: SEPARATE PostgreSQL server (LOG_DATABASE_URL)
--
-- Design notes
--   * PostgreSQL 14+ required. Verified on 14.16 and targeted at 18.0.
--     `date_bin()` is deliberately avoided (PG 14+ only) in favour of epoch
--     arithmetic so the schema stays usable on older point releases.
--   * The role running this file must OWN the `logs` schema. See the preflight
--     check in scripts/postgres/apply-logs-schema.ts: PostgreSQL requires CREATE
--     on the *database* to run CREATE SCHEMA, which a dedicated application role
--     normally does not have. Recommended bootstrap, run once as superuser:
--         CREATE SCHEMA IF NOT EXISTS logs AUTHORIZATION <app_role>;
--   * Every high-volume log table is RANGE partitioned by created_at (monthly).
--     The partition key is part of the primary key, which PostgreSQL requires.
--   * `id` is TEXT holding the original 24-char Mongo ObjectId hex, or a freshly
--     generated 24-char hex for new rows. This keeps the existing API response
--     contract (`_id`) byte-identical, so no frontend change is required.
--   * NO CHECK constraints on enum-ish columns (channel, status, method, ...).
--     Log ingestion must never fail because of an unexpected value; a rejected
--     row would silently disappear behind the queue's error swallowing. Data
--     quality for these is enforced in application code instead.
--   * Only indexes backed by a real query in the log controller are created.
--     The Mongo implementation had ~20 indexes per collection, which is the
--     single largest driver of storage growth and write amplification.
--   * Every table has a `_default` partition so a late-arriving or out-of-range
--     timestamp can never cause an insert failure.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS logs;

-- -----------------------------------------------------------------------------
-- Partition management helpers
-- -----------------------------------------------------------------------------

-- Create the monthly partition covering p_month for a given parent table.
-- Idempotent. If the default partition already holds rows for that range it
-- relocates them first, because PostgreSQL refuses to attach an overlapping
-- partition while the default partition contains conflicting rows.
CREATE OR REPLACE FUNCTION logs.ensure_month_partition(p_table text, p_month date)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_start   date := date_trunc('month', p_month)::date;
    v_end     date := (date_trunc('month', p_month) + interval '1 month')::date;
    v_name    text := format('%s_%s', p_table, to_char(v_start, 'YYYY_MM'));
    v_default text := format('%s_default', p_table);
    v_conflict boolean := false;
BEGIN
    IF to_regclass(format('logs.%I', v_name)) IS NOT NULL THEN
        RETURN v_name;
    END IF;

    IF to_regclass(format('logs.%I', v_default)) IS NOT NULL THEN
        EXECUTE format(
            'SELECT EXISTS (SELECT 1 FROM logs.%I WHERE created_at >= %L AND created_at < %L)',
            v_default, v_start, v_end
        ) INTO v_conflict;
    END IF;

    IF v_conflict THEN
        -- Stage the rows outside the parent, then attach as a real partition.
        EXECUTE format('CREATE TABLE logs.%I (LIKE logs.%I INCLUDING ALL)', v_name, p_table);
        EXECUTE format(
            'WITH moved AS (DELETE FROM logs.%I WHERE created_at >= %L AND created_at < %L RETURNING *)
             INSERT INTO logs.%I SELECT * FROM moved',
            v_default, v_start, v_end, v_name
        );
        EXECUTE format(
            'ALTER TABLE logs.%I ATTACH PARTITION logs.%I FOR VALUES FROM (%L) TO (%L)',
            p_table, v_name, v_start, v_end
        );
    ELSE
        EXECUTE format(
            'CREATE TABLE logs.%I PARTITION OF logs.%I FOR VALUES FROM (%L) TO (%L)',
            v_name, p_table, v_start, v_end
        );
    END IF;

    RETURN v_name;
END;
$$;

-- Ensure this month plus the next p_ahead_months months exist for all log tables.
CREATE OR REPLACE FUNCTION logs.ensure_partitions(p_ahead_months int DEFAULT 3)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_tables text[] := ARRAY[
        'log_activity', 'log_api', 'log_audit',
        'log_security', 'log_search', 'log_system'
    ];
    v_table text;
    v_month date;
    v_i     int;
    v_count int := 0;
BEGIN
    FOREACH v_table IN ARRAY v_tables LOOP
        FOR v_i IN 0..p_ahead_months LOOP
            v_month := (date_trunc('month', now()) + make_interval(months => v_i))::date;
            PERFORM logs.ensure_month_partition(v_table, v_month);
            v_count := v_count + 1;
        END LOOP;
    END LOOP;
    RETURN v_count;
END;
$$;

-- Ensure every monthly partition covering [p_from, p_to] exists for all log
-- tables.
--
-- Needed by the historical backfill: partitions must exist BEFORE historical
-- rows are inserted. Otherwise every older row lands in the catch-all default
-- partition, which turns that one partition into a large hot spot and makes the
-- months unusable as real partitions until relocated.
--
-- Guarded by a month cap so a stray ancient date cannot create thousands of
-- partitions.
CREATE OR REPLACE FUNCTION logs.ensure_partitions_range(p_from date, p_to date)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    v_tables text[] := ARRAY[
        'log_activity', 'log_api', 'log_audit',
        'log_security', 'log_search', 'log_system'
    ];
    v_table  text;
    v_month  date;
    v_end    date;
    v_count  int := 0;
    v_cap    int := 600; -- 50 years of months
BEGIN
    IF p_from IS NULL THEN
        p_from := date_trunc('month', now())::date;
    END IF;

    v_month := date_trunc('month', p_from)::date;
    v_end := date_trunc('month', COALESCE(p_to, p_from))::date;

    IF v_end < v_month THEN
        v_end := v_month;
    END IF;

    FOREACH v_table IN ARRAY v_tables LOOP
        DECLARE
            v_cursor date := v_month;
            v_created int := 0;
        BEGIN
            WHILE v_cursor <= v_end LOOP
                EXIT WHEN v_created >= v_cap;

                PERFORM logs.ensure_month_partition(v_table, v_cursor);
                v_created := v_created + 1;
                v_count := v_count + 1;
                v_cursor := (v_cursor + interval '1 month')::date;
            END LOOP;

            IF v_created >= v_cap THEN
                RAISE WARNING 'logs: partition range for % truncated at % months', v_table, v_cap;
            END IF;
        END;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Drop partitions of p_table whose entire range is older than p_retention_days.
-- Returns the number of partitions dropped. This is O(1) metadata work, which
-- is the whole point of partitioning versus a TTL delete loop.
CREATE OR REPLACE FUNCTION logs.drop_expired_partitions(p_table text, p_retention_days int)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    r          record;
    v_suffix   text;
    v_end      date;
    v_cutoff   date := (now() - make_interval(days => p_retention_days))::date;
    v_dropped  int := 0;
BEGIN
    IF p_retention_days IS NULL OR p_retention_days <= 0 THEN
        RETURN 0;
    END IF;

    FOR r IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'logs'
          AND c.relispartition
          AND c.relname LIKE p_table || '\_%'
          AND c.relname NOT LIKE p_table || '\_default'
    LOOP
        v_suffix := substring(r.relname FROM length(p_table) + 2);
        IF v_suffix !~ '^[0-9]{4}_[0-9]{2}$' THEN
            CONTINUE;
        END IF;

        -- End of the covered month (exclusive upper bound).
        v_end := (to_date(v_suffix, 'YYYY_MM') + interval '1 month')::date;

        IF v_end <= v_cutoff THEN
            EXECUTE format('DROP TABLE logs.%I', r.relname);
            v_dropped := v_dropped + 1;
            RAISE NOTICE 'logs: dropped expired partition %', r.relname;
        END IF;
    END LOOP;

    RETURN v_dropped;
END;
$$;

-- Current partition coverage per log table, used to warn when partition
-- creation has silently stopped running.
--
-- `relkind = 'r'` is essential: an index attached to a partition is itself a
-- partition of the parent index, so without that filter indexes would be
-- counted as partitions and would win the min/max name comparison.
CREATE OR REPLACE FUNCTION logs.partition_health()
RETURNS TABLE (table_name text, partitions int, oldest_partition text, newest_partition text)
LANGUAGE sql
STABLE
AS $$
    SELECT
        p.name::text,
        count(c.oid)::int,
        min(c.relname),
        max(c.relname)
    FROM unnest(ARRAY[
        'log_activity', 'log_api', 'log_audit',
        'log_security', 'log_search', 'log_system'
    ]) AS p(name)
    LEFT JOIN pg_class c
           ON c.relname LIKE p.name || '\_%'
          AND c.relname NOT LIKE p.name || '\_default'
          AND c.relkind = 'r'
          AND c.relnamespace = 'logs'::regnamespace
    GROUP BY p.name
    ORDER BY p.name;
$$;

-- -----------------------------------------------------------------------------
-- log_activity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_activity (
    id                  TEXT        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_id          TEXT        NOT NULL,
    trace_id            TEXT        NOT NULL,
    correlation_id      TEXT,
    session_id          TEXT,
    store_id            TEXT,
    currency            TEXT,
    language            TEXT,
    timezone            TEXT,
    channel             TEXT        NOT NULL,
    order_source        TEXT,
    actor_type          TEXT        NOT NULL,
    actor_id            TEXT,
    actor_name          TEXT,
    actor_email         TEXT,
    actor_api_key_id    TEXT,
    actor_api_key_name  TEXT,
    module              TEXT        NOT NULL,
    activity_type       TEXT        NOT NULL,
    action              TEXT        NOT NULL,
    status              TEXT        NOT NULL,
    details             JSONB,
    ip_address          TEXT,
    user_agent          TEXT,
    browser             TEXT,
    operating_system    TEXT,
    device_type         TEXT,
    country             TEXT,
    region              TEXT,
    city                TEXT,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_activity_default PARTITION OF logs.log_activity DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_activity_created
    ON logs.log_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_store_created
    ON logs.log_activity (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_actor_id_created
    ON logs.log_activity (actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_activity_actor_type_created
    ON logs.log_activity (actor_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_module_created
    ON logs.log_activity (module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_type_created
    ON logs.log_activity (activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_channel_created
    ON logs.log_activity (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_activity_order_source_created
    ON logs.log_activity (order_source, created_at DESC) WHERE order_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_activity_request_id
    ON logs.log_activity (request_id);
CREATE INDEX IF NOT EXISTS idx_log_activity_trace_id
    ON logs.log_activity (trace_id);
CREATE INDEX IF NOT EXISTS idx_log_activity_correlation_id
    ON logs.log_activity (correlation_id) WHERE correlation_id IS NOT NULL;
-- The controller filters on details->>'orderId' and details->>'productId'.
CREATE INDEX IF NOT EXISTS idx_log_activity_details
    ON logs.log_activity USING GIN (details jsonb_path_ops);

-- -----------------------------------------------------------------------------
-- log_api  (highest volume table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_api (
    id                  TEXT        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_id          TEXT        NOT NULL,
    trace_id            TEXT        NOT NULL,
    correlation_id      TEXT,
    session_id          TEXT,
    store_id            TEXT,
    currency            TEXT,
    language            TEXT,
    timezone            TEXT,
    channel             TEXT        NOT NULL,
    user_type           TEXT        NOT NULL,
    user_id             TEXT,
    api_key_id          TEXT,
    api_key_name        TEXT,
    method              TEXT        NOT NULL,
    url                 TEXT        NOT NULL,
    route               TEXT,
    controller          TEXT,
    action              TEXT,
    http_status         INTEGER     NOT NULL,
    response_time_ms    INTEGER     NOT NULL,
    payload_size_bytes  INTEGER     NOT NULL DEFAULT 0,
    ip_address          TEXT,
    forwarded_ip        TEXT,
    user_agent          TEXT,
    browser             TEXT,
    operating_system    TEXT,
    device_type         TEXT,
    platform            TEXT,
    country             TEXT,
    region              TEXT,
    city                TEXT,
    referer             TEXT,
    origin              TEXT,
    request_headers     JSONB,
    response_headers    JSONB,
    request_body        JSONB,
    query_params        JSONB,
    response_status     TEXT,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_api_default PARTITION OF logs.log_api DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_api_created
    ON logs.log_api (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_api_store_created
    ON logs.log_api (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_api_route_method_created
    ON logs.log_api (route, method, created_at DESC);
-- Partial: only failures are ever queried by status in practice.
CREATE INDEX IF NOT EXISTS idx_log_api_errors_created
    ON logs.log_api (http_status, created_at DESC) WHERE http_status >= 400;
CREATE INDEX IF NOT EXISTS idx_log_api_slow
    ON logs.log_api (response_time_ms DESC, created_at DESC) WHERE response_time_ms >= 1000;
CREATE INDEX IF NOT EXISTS idx_log_api_user_created
    ON logs.log_api (user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_api_channel_created
    ON logs.log_api (channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_api_request_id
    ON logs.log_api (request_id);
CREATE INDEX IF NOT EXISTS idx_log_api_trace_id
    ON logs.log_api (trace_id);
CREATE INDEX IF NOT EXISTS idx_log_api_correlation_id
    ON logs.log_api (correlation_id) WHERE correlation_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- log_audit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_audit (
    id              TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_id      TEXT        NOT NULL,
    store_id        TEXT,
    channel         TEXT,
    actor_type      TEXT        NOT NULL,
    actor_id        TEXT,
    actor_name      TEXT,
    actor_email     TEXT,
    module          TEXT        NOT NULL,
    entity          TEXT        NOT NULL,
    entity_id       TEXT        NOT NULL,
    action          TEXT        NOT NULL,
    changes         JSONB,
    reason          TEXT,
    ip_address      TEXT,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_audit_default PARTITION OF logs.log_audit DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_audit_created
    ON logs.log_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_audit_store_created
    ON logs.log_audit (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_audit_entity_created
    ON logs.log_audit (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_audit_actor_created
    ON logs.log_audit (actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_audit_action_created
    ON logs.log_audit (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_audit_module_created
    ON logs.log_audit (module, created_at DESC);

-- -----------------------------------------------------------------------------
-- log_security
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_security (
    id              TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_id      TEXT,
    store_id        TEXT,
    event_type      TEXT        NOT NULL,
    severity        TEXT        NOT NULL,
    actor_type      TEXT,
    actor_id        TEXT,
    actor_email     TEXT,
    ip_address      TEXT,
    user_agent      TEXT,
    endpoint        TEXT,
    details         JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_security_default PARTITION OF logs.log_security DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_security_created
    ON logs.log_security (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_security_event_created
    ON logs.log_security (event_type, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_security_store_created
    ON logs.log_security (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_security_actor_created
    ON logs.log_security (actor_id, created_at DESC) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_log_security_ip_created
    ON logs.log_security (ip_address, created_at DESC) WHERE ip_address IS NOT NULL;

-- -----------------------------------------------------------------------------
-- log_search
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_search (
    id                      TEXT        NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    store_id                TEXT,
    session_id              TEXT,
    customer_id             TEXT,
    user_type               TEXT        NOT NULL,
    channel                 TEXT        NOT NULL,
    keyword                 TEXT        NOT NULL,
    normalized_keyword      TEXT        NOT NULL,
    result_count            INTEGER     NOT NULL,
    filters                 JSONB,
    sort                    TEXT,
    currency                TEXT,
    language                TEXT,
    clicked_product_id      TEXT,
    purchased_after_search  BOOLEAN     NOT NULL DEFAULT false,
    order_id                TEXT,
    is_no_result            BOOLEAN     NOT NULL,
    ip_address              TEXT,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_search_default PARTITION OF logs.log_search DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_search_created
    ON logs.log_search (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_search_store_kw_created
    ON logs.log_search (store_id, normalized_keyword, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_search_no_result_created
    ON logs.log_search (is_no_result, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_search_kw_created
    ON logs.log_search (normalized_keyword, created_at DESC);

-- -----------------------------------------------------------------------------
-- log_system
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_system (
    id          TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    source      TEXT        NOT NULL,
    level       TEXT        NOT NULL,
    message     TEXT        NOT NULL,
    stack       TEXT,
    details     JSONB,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS logs.log_system_default PARTITION OF logs.log_system DEFAULT;

CREATE INDEX IF NOT EXISTS idx_log_system_created
    ON logs.log_system (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_system_source_level_created
    ON logs.log_system (source, level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_system_level_created
    ON logs.log_system (level, created_at DESC) WHERE level IN ('warn', 'error', 'fatal');

-- -----------------------------------------------------------------------------
-- log_archive  (low volume, mutable downloadCount -> NOT partitioned)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.log_archive (
    id                      TEXT        PRIMARY KEY,
    archive_name            TEXT        NOT NULL UNIQUE,
    range_type              TEXT        NOT NULL,
    start_date              TIMESTAMPTZ NOT NULL,
    end_date                TIMESTAMPTZ NOT NULL,
    format                  TEXT        NOT NULL,
    collections             TEXT[]      NOT NULL DEFAULT '{}',
    record_count            BIGINT      NOT NULL DEFAULT 0,
    file_size_bytes         BIGINT      NOT NULL DEFAULT 0,
    checksum_sha256         TEXT        NOT NULL,
    download_count          INTEGER     NOT NULL DEFAULT 0,
    storage_path            TEXT        NOT NULL,
    purged_after_archive    BOOLEAN     NOT NULL DEFAULT false,
    created_by_id           TEXT        NOT NULL,
    created_by_name         TEXT        NOT NULL,
    created_by_email        TEXT        NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_log_archive_created
    ON logs.log_archive (created_at DESC);
