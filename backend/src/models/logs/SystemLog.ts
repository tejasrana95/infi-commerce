import { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface ISystemLog extends Document {
    source: 'cron' | 'event_worker' | 'queue' | 'database' | 'socket' | 'system';
    level: 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    stack?: string;
    details?: Record<string, any>;
    createdAt: Date;
}

const SystemLogSchema = new Schema<ISystemLog>(
    {
        source: { type: String, required: true, index: true },
        level: { type: String, enum: ['info', 'warn', 'error', 'fatal'], required: true, index: true },
        message: { type: String, required: true },
        stack: { type: String },
        details: { type: Schema.Types.Mixed },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

SystemLogSchema.index({ source: 1, level: 1, createdAt: -1 });
SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });

export const getSystemLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.SystemLog || conn.model<ISystemLog>('SystemLog', SystemLogSchema);
};

export default getSystemLogModel;
