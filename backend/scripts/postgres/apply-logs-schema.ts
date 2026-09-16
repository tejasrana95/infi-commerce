/**
 * Applies the logs schema SQL files to the dedicated logging PostgreSQL server.
 *
 * Usage:
 *   npm run logs:apply-schema
 *
 * Requires LOG_DATABASE_URL in backend/.env. Each file runs inside a
 * transaction and is recorded in logs.schema_migrations, so the command is
 * safe to re-run and safe to run from CI or a deploy hook.
 *
 * Note: a changed checksum for an already-applied file is reported as drift
 * rather than re-applied, because these files contain CREATE statements that a
 * re-run would not fix. Ship a new numbered file instead.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Client } from 'pg';

const envPath = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env'),
].find((candidate) => fs.existsSync(candidate));

if (envPath) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from ${envPath}`);
}

const SQL_DIR = path.resolve(__dirname, 'logs');

const die = (message: string): never => {
    console.error(`\n✖ ${message}\n`);
    process.exit(1);
};

interface Privileges {
    role: string;
    database: string;
    databaseOwner: string;
    canCreateInDatabase: boolean;
    logsSchemaExists: boolean;
    logsSchemaOwner: string | null;
    canCreateInLogsSchema: boolean;
}

const inspectPrivileges = async (client: Client): Promise<Privileges> => {
    const base = await client.query<{
        role: string;
        database: string;
        database_owner: string;
        db_create: boolean;
    }>(`
        SELECT current_user AS role,
               current_database() AS database,
               (SELECT pg_get_userbyid(datdba) FROM pg_database
                 WHERE datname = current_database()) AS database_owner,
               has_database_privilege(current_user, current_database(), 'CREATE') AS db_create
    `);

    const row = base.rows[0];
    if (!row) die('Could not read role privileges.');

    const schema = await client.query<{ owner: string }>(
        "SELECT pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = 'logs'"
    );

    const logsSchemaExists = schema.rows.length > 0;
    let canCreateInLogsSchema = false;

    // has_schema_privilege() raises if the schema does not exist, so only ask
    // once we know it is there.
    if (logsSchemaExists) {
        const acl = await client.query<{ can_create: boolean }>(
            "SELECT has_schema_privilege(current_user, 'logs', 'CREATE') AS can_create"
        );
        canCreateInLogsSchema = acl.rows[0]?.can_create === true;
    }

    return {
        role: row.role,
        database: row.database,
        databaseOwner: row.database_owner,
        canCreateInDatabase: row.db_create === true,
        logsSchemaExists,
        logsSchemaOwner: schema.rows[0]?.owner ?? null,
        canCreateInLogsSchema,
    };
};

/**
 * PostgreSQL requires CREATE on the *database* to run CREATE SCHEMA, which a
 * dedicated application role normally does not (and should not) have. Instead of
 * surfacing a bare SQLSTATE 42501, tell the operator exactly what to run.
 */
const reportPrivilegeProblem = (p: Privileges): never => {
    const lines: string[] = [
        `Role "${p.role}" cannot create objects in database "${p.database}"`,
        `(database owner: ${p.databaseOwner}, CREATE on database: ${p.canCreateInDatabase}).`,
        '',
        'Run this ONCE as a superuser (e.g. connect as "postgres"), then re-run this script:',
        '',
        `    CREATE SCHEMA IF NOT EXISTS logs AUTHORIZATION ${p.role};`,
        '',
        'That is the least-privilege fix: the application role owns only the logs',
        'schema, rather than being granted database-wide CREATE.',
        '',
        'To grant database-wide rights instead:',
        '',
        `    GRANT CREATE ON DATABASE "${p.database}" TO "${p.role}";`,
    ];

    if (p.logsSchemaExists && p.logsSchemaOwner !== p.role) {
        lines.push(
            '',
            `Note: schema "logs" exists and is owned by "${p.logsSchemaOwner}".`,
            'Transfer it, or grant access explicitly:',
            '',
            `    ALTER SCHEMA logs OWNER TO "${p.role}";`,
            `    -- or:  GRANT CREATE, USAGE ON SCHEMA logs TO "${p.role}";`
        );
    }

    return die(lines.join('\n'));
};

