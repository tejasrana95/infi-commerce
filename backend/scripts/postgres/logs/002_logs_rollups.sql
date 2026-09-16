-- =============================================================================
-- Rollup tables for the Activity Intelligence dashboard.
--
-- WHY 15-MINUTE BUCKETS
--   The dashboard exposes hourly trend series grouped in the caller's timezone
--   (matching the previous MongoDB `$dateToString` with `timezone`). Bucketing
--   rollups on the UTC hour would mis-slice the series for timezones offset by
--   30 or 45 minutes (e.g. Asia/Kolkata, +05:30), because each UTC hour would
--   span two different local hours. Every real-world UTC offset is a multiple
--   of 15 minutes, so 15-minute buckets can always be summed exactly into local
--   hours. `logs.bucket_15m` below is the single definition of that boundary,
--   implemented with epoch arithmetic so it works on any PostgreSQL version.
--
-- WHY ROLLUPS AT ALL
--   The dashboard previously ran 17 aggregations over a 24h window on every
--   request. These tables hold a few thousand rows per hour, so the dashboard
--   becomes an index scan on a tiny table instead of a scan over raw logs.
--
-- Idempotent by construction: logs.refresh_rollups() recomputes whole buckets,
-- so re-running over an overlapping window is always safe.
-- =============================================================================

-- 15-minute bucket boundary in UTC.
CREATE OR REPLACE FUNCTION logs.bucket_15m(ts timestamptz)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT to_timestamp(floor(extract(epoch FROM ts) / 900) * 900);
$$;

-- -----------------------------------------------------------------------------
-- api_metrics_15m
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.api_metrics_15m (
    bucket_start        TIMESTAMPTZ NOT NULL,
    route               TEXT        NOT NULL,
    method              TEXT        NOT NULL,
    total_calls         BIGINT      NOT NULL DEFAULT 0,
    error_calls         BIGINT      NOT NULL DEFAULT 0,
    total_latency_ms    BIGINT      NOT NULL DEFAULT 0,
    max_latency_ms      INTEGER     NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, route, method)
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_15m_calls
    ON logs.api_metrics_15m (bucket_start DESC, total_calls DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_15m_route
    ON logs.api_metrics_15m (bucket_start DESC, route, method);

-- -----------------------------------------------------------------------------
-- activity_metrics_15m
--   activity_type is part of the grain because the dashboard's paymentsCount
--   filters on `activityType ILIKE '%PAYMENT%'` in addition to module.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.activity_metrics_15m (
    bucket_start    TIMESTAMPTZ NOT NULL,
    channel         TEXT        NOT NULL,
    module          TEXT        NOT NULL,
    activity_type   TEXT        NOT NULL,
    actor_type      TEXT        NOT NULL,
    status          TEXT        NOT NULL,
    total           BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, channel, module, activity_type, actor_type, status)
);

CREATE INDEX IF NOT EXISTS idx_activity_metrics_15m_module
    ON logs.activity_metrics_15m (bucket_start DESC, module);
CREATE INDEX IF NOT EXISTS idx_activity_metrics_15m_type
    ON logs.activity_metrics_15m (bucket_start DESC, activity_type);

-- -----------------------------------------------------------------------------
-- activity_actor_15m  (most active customers / admins)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.activity_actor_15m (
    bucket_start    TIMESTAMPTZ NOT NULL,
    actor_type      TEXT        NOT NULL,
    actor_key       TEXT        NOT NULL,
    actor_name      TEXT,
    actor_email     TEXT,
    total           BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, actor_type, actor_key)
);

CREATE INDEX IF NOT EXISTS idx_activity_actor_15m_total
    ON logs.activity_actor_15m (bucket_start DESC, actor_type, total DESC);

-- -----------------------------------------------------------------------------
-- search_metrics_15m
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.search_metrics_15m (
    bucket_start        TIMESTAMPTZ NOT NULL,
    normalized_keyword  TEXT        NOT NULL,
    total_searches      BIGINT      NOT NULL DEFAULT 0,
    no_result_count     BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, normalized_keyword)
);

CREATE INDEX IF NOT EXISTS idx_search_metrics_15m_searches
    ON logs.search_metrics_15m (bucket_start DESC, total_searches DESC);
