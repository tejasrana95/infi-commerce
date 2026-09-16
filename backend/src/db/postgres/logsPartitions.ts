import { queryLogs, isLogsDbConfigured } from './logsClient';

/**
 * Partition lifecycle management for the logs schema.
 *
 * Retention is enforced by DROP PARTITION rather than by deleting rows. That is
 * the main operational win over the previous MongoDB TTL indexes: reclaiming
 * disk is metadata work, not a background delete loop competing with ingestion.
 *
 * SAFETY: dropping partitions is irreversible. It is therefore opt-in via
 * LOG_RETENTION_ENABLED and defaults to off, because retention windows for
 * audit-grade logs are a compliance decision rather than a purely technical one.
 */

export const LOG_TABLE_RETENTION: ReadonlyArray<{ table: string; envKey: string; defaultDays: number }> = [
    { table: 'log_api', envKey: 'LOG_RETENTION_API_DAYS', defaultDays: 90 },
    { table: 'log_activity', envKey: 'LOG_RETENTION_ACTIVITY_DAYS', defaultDays: 365 },
    { table: 'log_audit', envKey: 'LOG_RETENTION_AUDIT_DAYS', defaultDays: 365 },
    { table: 'log_security', envKey: 'LOG_RETENTION_SECURITY_DAYS', defaultDays: 365 },
    { table: 'log_search', envKey: 'LOG_RETENTION_SEARCH_DAYS', defaultDays: 180 },
    { table: 'log_system', envKey: 'LOG_RETENTION_SYSTEM_DAYS', defaultDays: 90 },
];

const ALL_LOG_TABLES = LOG_TABLE_RETENTION.map((entry) => entry.table);

export const isRetentionEnabled = (): boolean =>
    String(process.env.LOG_RETENTION_ENABLED ?? 'false').toLowerCase() === 'true';

export const getRetentionDays = (envKey: string, defaultDays: number): number => {
    const raw = process.env[envKey];
    if (raw === undefined || raw.trim() === '') return defaultDays;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : defaultDays;
};

export const getRetentionPolicy = (): Record<string, number> => {
    const policy: Record<string, number> = {};
    for (const entry of LOG_TABLE_RETENTION) {
        policy[entry.table] = getRetentionDays(entry.envKey, entry.defaultDays);
    }
    return policy;
};

/**
 * Creates the partition covering the current month plus `aheadMonths` future
 * months, allowing several months of headroom so a scheduling outage cannot
 * cause rows to land in the catch-all default partition.
 */
export const ensureLogPartitions = async (aheadMonths = 3): Promise<number> => {
    if (!isLogsDbConfigured()) return 0;
    const result = await queryLogs<{ ensure_partitions: number }>(
        'SELECT logs.ensure_partitions($1) AS ensure_partitions',
        [aheadMonths]
    );
    return result.rows[0]?.ensure_partitions ?? 0;
};

/**
 * Creates every monthly partition covering [from, to] for all log tables.
 *
 * Required before inserting historical rows (backfill). Without it, older rows
 * land in the catch-all default partition, which becomes a large hot spot and
 * makes those months unusable as real partitions until relocated.
 */
export const ensurePartitionsForRange = async (from: Date, to: Date = new Date()): Promise<number> => {
    if (!isLogsDbConfigured()) return 0;
    const result = await queryLogs<{ ensure_partitions_range: number }>(
        'SELECT logs.ensure_partitions_range($1::date, $2::date) AS ensure_partitions_range',
        [from, to]
    );
    return result.rows[0]?.ensure_partitions_range ?? 0;
};

export interface RetentionResult {
    table: string;
    retentionDays: number;
    partitionsDropped: number;
}

/**
 * Drops every partition whose whole range is older than that table's retention
 * window. Partitions dropped are returned for audit logging.
 */
export const dropExpiredLogPartitions = async (): Promise<RetentionResult[]> => {
    if (!isLogsDbConfigured() || !isRetentionEnabled()) return [];

    const results: RetentionResult[] = [];

    for (const entry of LOG_TABLE_RETENTION) {
        const retentionDays = getRetentionDays(entry.envKey, entry.defaultDays);
        try {
            const result = await queryLogs<{ dropped: number }>(
                'SELECT logs.drop_expired_partitions($1, $2) AS dropped',
                [entry.table, retentionDays]
            );
            results.push({
                table: entry.table,
                retentionDays,
                partitionsDropped: result.rows[0]?.dropped ?? 0,
            });
        } catch (error) {
            // One bad table must not abort maintenance for the rest.
            console.error(
                `Failed to drop expired partitions for ${entry.table}:`,
                error instanceof Error ? error.message : error
            );
        }
    }

    return results;
};

/**
 * Recomputes hourly analytics rollups over [from, to). Idempotent, so a
 * re-run over an overlapping window is safe and will not double count.
 */
export const refreshLogRollups = async (from: Date, to: Date): Promise<void> => {
    if (!isLogsDbConfigured()) return;
    await queryLogs('SELECT logs.refresh_rollups($1, $2)', [from, to]);
};

export interface PartitionHealthRow {
    table_name: string;
    partitions: number;
    oldest_partition: string | null;
    newest_partition: string | null;
}

export const getPartitionHealth = async (): Promise<PartitionHealthRow[]> => {
    if (!isLogsDbConfigured()) return [];
    const result = await queryLogs<PartitionHealthRow>('SELECT * FROM logs.partition_health()');
    return result.rows;
};

export interface MaintenanceReport {
    partitionsEnsured: number;
    rollupsRefreshed: boolean;
    retention: RetentionResult[];
    retentionEnabled: boolean;
}

/**
 * Single entry point for scheduled maintenance (cron): guarantee future
 * partitions exist, refresh rollups for recent activity, then optionally drop
 * expired partitions.
 */
export const runLogMaintenance = async (options?: {
    aheadMonths?: number;
    rollupLookbackHours?: number;
}): Promise<MaintenanceReport> => {
    const aheadMonths = options?.aheadMonths ?? 3;
    const lookbackHours = options?.rollupLookbackHours ?? 48;

    const partitionsEnsured = await ensureLogPartitions(aheadMonths);

    let rollupsRefreshed = false;
    try {
        const to = new Date();
        const from = new Date(to.getTime() - lookbackHours * 3600 * 1000);
        await refreshLogRollups(from, to);
        rollupsRefreshed = true;
    } catch (error) {
        console.error(
            'Failed to refresh log rollups:',
            error instanceof Error ? error.message : error
        );
    }

    const retention = await dropExpiredLogPartitions();

    return {
        partitionsEnsured,
        rollupsRefreshed,
        retention,
        retentionEnabled: isRetentionEnabled(),
    };
};

export { ALL_LOG_TABLES };
