import { bulkInsertLogs, LogType } from '../repositories/logRepository';
import { isLogsDbConfigured } from '../db/postgres/logsClient';

/**
 * Buffered, best-effort log writer.
 *
 * Public surface is unchanged from the MongoDB implementation
 * (enqueueActivity / enqueueAudit / enqueueApi / enqueueSearch / enqueueSecurity
 * / enqueueSystem), so no caller needed to change. Only the sink moved: each
 * flush now issues one multi-row INSERT per log type into the partitioned
 * Postgres tables instead of six `insertMany` calls.
 *
 * Logging must never break a request path, so failures are counted and logged
 * rather than thrown.
 */

export type { LogType };

export interface QueueItem {
    type: LogType;
    payload: Record<string, any>;
    timestamp: Date;
}

class LogQueueService {
    private queue: QueueItem[] = [];
    private readonly maxQueueSize = 5000;
    private readonly batchSize = 100;
    private readonly flushIntervalMs = 500;
    private timer: NodeJS.Timeout | null = null;
    private isProcessing = false;

    /** Observability counters, surfaced via getQueueStats(). */
    private droppedCount = 0;
    private failedFlushCount = 0;
    private writtenCount = 0;

    constructor() {
        this.startWorker();
    }

    private startWorker(): void {
        if (!this.timer) {
            this.timer = setInterval(() => {
                void this.flush();
            }, this.flushIntervalMs);
            // Do not keep the event loop alive purely for the log flusher.
            this.timer.unref?.();
        }
    }

    public enqueue(type: LogType, payload: Record<string, any>): void {
        if (!isLogsDbConfigured()) {
            return;
        }

        // Back-pressure protection: shed the oldest item rather than growing
        // without bound and exhausting the heap.
        if (this.queue.length >= this.maxQueueSize) {
            this.queue.shift();
            this.droppedCount += 1;
            if (this.droppedCount % 1000 === 1) {
                console.warn(
                    `Log queue is saturated (max ${this.maxQueueSize}); dropped ${this.droppedCount} oldest entries.`
                );
            }
        }

        this.queue.push({
            type,
            payload: {
                ...payload,
                createdAt: payload.createdAt || new Date(),
            },
            timestamp: new Date(),
        });

        if (this.queue.length >= this.batchSize) {
            setImmediate(() => void this.flush());
        }
    }

    public enqueueActivity(payload: Record<string, any>): void {
        this.enqueue('activity', payload);
    }

    public enqueueAudit(payload: Record<string, any>): void {
        this.enqueue('audit', payload);
    }

    public enqueueApi(payload: Record<string, any>): void {
        this.enqueue('api', payload);
    }

    public enqueueSearch(payload: Record<string, any>): void {
        this.enqueue('search', payload);
    }

    public enqueueSecurity(payload: Record<string, any>): void {
        this.enqueue('security', payload);
    }

    public enqueueSystem(payload: Record<string, any>): void {
        this.enqueue('system', payload);
    }

    public async flush(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        const batch = this.queue.splice(0, this.batchSize);

        try {
            const grouped: Record<LogType, Record<string, any>[]> = {
                activity: [],
                audit: [],
                api: [],
                search: [],
                security: [],
                system: [],
            };

            for (const item of batch) {
                grouped[item.type].push(item.payload);
            }

            const types = Object.keys(grouped) as LogType[];
            const results = await Promise.allSettled(
                types.map((type) => bulkInsertLogs(type, grouped[type]))
            );

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    this.writtenCount += result.value;
                } else {
                    this.failedFlushCount += 1;
                    console.error('LogQueueWorker flush failure:', result.reason);
                }
            }
        } catch (error) {
            this.failedFlushCount += 1;
            console.error('LogQueueWorker Flush Error:', error);
        } finally {
            this.isProcessing = false;

            // If the backlog still exceeds a batch, drain immediately.
            if (this.queue.length >= this.batchSize) {
                setImmediate(() => void this.flush());
            }
        }
    }

    public async shutdown(): Promise<void> {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        while (this.queue.length > 0) {
            await this.flush();
        }
    }

    public getQueueStats() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            writtenCount: this.writtenCount,
            droppedCount: this.droppedCount,
            failedFlushCount: this.failedFlushCount,
        };
    }
}

export const logQueueService = new LogQueueService();
export default logQueueService;
