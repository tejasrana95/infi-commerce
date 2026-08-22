import mongoose, { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface IAuditLog extends Document {
    requestId: string;
    storeId?: mongoose.Types.ObjectId;
    actor: {
        type: 'super_admin' | 'admin' | 'store_admin' | 'pos_user' | 'customer' | 'api_key' | 'system';
        id?: string;
        name?: string;
        email?: string;
    };
    module: string;
    entity: string; // e.g. 'Order', 'Product', 'Role', 'Setting', 'Coupon'
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLE_CHANGE' | 'PERMISSION_CHANGE';
    changes?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
    };
    reason?: string;
    ipAddress?: string;
    channel?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        requestId: { type: String, required: true, index: true },
        storeId: { type: Schema.Types.ObjectId, index: true },
        channel: { type: String, index: true },
        actor: {
            type: {
                type: String,
                enum: ['super_admin', 'admin', 'store_admin', 'pos_user', 'customer', 'api_key', 'system'],
                required: true,
                index: true,
            },
            id: { type: String, index: true },
            name: { type: String },
            email: { type: String },
        },
        module: { type: String, required: true, index: true },
        entity: { type: String, required: true, index: true },
        entityId: { type: String, required: true, index: true },
        action: {
            type: String,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'ROLE_CHANGE', 'PERMISSION_CHANGE'],
            required: true,
            index: true,
        },
        changes: {
            before: { type: Schema.Types.Mixed },
            after: { type: Schema.Types.Mixed },
        },
        reason: { type: String },
        ipAddress: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

AuditLogSchema.index({ storeId: 1, createdAt: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
AuditLogSchema.index({ 'actor.id': 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const getAuditLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.AuditLog || conn.model<IAuditLog>('AuditLog', AuditLogSchema);
};

export default getAuditLogModel;
