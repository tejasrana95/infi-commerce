import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
    deleteLogsInRange,
    getArchiveRecord,
    incrementArchiveDownloadCount,
    insertArchiveRecord,
    iterateLogsDescending,
    listArchiveRecords,
    type LogQueryFilters,
    type LogType,
} from '../repositories/logRepository';

/**
 * Log archival and purge.
 *
 * Two substantive fixes over the previous implementation:
 *
 *  1. MEMORY. It ran `find(filter).lean()` per collection, materialising the
 *     entire date range in the heap before serialising. Streaming a year of API
 *     logs would have exhausted memory long before finishing. Rows are now read
 *     with keyset pagination and appended to the output file incrementally, so
 *     peak memory is one batch regardless of range size.
 *
 *  2. CSV CORRECTNESS. It derived headers from `Object.keys(rows[0])`, so any
 *     row with a different key set silently misaligned every column, and values
 *     were written with `JSON.stringify` which is not CSV escaping. Headers now
 *     come from the fixed schema and every value is properly quoted.
 */

export interface ArchiveOptions {
    rangeType:
        | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days'
        | 'last_6_months' | 'last_year' | 'all_time' | 'custom';
    startDate?: Date;
    endDate?: Date;
    format: 'csv' | 'json';
    collections?: string[];
    purgeAfterArchive?: boolean;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
}

/** Public collection names, unchanged from the MongoDB implementation. */
const COLLECTION_TO_TYPE: Record<string, LogType> = {
    activity_logs: 'activity',
    audit_logs: 'audit',
    api_logs: 'api',
    security_logs: 'security',
    search_logs: 'search',
    system_logs: 'system',
};

const DEFAULT_COLLECTIONS = Object.keys(COLLECTION_TO_TYPE);

/**
 * Fixed CSV column order per collection, expressed in API field names. Because
 * the target schema is known, headers never depend on the data present in a
 * given range.
 */
const CSV_COLUMNS: Record<LogType, string[]> = {
    activity: ['_id', 'createdAt', 'requestId', 'traceId', 'correlationId', 'sessionId', 'storeId',
        'currency', 'language', 'timezone', 'channel', 'orderSource', 'actor', 'module',
        'activityType', 'action', 'status', 'details', 'ipAddress', 'userAgent', 'browser',
        'operatingSystem', 'deviceType', 'country', 'region', 'city'],
    api: ['_id', 'createdAt', 'requestId', 'traceId', 'correlationId', 'sessionId', 'storeId',
        'currency', 'language', 'timezone', 'channel', 'userType', 'userId', 'apiKeyId',
        'apiKeyName', 'method', 'url', 'route', 'controller', 'action', 'httpStatus',
        'responseTimeMs', 'payloadSizeBytes', 'ipAddress', 'forwardedIp', 'userAgent', 'browser',
        'operatingSystem', 'deviceType', 'platform', 'country', 'region', 'city', 'referer',
        'origin', 'responseStatus'],
    audit: ['_id', 'createdAt', 'requestId', 'storeId', 'channel', 'actor', 'module', 'entity',
        'entityId', 'action', 'changes', 'reason', 'ipAddress'],
    security: ['_id', 'createdAt', 'requestId', 'storeId', 'eventType', 'severity', 'actor',
        'ipAddress', 'userAgent', 'endpoint', 'details'],
    search: ['_id', 'createdAt', 'storeId', 'sessionId', 'customerId', 'userType', 'channel',
        'keyword', 'normalizedKeyword', 'resultCount', 'filters', 'sort', 'currency', 'language',
        'clickedProductId', 'purchasedAfterSearch', 'orderId', 'isNoResult', 'ipAddress'],
    system: ['_id', 'createdAt', 'source', 'level', 'message', 'stack', 'details'],
};

/** One batch worth of rows per keyset page. */
const STREAM_BATCH_SIZE = 1000;

/** Wraps a write stream, hashing and awaiting drain to apply backpressure. */
class ArchiveWriter {
    private readonly stream: fs.WriteStream;
    private readonly hash = crypto.createHash('sha256');
    private bytes = 0;

    constructor(filePath: string) {
        this.stream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
    }

    public async write(chunk: string): Promise<void> {
        this.hash.update(chunk);
        this.bytes += Buffer.byteLength(chunk, 'utf-8');

        if (!this.stream.write(chunk)) {
            await new Promise<void>((resolve, reject) => {
                const onDrain = () => {
                    cleanup();
                    resolve();
                };
                const onError = (error: Error) => {
                    cleanup();
                    reject(error);
                };
                const cleanup = () => {
                    this.stream.off('drain', onDrain);
                    this.stream.off('error', onError);
                };
                this.stream.once('drain', onDrain);
                this.stream.once('error', onError);
            });
        }
    }

    public async close(): Promise<{ size: number; checksum: string }> {
        await new Promise<void>((resolve, reject) => {
            this.stream.end((error?: Error | null) =>
                error ? reject(error) : resolve()
            );
        });
        return { size: this.bytes, checksum: this.hash.digest('hex') };
    }
}

/** RFC4180 style escaping: always quote, double any embedded quote. */
const csvValue = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
};

const csvRow = (row: Record<string, any>, columns: string[]): string =>
    `${columns.map((column) => csvValue(row[column])).join(',')}\n`;

class LogArchiveService {
    private readonly storageDir: string;

