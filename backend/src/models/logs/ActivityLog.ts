import mongoose, { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface IActivityLog extends Document {
    requestId: string;
    traceId: string;
    correlationId?: string;
    sessionId?: string;
    storeId?: mongoose.Types.ObjectId;
    currency?: string;
    language?: string;
    timezone?: string;
    channel: string; // Storefront, Admin, POS, API, Webhook, Cron, CLI
    orderSource?: string; // Storefront, Admin, POS, API, Webhook, Import, Draft Order
    actor: {
        type: 'super_admin' | 'admin' | 'store_admin' | 'pos_user' | 'customer' | 'guest' | 'api_key' | 'system';
        id?: string;
        name?: string;
        email?: string;
        apiKeyId?: string;
        apiKeyName?: string;
    };
    module: string; // Auth, Orders, Products, Cart, POS, CMS, Settings, Webhook
    activityType: string; // e.g. LOGIN_SUCCESS, ORDER_CREATED, POS_SHIFT_OPEN, CART_ITEM_ADDED
    action: string;
    status: 'success' | 'failed' | 'warning';
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    browser?: string;
    operatingSystem?: string;
    deviceType?: string;
    country?: string;
    region?: string;
    city?: string;
    createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
    {
        requestId: { type: String, required: true, index: true },
        traceId: { type: String, required: true, index: true },
        correlationId: { type: String, index: true },
        sessionId: { type: String, index: true },
        storeId: { type: Schema.Types.ObjectId, index: true },
        currency: { type: String },
        language: { type: String },
        timezone: { type: String },
        channel: { type: String, required: true, index: true },
        orderSource: { type: String, index: true },
        actor: {
            type: {
                type: String,
                enum: ['super_admin', 'admin', 'store_admin', 'pos_user', 'customer', 'guest', 'api_key', 'system'],
                required: true,
                index: true,
            },
            id: { type: String, index: true },
            name: { type: String },
            email: { type: String },
            apiKeyId: { type: String, index: true },
            apiKeyName: { type: String },
        },
        module: { type: String, required: true, index: true },
        activityType: { type: String, required: true, index: true },
        action: { type: String, required: true },
        status: { type: String, enum: ['success', 'failed', 'warning'], required: true, index: true },
        details: { type: Schema.Types.Mixed },
        ipAddress: { type: String, index: true },
        userAgent: { type: String },
        browser: { type: String },
        operatingSystem: { type: String },
        deviceType: { type: String },
        country: { type: String, index: true },
        region: { type: String },
        city: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Performance Indexes
ActivityLogSchema.index({ storeId: 1, createdAt: -1 });
ActivityLogSchema.index({ 'actor.id': 1, createdAt: -1 });
ActivityLogSchema.index({ activityType: 1, createdAt: -1 });
ActivityLogSchema.index({ channel: 1, createdAt: -1 });
ActivityLogSchema.index({ orderSource: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

// TTL Retention Index (Default 365 Days)
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const getActivityLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.ActivityLog || conn.model<IActivityLog>('ActivityLog', ActivityLogSchema);
};

export default getActivityLogModel;
