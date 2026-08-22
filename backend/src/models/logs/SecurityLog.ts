import mongoose, { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface ISecurityLog extends Document {
    requestId?: string;
    storeId?: mongoose.Types.ObjectId;
    eventType: 'FAILED_LOGIN' | 'SUSPICIOUS_IP' | 'RATE_LIMIT_EXCEEDED' | 'UNAUTHORIZED_ACCESS' | 'API_KEY_REVOKED' | 'PASSWORD_RESET_REQUEST' | 'PERMISSION_DENIED';
    severity: 'low' | 'medium' | 'high' | 'critical';
    actor?: {
        type?: string;
        id?: string;
        email?: string;
    };
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    details?: Record<string, any>;
    createdAt: Date;
}

const SecurityLogSchema = new Schema<ISecurityLog>(
    {
        requestId: { type: String, index: true },
        storeId: { type: Schema.Types.ObjectId, index: true },
        eventType: { type: String, required: true, index: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true, index: true },
        actor: {
            type: { type: String },
            id: { type: String, index: true },
            email: { type: String },
        },
        ipAddress: { type: String, index: true },
        userAgent: { type: String },
        endpoint: { type: String, index: true },
        details: { type: Schema.Types.Mixed },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

SecurityLogSchema.index({ storeId: 1, createdAt: -1 });
SecurityLogSchema.index({ eventType: 1, severity: 1, createdAt: -1 });
SecurityLogSchema.index({ createdAt: -1 });
SecurityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 86400 });

export const getSecurityLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.SecurityLog || conn.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
};

export default getSecurityLogModel;
