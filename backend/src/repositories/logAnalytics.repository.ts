import { queryLogs } from '../db/postgres/logsClient';

/**
 * Dashboard analytics, served from the 15-minute rollup tables rather than from
 * raw log partitions.
 *
 * Output shape is deliberately identical to the previous MongoDB aggregation
 * pipeline (including the `_id` keys), so the admin UI needs no change.
 */

type Row = Record<string, any>;

const num = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * The timezone arrives from a query parameter or header, and `AT TIME ZONE`
 * raises on an unrecognised name. Validate with Intl and fall back to UTC so a
 * bad value degrades to a sensible response instead of a 500.
 */
export const resolveTimeZone = (candidate?: string): string => {
    if (!candidate) return 'UTC';
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: candidate });
        return candidate;
    } catch {
        return 'UTC';
    }
};

export interface AnalyticsWindow {
    since: Date;
    timeZone: string;
}

export interface ActivityAnalytics {
    metrics: {
        totalActivities: number;
        authEvents: number;
        ordersCount: number;
        paymentsCount: number;
        failedActions: number;
        securityAlertsCount: number;
        auditCount: number;
    };
    dashboards: {
        topApis: Row[];
        slowApis: Row[];
        searchesNoResult: Row[];
        topKeywords: Row[];
        activeCustomers: Row[];
        activeAdmins: Row[];
        trends: {
            activityTrends: Row[];
            auditTrends: Row[];
            apiLatencyTrends: Row[];
            securityTrends: Row[];
        };
    };
}

const fetchMetrics = async (since: Date) => {
    const result = await queryLogs<Row>(
        `SELECT
            (SELECT coalesce(sum(total), 0) FROM logs.activity_metrics_15m
                WHERE bucket_start >= $1) AS total_activities,
            (SELECT coalesce(sum(total), 0) FROM logs.activity_metrics_15m
                WHERE bucket_start >= $1 AND module IN ('Auth', 'Authentication')) AS auth_events,
            (SELECT coalesce(sum(total), 0) FROM logs.activity_metrics_15m
                WHERE bucket_start >= $1 AND module = 'Orders') AS orders_count,
            (SELECT coalesce(sum(total), 0) FROM logs.activity_metrics_15m
                WHERE bucket_start >= $1
                  AND (module IN ('Payment', 'Payments') OR upper(activity_type) LIKE '%PAYMENT%')) AS payments_count,
            (SELECT coalesce(sum(total), 0) FROM logs.activity_metrics_15m
                WHERE bucket_start >= $1 AND status = 'failed') AS failed_actions,
            (SELECT coalesce(sum(total), 0) FROM logs.security_metrics_15m
                WHERE bucket_start >= $1) AS security_alerts,
            (SELECT coalesce(sum(total), 0) FROM logs.audit_metrics_15m
                WHERE bucket_start >= $1) AS audit_count`,
        [since]
    );

    const row = result.rows[0] ?? {};
    return {
        totalActivities: num(row.total_activities),
        authEvents: num(row.auth_events),
        ordersCount: num(row.orders_count),
        paymentsCount: num(row.payments_count),
        failedActions: num(row.failed_actions),
        securityAlertsCount: num(row.security_alerts),
        auditCount: num(row.audit_count),
    };
};

const fetchTopApis = async (since: Date): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT route, method,
                sum(total_calls)::bigint AS count,
                sum(total_latency_ms)::float / nullif(sum(total_calls), 0) AS avg_duration
         FROM logs.api_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY route, method
         ORDER BY count DESC
         LIMIT 5`,
        [since]
    );

    return result.rows.map((row) => ({
        _id: { route: row.route, method: row.method },
        count: num(row.count),
        avgDuration: num(row.avg_duration),
    }));
};

const fetchSlowApis = async (since: Date): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT route,
                sum(total_latency_ms)::float / nullif(sum(total_calls), 0) AS avg_duration,
                max(max_latency_ms) AS max_duration
         FROM logs.api_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY route
         ORDER BY avg_duration DESC NULLS LAST
         LIMIT 5`,
        [since]
    );

    return result.rows.map((row) => ({
        _id: row.route,
        avgDuration: num(row.avg_duration),
        maxDuration: num(row.max_duration),
    }));
};

const fetchNoResultSearches = async (since: Date): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT normalized_keyword, sum(no_result_count)::bigint AS count
         FROM logs.search_metrics_15m
         WHERE bucket_start >= $1 AND no_result_count > 0
         GROUP BY normalized_keyword
         ORDER BY count DESC
         LIMIT 5`,
        [since]
    );

    return result.rows.map((row) => ({ _id: row.normalized_keyword, count: num(row.count) }));
};

const fetchTopKeywords = async (since: Date): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT normalized_keyword, sum(total_searches)::bigint AS count
         FROM logs.search_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY normalized_keyword
         ORDER BY count DESC
         LIMIT 5`,
        [since]
    );

    return result.rows.map((row) => ({ _id: row.normalized_keyword, count: num(row.count) }));
};

