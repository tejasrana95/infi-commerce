/**
 * One-time backfill: copies historical log documents from the old logging
 * MongoDB cluster into the partitioned PostgreSQL tables.
 *
 * Usage:
 *   npm run logs:backfill                                  # everything
 *   npm run logs:backfill -- --since=2026-01-01            # only recent
 *   npm run logs:backfill -- --collection=apilogs
 *   npm run logs:backfill -- --dry-run
 *
 * Required env:
 *   LOG_MONGODB_URI  source cluster (read-only usage)
 *   LOG_DATABASE_URL target PostgreSQL server
 *
 * The script is idempotent: inserts use ON CONFLICT DO NOTHING keyed on the
 * original Mongo ObjectId, so a re-run after an interruption will not duplicate
 * rows. It streams with a server-side cursor and a bounded batch size, so memory
 * stays flat regardless of collection size.
 *
 * After copying, hourly rollups are refreshed for the migrated time range so the
 * analytics dashboard is immediately populated rather than only reflecting data
 * written after cutover.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const envPath = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
].find((candidate) => fs.existsSync(candidate));

if (envPath) {
    dotenv.config({ path: envPath });
}

/** Mongo collection name -> repository LogType. */
const COLLECTIONS = {
    activitylogs: 'activity',
    auditlogs: 'audit',
    apilogs: 'api',
    searchlogs: 'search',
    securitylogs: 'security',
    systemlogs: 'system',
} as const satisfies Record<string, string>;

type BackfillType = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Injected so the script does not import src before dotenv has run. */
type BulkInserter = (
    type: BackfillType,
    payloads: Record<string, any>[]
) => Promise<number>;

const BATCH_SIZE = 500;

interface CliOptions {
    since?: Date;
    collection?: keyof typeof COLLECTIONS;
    dryRun: boolean;
}

const parseArgs = (): CliOptions => {
    const args = process.argv.slice(2);
    const readFlag = (name: string): string | undefined => {
        const prefix = `--${name}=`;
        const inline = args.find((arg) => arg.startsWith(prefix));
        if (inline) return inline.slice(prefix.length);
        const index = args.indexOf(`--${name}`);
        if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
            return args[index + 1];
        }
        return undefined;
    };

    const sinceRaw = readFlag('since');
    let since: Date | undefined;
    if (sinceRaw) {
        const parsed = new Date(sinceRaw);
        if (Number.isNaN(parsed.getTime())) {
            console.error(`✖ Invalid --since value: ${sinceRaw}`);
            process.exit(1);
        }
        since = parsed;
    }

    const collection = readFlag('collection') as keyof typeof COLLECTIONS | undefined;
    if (collection && !(collection in COLLECTIONS)) {
        console.error(
            `✖ Unknown --collection "${collection}". Valid: ${Object.keys(COLLECTIONS).join(', ')}`
        );
        process.exit(1);
    }

    return { since, collection, dryRun: args.includes('--dry-run') };
};

interface BackfillStats {
    collection: string;
    copied: number;
    skipped: number;
}

/**
 * Finds the createdAt span across the given collections so partitions can be
 * created for it before any rows are written.
 */
const discoverDateRange = async (
    names: readonly string[]
): Promise<{ min?: Date; max?: Date }> => {
    let min: Date | undefined;
    let max: Date | undefined;

    for (const name of names) {
        const rows = await mongoose.connection.db
            ?.collection(name)
            .aggregate<{ min: Date; max: Date }>([
                { $group: { _id: null, min: { $min: '$createdAt' }, max: { $max: '$createdAt' } } },
            ])
            .toArray()
            .catch(() => []);

        const row = rows?.[0];
        if (!row?.min || !row?.max) continue;

        if (!min || row.min < min) min = row.min;
        if (!max || row.max > max) max = row.max;
    }

    return { min, max };
};

const backfillCollection = async (
    collectionName: string,
    type: BackfillType,
    options: CliOptions,
    bulkInsertLogs: BulkInserter
): Promise<BackfillStats & { minDate?: Date; maxDate?: Date }> => {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Mongo connection is not ready');

    const filter = options.since ? { createdAt: { $gte: options.since } } : {};
    const cursor = db
        .collection(collectionName)
        .find(filter)
        .sort({ createdAt: 1 })
        .batchSize(BATCH_SIZE);

    let copied = 0;
    let skipped = 0;
    let minDate: Date | undefined;
    let maxDate: Date | undefined;
    let batch: Record<string, any>[] = [];

    const flush = async () => {
        if (batch.length === 0) return;
        const rows = batch;
        batch = [];

        if (options.dryRun) {
            copied += rows.length;
            return;
        }

        try {
            await bulkInsertLogs(type, rows);
            copied += rows.length;
        } catch (error) {
            // Fall back to per-row so one malformed document cannot discard a
            // whole batch. Documents are counted as skipped for visibility.
            for (const row of rows) {
                try {
                    await bulkInsertLogs(type, [row]);
                    copied += 1;
                } catch {
                    skipped += 1;
                }
            }
            console.warn(
                `  batch failed (${error instanceof Error ? error.message : error}); recovered row-by-row`
            );
        }

        process.stdout.write(`\r  ${collectionName}: copied ${copied}, skipped ${skipped}`);
    };

    for await (const doc of cursor) {
        const createdAt = doc.createdAt instanceof Date ? doc.createdAt : undefined;
        if (createdAt) {
            if (!minDate || createdAt < minDate) minDate = createdAt;
            if (!maxDate || createdAt > maxDate) maxDate = createdAt;
        }
        batch.push(doc as Record<string, any>);
        if (batch.length >= BATCH_SIZE) {
            await flush();
        }
    }

    await flush();
    process.stdout.write('\n');

    return { collection: collectionName, copied, skipped, minDate, maxDate };
};

