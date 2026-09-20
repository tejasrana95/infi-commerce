import { isLogsDbConfigured } from '../db/postgres/logsClient';
import { refreshLogRollups } from '../db/postgres/logsPartitions';

/**
 * Rollup coverage tracking.
 *
 * The dashboard reads the 15-minute rollup tables, but a rollup only holds
 * buckets that some refresh run has actually computed. The maintenance service
 * keeps a short recent window warm; anything older than that (or any gap left
 * by a restart / a machine that was asleep) simply does not exist as a bucket.
 *
 * That is why a dashboard can report zeros while the raw tables hold thousands
 * of matching rows. `ensureRollupCoverage` closes the gap by recomputing the
 * rollups for exactly the window being queried, before the query runs.
 *
 * Cost control:
 *   - a whole process keeps ONE record of the range it has already covered, so
 *     repeatedly viewing the same range is free;
 *   - widening the range only backfills the newly exposed older segment;
 *   - the recent tail is refreshed at most once per throttle interval;
 *   - the backfill is clamped to a maximum lookback so a "last year" selection
 *     cannot trigger an unbounded aggregation. Beyond the clamp the dashboard
 *     reports whatever rollups already exist.
 *
 * refresh_rollups() is idempotent (it deletes and recomputes whole buckets), so
 * an overlapping or repeated call can never double count.
 */

const readNumber = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (raw === undefined || raw.trim() === '') return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const throttleMs = (): number => readNumber('LOG_ANALYTICS_ROLLUP_THROTTLE_MS', 60_000);
const maxLookbackMs = (): number =>
    readNumber('LOG_ANALYTICS_ROLLUP_MAX_LOOKBACK_HOURS', 24 * 14) * 3600 * 1000;

/** Oldest bucket start this process knows to be up to date. */
let coveredFrom: Date | null = null;
/** Newest point this process knows to be up to date. */
let coveredTo: Date | null = null;
let inFlight: Promise<void> | null = null;

/**
 * Records that a refresh has already covered [from, to]. Called by the
 * maintenance service so its scheduled work is not repeated on the request path.
 */
export const markRollupsCovered = (from: Date, to: Date): void => {
    if (!coveredFrom || from.getTime() < coveredFrom.getTime()) coveredFrom = new Date(from);
    if (!coveredTo || to.getTime() > coveredTo.getTime()) coveredTo = new Date(to);
};

/** Test/ops helper: forget what has been covered. */
export const resetRollupCoverage = (): void => {
    coveredFrom = null;
    coveredTo = null;
};

const ensure = async (since: Date, until: Date): Promise<void> => {
    const floor = new Date(until.getTime() - maxLookbackMs());
    const clampedSince = since.getTime() < floor.getTime() ? floor : since;

    const needBackfill = !coveredFrom || clampedSince.getTime() < coveredFrom.getTime();
    const needTail =
        !coveredTo || until.getTime() - coveredTo.getTime() >= throttleMs();

    if (!needBackfill && !needTail) return;

    if (needBackfill) {
        // Fill only the newly exposed older segment, not the whole window.
        await refreshLogRollups(clampedSince, coveredFrom ?? until);
    }

    if (needTail) {
        const tailFrom =
            coveredTo && coveredTo.getTime() > clampedSince.getTime() ? coveredTo : clampedSince;
        await refreshLogRollups(tailFrom, until);
    }

    coveredFrom = clampedSince;
    coveredTo = new Date(until);
};

/**
 * Ensures the rollups cover [since, until] before the caller reads them.
 * Never throws: a refresh failure degrades the dashboard to "whatever rollups
 * already exist" rather than failing the request.
 */
export const ensureRollupCoverage = async (since: Date, until: Date): Promise<void> => {
    if (!isLogsDbConfigured()) return;

    try {
        // Serialise concurrent dashboard requests so one refresh runs at a time.
        const previous = inFlight;
        const current = (async () => {
            if (previous) {
                await previous.catch(() => undefined);
            }
            await ensure(since, until);
        })();

        inFlight = current;
        await current;
        if (inFlight === current) inFlight = null;
    } catch (error) {
        inFlight = null;
        console.error(
            'Failed to ensure log rollup coverage:',
            error instanceof Error ? error.message : error
        );
    }
};
