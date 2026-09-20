import { isLogsDbConfigured } from '../db/postgres/logsClient';
import {
    dropExpiredLogPartitions,
    ensureLogPartitions,
    isRetentionEnabled,
    refreshLogRollups,
} from '../db/postgres/logsPartitions';
import { markRollupsCovered } from './log-rollup-coverage.service';

/**
 * Background maintenance for the logs database.
 *
 * Two cadences:
 *   - Frequent: refresh the recent rollup window so the analytics dashboard is
 *     near-real-time without aggregating raw partitions per request.
 *   - Daily: guarantee the next few months of partitions exist (so rows never
 *     land in the catch-all default partition) and, only when explicitly
 *     enabled, drop partitions past their retention window.
 *
 * All timers are unref'd so they cannot hold the process open during shutdown.
 */

const DEFAULTS = {
    rollupIntervalMs: 5 * 60 * 1000,
    // Matches the dashboard's default reporting window. Keeping this at the
    // window size means the dashboard is served from warm rollups in the common
    // case, and the on-demand backfill in log-rollup-coverage.service only has
    // to work when an operator selects a WIDER range.
    rollupLookbackHours: 24,
    partitionAheadMonths: 3,
};

const readNumber = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (raw === undefined || raw.trim() === '') return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const isMaintenanceEnabled = (): boolean => {
    if (!isLogsDbConfigured()) return false;
    const raw = process.env.LOG_MAINTENANCE_ENABLED;
    if (raw === undefined) return true;
    return raw.toLowerCase() !== 'false';
};

class LogMaintenanceService {
    private rollupTimer: NodeJS.Timeout | null = null;
    private dailyTimer: NodeJS.Timeout | null = null;
    private lastDailyRunDate: string | null = null;

    public start(): void {
        if (!isMaintenanceEnabled()) {
            console.warn(
                'Log maintenance scheduler is disabled (LOG_DATABASE_URL missing or LOG_MAINTENANCE_ENABLED=false). ' +
                'Partitions and rollups must then be maintained by an external cron.'
            );
            return;
        }

        this.stop();

        const intervalMs = readNumber('LOG_ROLLUP_INTERVAL_MS', DEFAULTS.rollupIntervalMs);

        this.rollupTimer = setInterval(() => {
            void this.runRollups();
        }, intervalMs);
        this.rollupTimer.unref?.();

        // Check hourly whether the daily job is due. A cheap date comparison is
        // more robust than a 24h interval, which drifts past midnight.
        this.dailyTimer = setInterval(() => {
            void this.runDailyIfDue();
        }, 60 * 60 * 1000);
        this.dailyTimer.unref?.();

        // Run both once at startup so a fresh deployment converges immediately.
        void this.runRollups();
        void this.runDailyIfDue();

        console.log(
            `Log maintenance scheduler started (rollups every ${Math.round(intervalMs / 1000)}s, ` +
            `retention ${isRetentionEnabled() ? 'enabled' : 'disabled'}).`
        );
    }

    public stop(): void {
        if (this.rollupTimer) {
            clearInterval(this.rollupTimer);
            this.rollupTimer = null;
        }
        if (this.dailyTimer) {
            clearInterval(this.dailyTimer);
            this.dailyTimer = null;
        }
    }

    private async runRollups(): Promise<void> {
        if (!isLogsDbConfigured()) return;
        try {
            const lookbackHours = readNumber('LOG_ROLLUP_LOOKBACK_HOURS', DEFAULTS.rollupLookbackHours);
            const to = new Date();
            const from = new Date(to.getTime() - lookbackHours * 3600 * 1000);
            await refreshLogRollups(from, to);
            // Tell the request path this window is already fresh.
            markRollupsCovered(from, to);
        } catch (error) {
            console.error(
                'Failed to refresh log rollups:',
                error instanceof Error ? error.message : error
            );
        }
    }

    private async runDailyIfDue(): Promise<void> {
        if (!isLogsDbConfigured()) return;

        const today = new Date().toISOString().slice(0, 10);
        if (this.lastDailyRunDate === today) return;
        this.lastDailyRunDate = today;

        try {
            const aheadMonths = readNumber('LOG_PARTITION_AHEAD_MONTHS', DEFAULTS.partitionAheadMonths);
            const created = await ensureLogPartitions(aheadMonths);
            console.log(`Log partitions ensured: ${created} checked.`);
        } catch (error) {
            console.error(
                'Failed to ensure log partitions:',
                error instanceof Error ? error.message : error
            );
        }

        try {
            if (isRetentionEnabled()) {
                const results = await dropExpiredLogPartitions();
                const dropped = results.reduce((sum, entry) => sum + entry.partitionsDropped, 0);
                if (dropped > 0) {
                    console.log(`Log retention dropped ${dropped} expired partition(s).`);
                }
            }
        } catch (error) {
            console.error(
                'Failed to apply log retention:',
                error instanceof Error ? error.message : error
            );
        }
    }
}

export const logMaintenanceService = new LogMaintenanceService();
export default logMaintenanceService;
