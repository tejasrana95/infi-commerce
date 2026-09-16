/**
 * Scheduled maintenance entry point for the logs database.
 *
 * Usage:
 *   npm run logs:ensure-partitions
 *   npm run logs:ensure-partitions -- --ahead=6 --rollup-lookback-hours=48
 *   npm run logs:ensure-partitions -- --retention        # force retention this run
 *
 * Intended to be called from cron (e.g. hourly). The API process also runs an
 * in-process maintenance scheduler, so this is mainly useful when the app runs
 * in an environment where a long-lived timer is unreliable, or when you want to
 * decouple partition management from application deploy cycles.
 *
 * Partition creation is the safety-critical part: if it stops running, new rows
 * land in the catch-all `*_default` partition and every log query gets slower.
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
].find((candidate) => fs.existsSync(candidate));

if (envPath) {
    dotenv.config({ path: envPath });
}

interface CliOptions {
    aheadMonths: number;
    rollupLookbackHours: number;
    forceRetention: boolean;
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

    const numeric = (value: string | undefined, fallback: number): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
    };

    return {
        aheadMonths: numeric(
            readFlag('ahead') ?? readFlag('ahead-months'),
            Number(process.env.LOG_PARTITION_AHEAD_MONTHS ?? 3)
        ),
        rollupLookbackHours: numeric(
            readFlag('rollup-lookback-hours'),
            Number(process.env.LOG_ROLLUP_LOOKBACK_HOURS ?? 48)
        ),
        forceRetention: args.includes('--retention'),
    };
};

const main = async (): Promise<void> => {
    if (!process.env.LOG_DATABASE_URL || process.env.LOG_DATABASE_URL.trim() === '') {
        console.error('✖ LOG_DATABASE_URL is not set. Nothing to do.');
        process.exit(1);
    }

    const options = parseArgs();

    if (options.forceRetention) {
        process.env.LOG_RETENTION_ENABLED = 'true';
        console.log('Retention forced on for this run via --retention.');
    }

    // Imported lazily so the env overrides above are in effect.
    const { runLogMaintenance, getPartitionHealth, isRetentionEnabled } = await import(
        '../../src/db/postgres/logsPartitions'
    );

    console.log('Running log maintenance...');
    console.log(`  ahead months        : ${options.aheadMonths}`);
    console.log(`  rollup lookback hrs : ${options.rollupLookbackHours}`);
    console.log(`  retention enabled   : ${isRetentionEnabled()}`);

    const report = await runLogMaintenance({
        aheadMonths: options.aheadMonths,
        rollupLookbackHours: options.rollupLookbackHours,
    });

    console.log('\nResult');
    console.log(`  partitions ensured  : ${report.partitionsEnsured}`);
    console.log(`  rollups refreshed   : ${report.rollupsRefreshed}`);

    if (!report.retentionEnabled) {
        console.log('  retention           : skipped (set LOG_RETENTION_ENABLED=true or pass --retention)');
    } else if (report.retention.length === 0) {
        console.log('  retention           : nothing expired');
    } else {
        console.log('  retention');
        for (const entry of report.retention) {
            console.log(
                `    ${entry.table}: dropped ${entry.partitionsDropped} partition(s), ` +
                `retention ${entry.retentionDays}d`
            );
        }
    }

    const health = await getPartitionHealth();
    if (health.length > 0) {
        console.table(health);
    }

    const { closeLogsPool } = await import('../../src/db/postgres/logsClient');
    await closeLogsPool();
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Log maintenance failed:', error);
        process.exit(1);
    });