    constructor() {
        this.storageDir = path.join(process.cwd(), 'storage', 'archives');
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
        }
    }

    private calculateDateRange(
        rangeType: string,
        customStart?: Date,
        customEnd?: Date
    ): { start: Date; end: Date } {
        const end = customEnd ? new Date(customEnd) : new Date();
        let start = new Date();

        switch (rangeType) {
            case 'yesterday':
                start.setDate(end.getDate() - 1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_7_days':
                start.setDate(end.getDate() - 7);
                break;
            case 'last_30_days':
                start.setDate(end.getDate() - 30);
                break;
            case 'last_90_days':
                start.setDate(end.getDate() - 90);
                break;
            case 'last_6_months':
                start.setMonth(end.getMonth() - 6);
                break;
            case 'last_year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            case 'all_time':
                start = new Date(0);
                break;
            case 'custom':
                if (!customStart) throw new Error('Start date is required for custom range');
                start = new Date(customStart);
                break;
            default:
                start.setDate(end.getDate() - 7);
        }

        return { start, end };
    }

    private resolveCollections(collections?: string[]): string[] {
        const requested =
            collections && collections.length > 0 ? collections : DEFAULT_COLLECTIONS;
        const valid = requested.filter((name) => name in COLLECTION_TO_TYPE);

        if (valid.length === 0) {
            throw new Error(
                `No valid collections requested. Valid names: ${DEFAULT_COLLECTIONS.join(', ')}`
            );
        }
        return valid;
    }

    public async generateArchive(options: ArchiveOptions) {
        const { start, end } = this.calculateDateRange(
            options.rangeType,
            options.startDate,
            options.endDate
        );
        const targetCollections = this.resolveCollections(options.collections);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `log_archive_${options.rangeType}_${timestamp}.${options.format}`;
        const filePath = path.join(this.storageDir, archiveName);

        const filters: LogQueryFilters = {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        };

        const writer = new ArchiveWriter(filePath);
        let totalRecords = 0;

        try {
            if (options.format === 'json') {
                await writer.write('{\n');
                let firstCollection = true;

                for (const collection of targetCollections) {
                    const type = COLLECTION_TO_TYPE[collection];
                    if (!firstCollection) await writer.write(',\n');
                    firstCollection = false;

                    await writer.write(`  ${JSON.stringify(collection)}: [\n`);
                    let firstRow = true;

                    totalRecords += await iterateLogsDescending(
                        type,
                        filters,
                        STREAM_BATCH_SIZE,
                        async (rows) => {
                            const chunk = rows
                                .map((row) => {
                                    const line = `    ${JSON.stringify(row)}`;
                                    if (firstRow) {
                                        firstRow = false;
                                        return line;
                                    }
                                    return `,\n${line}`;
                                })
                                .join('');
                            await writer.write(chunk);
                        }
                    );

                    await writer.write('\n  ]');
                }

                await writer.write('\n}\n');
            } else {
                // A single collection yields a cleanly parseable CSV. When
                // several are requested the file is sectioned by collection,
                // because the collections have different columns.
                const sectioned = targetCollections.length > 1;

                for (const collection of targetCollections) {
                    const type = COLLECTION_TO_TYPE[collection];
                    const columns = CSV_COLUMNS[type];

                    if (sectioned) {
                        await writer.write(`\n=== COLLECTION: ${collection} ===\n`);
                    }
                    await writer.write(`${columns.join(',')}\n`);

                    totalRecords += await iterateLogsDescending(
                        type,
                        filters,
                        STREAM_BATCH_SIZE,
                        async (rows) => {
                            await writer.write(rows.map((row) => csvRow(row, columns)).join(''));
                        }
                    );
                }
            }
        } catch (error) {
            // Never leave a truncated file behind pretending to be an archive.
            try {
                await writer.close();
            } catch {
                /* ignore secondary failure */
            }
            fs.rmSync(filePath, { force: true });
            throw error;
        }

        const { size, checksum } = await writer.close();

        if (options.purgeAfterArchive) {
            await deleteLogsInRange(
                targetCollections.map((name) => COLLECTION_TO_TYPE[name]),
                start,
                end
            );
        }

        const inserted = await insertArchiveRecord({
            archiveName,
            rangeType: options.rangeType,
            startDate: start,
            endDate: end,
            format: options.format,
            collections: targetCollections,
            recordCount: totalRecords,
            fileSizeBytes: size,
            checksumSha256: checksum,
            storagePath: filePath,
            purgedAfterArchive: !!options.purgeAfterArchive,
            createdBy: options.createdBy,
        });

        return inserted;
    }

    public async getArchiveHistory() {
        return listArchiveRecords();
    }

    public async getArchiveFilePath(archiveId: string) {
        const archive = await getArchiveRecord(archiveId);
        if (!archive) return null;

        await incrementArchiveDownloadCount(archiveId);

        return {
            filePath: archive.storagePath as string,
            fileName: archive.archiveName as string,
        };
    }

    public async purgeLogs(
        rangeType: string,
        startDate?: Date,
        endDate?: Date,
        collections?: string[]
    ) {
        const { start, end } = this.calculateDateRange(rangeType, startDate, endDate);
        const targetCollections = this.resolveCollections(collections);

        const deletedRecords = await deleteLogsInRange(
            targetCollections.map((name) => COLLECTION_TO_TYPE[name]),
            start,
            end
        );

        return { deletedRecords, start, end };
    }
}

export const logArchiveService = new LogArchiveService();
export default logArchiveService;
