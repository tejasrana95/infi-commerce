import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Connection layer for the DEDICATED logging PostgreSQL server.
 *
 * This is intentionally separate from the main application database so that
 * high-volume log writes and analytical scans cannot contend with transactional
 * traffic. Configured via LOG_DATABASE_URL.
 *
 * All log tables live in the `logs` schema. Queries are schema-qualified rather
 * than relying on search_path so that behaviour cannot drift with connection
 * settings.
 */

export const LOG_DB_SCHEMA = 'logs';

let pool: Pool | null = null;
let poolErrorLogged = false;

export const isLogsDbConfigured = (): boolean => {
    const url = process.env.LOG_DATABASE_URL;
    return Boolean(url && url.trim() !== '');
};

export const getLogsPool = (): Pool => {
    if (!isLogsDbConfigured()) {
        throw new Error(
            'Log database connection requested but LOG_DATABASE_URL is not configured.'
        );
    }

    if (!pool) {
        pool = new Pool({
            connectionString: process.env.LOG_DATABASE_URL,
            // Log writes are batched, so a modest pool is plenty. Keeping this
            // small protects the dedicated server from connection storms during
            // traffic spikes.
            max: Number(process.env.LOG_DB_POOL_MAX ?? 10),
            min: 0,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
            // Safety net: long-running analytical queries must not pin
            // connections indefinitely.
            statement_timeout: Number(process.env.LOG_DB_STATEMENT_TIMEOUT_MS ?? 30_000),
            application_name: 'infi-commerce-logs',
        });

        pool.on('error', (err) => {
            // An idle client error must not crash the process.
            if (!poolErrorLogged) {
                console.error('Log PostgreSQL idle client error:', err.message);
                poolErrorLogged = true;
                setTimeout(() => {
                    poolErrorLogged = false;
                }, 60_000).unref();
            }
        });
    }

    return pool;
};

export interface LogsDbStatus {
    configured: boolean;
    connected: boolean;
    error?: string;
}

/**
 * Verifies the logs database is reachable. Never throws, so server startup can
 * log a warning and continue rather than refusing to boot because the logging
 * cluster is briefly unavailable.
 */
export const connectLogsDatabase = async (): Promise<LogsDbStatus> => {
    if (!isLogsDbConfigured()) {
        console.warn(
            'LOG_DATABASE_URL is not configured. Dedicated Activity & API Logging is disabled.'
        );
        return { configured: false, connected: false };
    }

    try {
        const result = await queryLogs<{ ok: number }>('SELECT 1 AS ok');
        const connected = result.rows[0]?.ok === 1;

        if (connected) {
            console.log('Successfully connected to dedicated Log PostgreSQL server');
        }

        return { configured: true, connected };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to connect to dedicated Log PostgreSQL server:', message);
        return { configured: true, connected: false, error: message };
    }
};

export const queryLogs = async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> => {
    return getLogsPool().query<T>(text, params as never);
};

/**
 * Runs `fn` inside a checked-out client. Used by the bulk inserter so that a
 * multi-statement batch shares one connection.
 */
export const withLogsClient = async <T>(
    fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
    const client = await getLogsPool().connect();
    try {
        return await fn(client);
    } finally {
        client.release();
    }
};

export const closeLogsPool = async (): Promise<void> => {
    if (pool) {
        await pool.end();
        pool = null;
    }
};
