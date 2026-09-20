/**
 * Diagnostic for the Activity Intelligence dashboard.
 *
 * Answers "why are the metrics zero?" by comparing the raw log tables (the
 * source of truth) against the 15-minute rollup tables the dashboard reads, and
 * then by running the REAL analytics code path for a chosen window.
 *
 * Read-only apart from `logs.refresh_rollups`, which is idempotent (it deletes
 * and recomputes whole buckets, so it can never double count).
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/postgres/diagnose-log-analytics.ts
 *   npx ts-node --transpile-only scripts/postgres/diagnose-log-analytics.ts last_30_days
 */
import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import { getActivityAnalytics } from '../../src/repositories/logAnalytics.repository';
import { ensureRollupCoverage } from '../../src/services/log-rollup-coverage.service';

const ROLLUP_TABLES = [
    'api_metrics_15m',
    'activity_metrics_15m',
    'activity_actor_15m',
    'search_metrics_15m',
    'security_metrics_15m',
    'audit_metrics_15m',
] as const;

const RAW_TABLES = [
    'log_api',
    'log_activity',
    'log_audit',
    'log_security',
    'log_search',
    'log_system',
] as const;

const RANGE_DAYS: Record<string, number> = {
    today: 1,
    yesterday: 1,
    last_7_days: 7,
    last_30_days: 30,
    last_90_days: 90,
};

const main = async () => {
    const connectionString = process.env.LOG_DATABASE_URL;
    if (!connectionString) {
        console.error('LOG_DATABASE_URL is not set. Nothing to diagnose.');
        process.exit(1);
    }

    const rangeType = process.argv[2] || 'last_7_days';
    const pool = new Pool({ connectionString });
    const one = async <T extends Record<string, any>>(
        sql: string,
        params: any[] = []
    ): Promise<T | null> => {
        try {
            const res = await pool.query<T>(sql, params);
            return res.rows[0] ?? null;
        } catch (error) {
            console.log(`    !! ${(error as Error).message}`);
            return null;
        }
    };

    try {
        console.log('\nRAW TABLES (source of truth)');
        for (const table of RAW_TABLES) {
            const row = await one(
                `SELECT count(*)::text AS total,
                        count(*) FILTER (WHERE created_at >= now() - interval '7 days')::text AS d7,
                        max(created_at)::text AS newest
                   FROM logs.${table}`
            );
            if (!row) continue;
            console.log(
                `    ${table.padEnd(13)} total=${String(row.total).padStart(9)}  last7d=${String(row.d7).padStart(8)}  newest=${row.newest ?? 'never'}`
            );
        }

        console.log('\nROLLUP TABLES (what the dashboard reads, BEFORE ensuring coverage)');
        for (const table of ROLLUP_TABLES) {
            const row = await one(
                `SELECT count(*)::text AS rows,
                        coalesce(min(bucket_start)::text, '-') AS oldest,
                        coalesce(max(bucket_start)::text, '-') AS newest
                   FROM logs.${table}`
            );
            if (!row) continue;
            console.log(
                `    ${table.padEnd(21)} rows=${String(row.rows).padStart(7)}  range=${row.oldest} .. ${row.newest}`
            );
        }

        const days = RANGE_DAYS[rangeType] ?? 7;
        const until = new Date();
        const since = new Date(until.getTime() - days * 24 * 3600 * 1000);

        console.log(`\nEnsuring rollup coverage for ${rangeType} (${since.toISOString()} .. now)...`);
        await ensureRollupCoverage(since, until);

        const analytics = await getActivityAnalytics({
            since,
            until,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        console.log('\nDashboard metrics from the REAL code path:');
        for (const [key, value] of Object.entries(analytics.metrics)) {
            console.log(`    ${key.padEnd(20)} ${value}`);
        }
        console.log(`\n    topApis rows:        ${analytics.dashboards.topApis.length}`);
        console.log(`    activityTrends:      ${analytics.dashboards.trends.activityTrends.length} buckets`);
        console.log(`    apiLatencyTrends:    ${analytics.dashboards.trends.apiLatencyTrends.length} buckets\n`);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