const fetchActiveActors = async (since: Date, actorTypes: string[]): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT actor_key,
                max(actor_name) AS name,
                max(actor_email) AS email,
                sum(total)::bigint AS count
         FROM logs.activity_actor_15m
         WHERE bucket_start >= $1 AND actor_type = ANY($2::text[])
         GROUP BY actor_key
         ORDER BY count DESC
         LIMIT 5`,
        [since, actorTypes]
    );

    return result.rows.map((row) => ({
        _id: { id: row.actor_key, email: row.email, name: row.name },
        count: num(row.count),
    }));
};

const fetchActivityTrends = async (since: Date, timeZone: string): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT to_char(date_trunc('hour', bucket_start AT TIME ZONE $2), 'HH24:00') AS hour,
                sum(total)::bigint AS total,
                sum(total) FILTER (WHERE status = 'success')::bigint AS success,
                sum(total) FILTER (WHERE status = 'failed')::bigint AS failed
         FROM logs.activity_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY 1
         ORDER BY 1`,
        [since, timeZone]
    );

    return result.rows.map((row) => ({
        _id: row.hour,
        total: num(row.total),
        success: num(row.success),
        failed: num(row.failed),
    }));
};

const fetchAuditTrends = async (since: Date, timeZone: string): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT to_char(date_trunc('hour', bucket_start AT TIME ZONE $2), 'HH24:00') AS hour,
                sum(total)::bigint AS total,
                sum(total) FILTER (WHERE action = 'CREATE')::bigint AS create_count,
                sum(total) FILTER (WHERE action = 'UPDATE')::bigint AS update_count,
                sum(total) FILTER (WHERE action = 'DELETE')::bigint AS delete_count
         FROM logs.audit_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY 1
         ORDER BY 1`,
        [since, timeZone]
    );

    return result.rows.map((row) => ({
        _id: row.hour,
        total: num(row.total),
        create: num(row.create_count),
        update: num(row.update_count),
        delete: num(row.delete_count),
    }));
};

const fetchApiLatencyTrends = async (since: Date, timeZone: string): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT to_char(date_trunc('hour', bucket_start AT TIME ZONE $2), 'HH24:00') AS hour,
                sum(total_latency_ms)::float / nullif(sum(total_calls), 0) AS avg_latency,
                sum(total_calls)::bigint AS total_calls,
                sum(error_calls)::bigint AS error_calls
         FROM logs.api_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY 1
         ORDER BY 1`,
        [since, timeZone]
    );

    return result.rows.map((row) => ({
        _id: row.hour,
        avgLatency: num(row.avg_latency),
        totalCalls: num(row.total_calls),
        errorCalls: num(row.error_calls),
    }));
};

const fetchSecurityTrends = async (since: Date, timeZone: string): Promise<Row[]> => {
    const result = await queryLogs<Row>(
        `SELECT to_char(date_trunc('hour', bucket_start AT TIME ZONE $2), 'HH24:00') AS hour,
                sum(total) FILTER (WHERE severity IN ('critical', 'high'))::bigint AS critical,
                sum(total) FILTER (WHERE severity = 'medium')::bigint AS medium,
                sum(total) FILTER (WHERE severity = 'low')::bigint AS low,
                sum(total)::bigint AS total
         FROM logs.security_metrics_15m
         WHERE bucket_start >= $1
         GROUP BY 1
         ORDER BY 1`,
        [since, timeZone]
    );

    return result.rows.map((row) => ({
        _id: row.hour,
        critical: num(row.critical),
        medium: num(row.medium),
        low: num(row.low),
        total: num(row.total),
    }));
};

/**
 * Runs every dashboard aggregation. All queries hit the small rollup tables, so
 * this stays fast regardless of how many raw log rows exist.
 */
export const getActivityAnalytics = async (window: AnalyticsWindow): Promise<ActivityAnalytics> => {
    const since = window.since;
    // Normalise here as well as at the controller boundary. PostgreSQL raises
    // SQLSTATE 22023 on an unknown zone name, so this function must not depend
    // on every future caller having validated the value first.
    const timeZone = resolveTimeZone(window.timeZone);

    const [
        metrics,
        topApis,
        slowApis,
        searchesNoResult,
        topKeywords,
        activeCustomers,
        activeAdmins,
        activityTrends,
        auditTrends,
        apiLatencyTrends,
        securityTrends,
    ] = await Promise.all([
        fetchMetrics(since),
        fetchTopApis(since),
        fetchSlowApis(since),
        fetchNoResultSearches(since),
        fetchTopKeywords(since),
        fetchActiveActors(since, ['customer']),
        fetchActiveActors(since, ['admin', 'super_admin', 'store_admin']),
        fetchActivityTrends(since, timeZone),
        fetchAuditTrends(since, timeZone),
        fetchApiLatencyTrends(since, timeZone),
        fetchSecurityTrends(since, timeZone),
    ]);

    return {
        metrics,
        dashboards: {
            topApis,
            slowApis,
            searchesNoResult,
            topKeywords,
            activeCustomers,
            activeAdmins,
            trends: {
                activityTrends,
                auditTrends,
                apiLatencyTrends,
                securityTrends,
            },
        },
    };
};