CREATE INDEX IF NOT EXISTS idx_search_metrics_15m_no_result
    ON logs.search_metrics_15m (bucket_start DESC, no_result_count DESC);

-- -----------------------------------------------------------------------------
-- security_metrics_15m
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.security_metrics_15m (
    bucket_start    TIMESTAMPTZ NOT NULL,
    severity        TEXT        NOT NULL,
    total           BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, severity)
);

-- -----------------------------------------------------------------------------
-- audit_metrics_15m
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs.audit_metrics_15m (
    bucket_start    TIMESTAMPTZ NOT NULL,
    action          TEXT        NOT NULL,
    total           BIGINT      NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket_start, action)
);

-- -----------------------------------------------------------------------------
-- refresh_rollups
--
-- Recomputes every bucket starting within [p_from, p_to). Both ends are snapped
-- to bucket boundaries so a partially covered bucket is recomputed in full
-- rather than double counted.
--
-- `v_to` is deliberately rounded UP to the end of the bucket containing p_to.
-- Snapping it down would exclude the bucket currently being written to, which
-- would leave the dashboard permanently one bucket behind real time.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION logs.refresh_rollups(
    p_from TIMESTAMPTZ,
    p_to   TIMESTAMPTZ
)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
    v_from timestamptz := logs.bucket_15m(p_from);
    v_to   timestamptz := logs.bucket_15m(p_to) + interval '15 minutes';
BEGIN
    IF v_to <= v_from THEN
        RETURN v_from;
    END IF;

    -- Clear the window first so re-runs cannot accumulate stale sums.
    DELETE FROM logs.api_metrics_15m      WHERE bucket_start >= v_from AND bucket_start < v_to;
    DELETE FROM logs.activity_metrics_15m WHERE bucket_start >= v_from AND bucket_start < v_to;
    DELETE FROM logs.activity_actor_15m   WHERE bucket_start >= v_from AND bucket_start < v_to;
    DELETE FROM logs.search_metrics_15m   WHERE bucket_start >= v_from AND bucket_start < v_to;
    DELETE FROM logs.security_metrics_15m WHERE bucket_start >= v_from AND bucket_start < v_to;
    DELETE FROM logs.audit_metrics_15m    WHERE bucket_start >= v_from AND bucket_start < v_to;

    INSERT INTO logs.api_metrics_15m
        (bucket_start, route, method, total_calls, error_calls, total_latency_ms, max_latency_ms)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(route, url),
        method,
        count(*),
        count(*) FILTER (WHERE http_status >= 400),
        coalesce(sum(response_time_ms), 0),
        coalesce(max(response_time_ms), 0)
    FROM logs.log_api
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2, 3;

    INSERT INTO logs.activity_metrics_15m
        (bucket_start, channel, module, activity_type, actor_type, status, total)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(channel, 'UNKNOWN'),
        coalesce(module, 'UNKNOWN'),
        coalesce(activity_type, 'UNKNOWN'),
        coalesce(actor_type, 'UNKNOWN'),
        coalesce(status, 'unknown'),
        count(*)
    FROM logs.log_activity
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2, 3, 4, 5, 6;

    INSERT INTO logs.activity_actor_15m
        (bucket_start, actor_type, actor_key, actor_name, actor_email, total)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(actor_type, 'UNKNOWN'),
        coalesce(nullif(actor_id, ''), nullif(actor_email, ''), 'unknown'),
        max(actor_name),
        max(actor_email),
        count(*)
    FROM logs.log_activity
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2, 3;

    INSERT INTO logs.search_metrics_15m
        (bucket_start, normalized_keyword, total_searches, no_result_count)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(nullif(normalized_keyword, ''), keyword),
        count(*),
        count(*) FILTER (WHERE is_no_result)
    FROM logs.log_search
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2;

    INSERT INTO logs.security_metrics_15m (bucket_start, severity, total)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(severity, 'unknown'),
        count(*)
    FROM logs.log_security
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2;

    INSERT INTO logs.audit_metrics_15m (bucket_start, action, total)
    SELECT
        logs.bucket_15m(created_at),
        coalesce(action, 'UNKNOWN'),
        count(*)
    FROM logs.log_audit
    WHERE created_at >= v_from AND created_at < v_to
    GROUP BY 1, 2;

    RETURN v_to;
END;
$$;
