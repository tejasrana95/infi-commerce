import getActivityLogModel from '../models/logs/ActivityLog';
import getAuditLogModel from '../models/logs/AuditLog';
import getApiLogModel from '../models/logs/ApiLog';
import getSearchLogModel from '../models/logs/SearchLog';
import getSecurityLogModel from '../models/logs/SecurityLog';
import getSystemLogModel from '../models/logs/SystemLog';
import { isLogDbConfigured } from '../config/logDatabase';

export type LogType = 'activity' | 'audit' | 'api' | 'search' | 'security' | 'system';

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

    constructor() {
        this.startWorker();
    }

    private startWorker(): void {
        if (!this.timer) {
            this.timer = setInterval(() => {
                this.flush();
            }, this.flushIntervalMs);
        }
    }

    public enqueue(type: LogType, payload: Record<string, any>): void {
        if (!isLogDbConfigured()) {
            return;
        }

        // Back-pressure protection
        if (this.queue.length >= this.maxQueueSize) {
            // Drop oldest item to prevent memory exhaustion
            this.queue.shift();
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
            setImmediate(() => this.flush());
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
            const grouped: Record<LogType, any[]> = {
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

            const insertPromises: Promise<any>[] = [];

            if (grouped.activity.length > 0) {
                insertPromises.push(getActivityLogModel().insertMany(grouped.activity, { ordered: false }));
            }
            if (grouped.audit.length > 0) {
                insertPromises.push(getAuditLogModel().insertMany(grouped.audit, { ordered: false }));
            }
            if (grouped.api.length > 0) {
                insertPromises.push(getApiLogModel().insertMany(grouped.api, { ordered: false }));
            }
            if (grouped.search.length > 0) {
                insertPromises.push(getSearchLogModel().insertMany(grouped.search, { ordered: false }));
            }
            if (grouped.security.length > 0) {
                insertPromises.push(getSecurityLogModel().insertMany(grouped.security, { ordered: false }));
            }
            if (grouped.system.length > 0) {
                insertPromises.push(getSystemLogModel().insertMany(grouped.system, { ordered: false }));
            }

            await Promise.allSettled(insertPromises);
        } catch (error) {
            console.error('LogQueueWorker Flush Error:', error);
        } finally {
            this.isProcessing = false;

            // If remaining items exist beyond batchSize, process immediately
            if (this.queue.length >= this.batchSize) {
                setImmediate(() => this.flush());
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
        };
    }
}

export const logQueueService = new LogQueueService();
export default logQueueService;