const main = async (): Promise<void> => {
    const options = parseArgs();

    const mongoUri = process.env.LOG_MONGODB_URI;
    if (!mongoUri || mongoUri.trim() === '') {
        console.error('✖ LOG_MONGODB_URI is not set. Cannot read the source log cluster.');
        process.exit(1);
    }
    if (!process.env.LOG_DATABASE_URL || process.env.LOG_DATABASE_URL.trim() === '') {
        console.error('✖ LOG_DATABASE_URL is not set. Cannot write to the target log database.');
        process.exit(1);
    }

    const targets: (keyof typeof COLLECTIONS)[] = options.collection
        ? [options.collection]
        : (Object.keys(COLLECTIONS) as (keyof typeof COLLECTIONS)[]);

    console.log('Log backfill: MongoDB -> PostgreSQL');
    console.log(`  source collections : ${targets.join(', ')}`);
    console.log(`  since              : ${options.since ? options.since.toISOString() : 'beginning'}`);
    console.log(`  dry run            : ${options.dryRun}`);
    console.log('');

    await mongoose.connect(mongoUri, { maxPoolSize: 5, serverSelectionTimeoutMS: 10_000 });
    console.log('Connected to source MongoDB log cluster.\n');

    // Imported lazily so dotenv has run before the pool is created.
    const { bulkInsertLogs } = await import('../../src/repositories/logRepository');
    const { refreshLogRollups, ensurePartitionsForRange, LOG_TABLE_RETENTION } = await import(
        '../../src/db/postgres/logsPartitions'
    );
    const { closeLogsPool, queryLogs } = await import('../../src/db/postgres/logsClient');

    // Partitions must exist for the historical range BEFORE inserting. Doing this
    // afterwards would leave the rows in the catch-all default partition.
    if (!options.dryRun) {
        const range = await discoverDateRange(targets);
        if (range.min) {
            const upper = range.max ?? new Date();
            console.log(
                `Ensuring partitions for ${range.min.toISOString().slice(0, 10)} .. ${upper.toISOString().slice(0, 10)}`
            );
            const created = await ensurePartitionsForRange(range.min, upper);
            console.log(`✓ Partition provisioning checked (${created} table-month entries).\n`);
        } else {
            console.log('No source rows found; skipping partition provisioning.\n');
        }
    }

    const stats: BackfillStats[] = [];
    let overallMin: Date | undefined;
    let overallMax: Date | undefined;

    for (const collectionName of targets) {
        const type = COLLECTIONS[collectionName];

        const existing = await mongoose.connection.db
            ?.collection(collectionName)
            .estimatedDocumentCount()
            .catch(() => 0);

        console.log(`→ ${collectionName} -> log_${type} (approx ${existing ?? 0} documents)`);

        const result = await backfillCollection(collectionName, type, options, bulkInsertLogs);
        stats.push({ collection: collectionName, copied: result.copied, skipped: result.skipped });

        if (result.minDate && (!overallMin || result.minDate < overallMin)) overallMin = result.minDate;
        if (result.maxDate && (!overallMax || result.maxDate > overallMax)) overallMax = result.maxDate;
    }

    console.table(stats);

    if (!options.dryRun && overallMin && overallMax) {
        console.log(`Refreshing rollups for ${overallMin.toISOString()} .. ${overallMax.toISOString()}`);
        try {
            await refreshLogRollups(overallMin, overallMax);
            console.log('✓ Rollups refreshed.');
        } catch (error) {
            console.warn(
                '⚠ Rollup refresh failed (raw data is migrated; the scheduled refresh will catch up):',
                error instanceof Error ? error.message : error
            );
        }
    }

    if (options.dryRun) {
        console.log('\nDry run complete. No data was written.');
    } else {
        // Verify nothing fell into the catch-all partitions. Rows there would
        // signal that the source data spans a range outside the provisioned
        // partitions, and would need explicit attention.
        const stray = await queryLogs<{ tbl: string; n: string }>(
            LOG_TABLE_RETENTION.map(
                (entry) =>
                    `SELECT '${entry.table}' AS tbl, count(*)::text AS n FROM logs.${entry.table}_default`
            ).join(' UNION ALL ')
        );

        const offenders = stray.rows.filter((row) => Number(row.n) > 0);
        if (offenders.length > 0) {
            console.warn('\n⚠ Rows remain in catch-all default partitions:');
            for (const row of offenders) {
                console.warn(`    ${row.tbl}_default: ${row.n}`);
            }
            console.warn(
                '  Run `npm run logs:ensure-partitions` to relocate them into proper ' +
                'monthly partitions, or check for timestamps outside the expected range.'
            );
        } else {
            console.log('✓ No rows in catch-all default partitions.');
        }

        console.log('\n✓ Backfill complete.');
    }

    await closeLogsPool();
    await mongoose.disconnect();
};

main()
    .then(() => process.exit(0))
    .catch(async (error) => {
        console.error('Backfill failed:', error);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    });