const main = async (): Promise<void> => {
    const diagnoseOnly = process.argv.includes('--diagnose');
    const connectionString = process.env.LOG_DATABASE_URL;
    if (!connectionString || connectionString.trim() === '') {
        die('LOG_DATABASE_URL is not set. Add it to backend/.env before applying the logs schema.');
    }

    if (!fs.existsSync(SQL_DIR)) {
        die(`SQL directory not found: ${SQL_DIR}`);
    }

    const files = fs
        .readdirSync(SQL_DIR)
        .filter((name) => name.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        die(`No .sql files found in ${SQL_DIR}`);
    }

    const client = new Client({ connectionString, application_name: 'infi-logs-migrate' });
    await client.connect();
    console.log('Connected to log database.');

    // Preflight. Without this, a missing privilege surfaces as a bare
    // "permission denied for database" with no indication of how to fix it.
    let privileges = await inspectPrivileges(client);

    if (diagnoseOnly) {
        console.log('\nPrivilege report');
        console.table([{
            role: privileges.role,
            database: privileges.database,
            databaseOwner: privileges.databaseOwner,
            canCreateInDatabase: privileges.canCreateInDatabase,
            logsSchemaExists: privileges.logsSchemaExists,
            logsSchemaOwner: privileges.logsSchemaOwner,
            canCreateInLogsSchema: privileges.canCreateInLogsSchema,
        }]);
        await client.end();
        return;
    }

    // Only attempt CREATE SCHEMA when it is genuinely missing. Skipping it when
    // the schema already exists means a role that owns the schema but lacks
    // database-level CREATE can still run migrations.
    if (!privileges.logsSchemaExists) {
        if (!privileges.canCreateInDatabase) {
            reportPrivilegeProblem(privileges);
        }
        await client.query('CREATE SCHEMA IF NOT EXISTS logs');
    }

    privileges = await inspectPrivileges(client);
    if (!privileges.canCreateInLogsSchema) {
        reportPrivilegeProblem(privileges);
    }

    await client.query(`
        CREATE TABLE IF NOT EXISTS logs.schema_migrations (
            filename    TEXT PRIMARY KEY,
            checksum    TEXT NOT NULL,
            applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);

    const applied = await client.query<{ filename: string; checksum: string }>(
        'SELECT filename, checksum FROM logs.schema_migrations'
    );
    const appliedMap = new Map(applied.rows.map((row) => [row.filename, row.checksum]));

    let appliedCount = 0;

    for (const filename of files) {
        const fullPath = path.join(SQL_DIR, filename);
        const sql = fs.readFileSync(fullPath, 'utf-8');
        const checksum = crypto.createHash('sha256').update(sql).digest('hex');
        const previous = appliedMap.get(filename);

        if (previous) {
            if (previous !== checksum) {
                console.warn(
                    `⚠ ${filename} was already applied but its contents changed. ` +
                    `Not re-applying. Add a new numbered migration instead.`
                );
            } else {
                console.log(`• ${filename} already applied, skipping.`);
            }
            continue;
        }

        process.stdout.write(`→ Applying ${filename} ... `);
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query(
                'INSERT INTO logs.schema_migrations (filename, checksum) VALUES ($1, $2)',
                [filename, checksum]
            );
            await client.query('COMMIT');
            appliedCount += 1;
            console.log('done');
        } catch (error) {
            await client.query('ROLLBACK');
            console.log('FAILED');

            // A permission failure mid-migration should still produce the
            // actionable message rather than a raw driver error.
            if ((error as { code?: string }).code === '42501') {
                try {
                    reportPrivilegeProblem(await inspectPrivileges(client));
                } catch {
                    console.error(
                        '\n✖ Permission denied (SQLSTATE 42501). The application role must own ' +
                        'the "logs" schema. As superuser:\n' +
                        '    CREATE SCHEMA IF NOT EXISTS logs AUTHORIZATION <app_role>;\n'
                    );
                }
            }

            console.error(error instanceof Error ? error.message : error);
            await client.end();
            process.exit(1);
        }
    }

    // Guarantee partitions exist for the current and next few months.
    const aheadMonths = Number(process.env.LOG_PARTITION_AHEAD_MONTHS ?? 3);
    const ensured = await client.query<{ ensure_partitions: number }>(
        'SELECT logs.ensure_partitions($1) AS ensure_partitions',
        [Number.isFinite(aheadMonths) ? aheadMonths : 3]
    );

    const health = await client.query('SELECT * FROM logs.partition_health()');

    console.log(`\n✓ Schema up to date (${appliedCount} file(s) applied).`);
    console.log(`✓ Partitions ensured: ${ensured.rows[0]?.ensure_partitions ?? 0}`);
    console.table(health.rows);

    await client.end();
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
