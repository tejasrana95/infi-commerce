import {
    connectLogsDatabase,
    isLogsDbConfigured,
    closeLogsPool,
    LOG_DB_SCHEMA,
    type LogsDbStatus,
} from '../db/postgres/logsClient';

/**
 * Compatibility facade for the logging data store.
 *
 * The logging subsystem moved from a dedicated MongoDB cluster to a dedicated
 * PostgreSQL server (see scripts/postgres/logs/*.sql). This module keeps the
 * historical function names so existing call sites - notably
 * activityLogger.middleware.ts, which gates all logging behind
 * `isLogDbConfigured()` - did not need to change.
 *
 * The previous Mongoose-specific `getLogDbConnection()` is gone along with the
 * seven Mongoose log models: all log access now goes through
 * src/repositories/logRepository.ts.
 */

/** True when LOG_DATABASE_URL is present. Gates all log capture. */
export const isLogDbConfigured = (): boolean => isLogsDbConfigured();

/**
 * Verifies the logs database is reachable. Deliberately non-throwing so a
 * briefly unavailable logging server cannot prevent the API from booting.
 */
export const connectLogDatabase = async (): Promise<LogsDbStatus> =>
    connectLogsDatabase();

export const disconnectLogDatabase = async (): Promise<void> => closeLogsPool();

export { LOG_DB_SCHEMA };
export type { LogsDbStatus };
