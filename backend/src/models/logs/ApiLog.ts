import mongoose, { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface IApiLog extends Document {
    requestId: string;
    traceId: string;
    correlationId?: string;
    sessionId?: string;
    storeId?: mongoose.Types.ObjectId;
    currency?: string;
    language?: string;
    timezone?: string;
    channel: string;
    userType: 'super_admin' | 'admin' | 'store_admin' | 'pos_user' | 'customer' | 'guest' | 'api_key' | 'system';
    userId?: string;
    apiKeyId?: string;
    apiKeyName?: string;
    method: string;
    url: string;
    route?: string;
    controller?: string;
    action?: string;
    httpStatus: number;
    responseTimeMs: number;
    payloadSizeBytes: number;
    ipAddress?: string;
    forwardedIp?: string;
    userAgent?: string;
    browser?: string;
    operatingSystem?: string;
    deviceType?: string;
    platform?: string;
    country?: string;
    region?: string;
    city?: string;
    referer?: string;
    origin?: string;
    requestHeaders?: Record<string, any>;
    responseHeaders?: Record<string, any>;
    requestBody?: Record<string, any>;
    queryParams?: Record<string, any>;
    responseStatus?: string;
    createdAt: Date;
}

const ApiLogSchema = new Schema<IApiLog>(
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
        userType: {
            type: String,
            enum: ['super_admin', 'admin', 'store_admin', 'pos_user', 'customer', 'guest', 'api_key', 'system'],
            required: true,
            index: true,
        },
        userId: { type: String, index: true },
        apiKeyId: { type: String, index: true },
        apiKeyName: { type: String },
        method: { type: String, required: true, index: true },
        url: { type: String, required: true },
        route: { type: String, index: true },
        controller: { type: String },
        action: { type: String },
        httpStatus: { type: Number, required: true, index: true },
        responseTimeMs: { type: Number, required: true, index: true },
        payloadSizeBytes: { type: Number, default: 0 },
        ipAddress: { type: String, index: true },
        forwardedIp: { type: String },
        userAgent: { type: String },
        browser: { type: String },
        operatingSystem: { type: String },
        deviceType: { type: String },
        platform: { type: String },
        country: { type: String, index: true },
        region: { type: String },
        city: { type: String },
        referer: { type: String },
        origin: { type: String },
        requestHeaders: { type: Schema.Types.Mixed },
        responseHeaders: { type: Schema.Types.Mixed },
        requestBody: { type: Schema.Types.Mixed },
        queryParams: { type: Schema.Types.Mixed },
        responseStatus: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

ApiLogSchema.index({ storeId: 1, createdAt: -1 });
ApiLogSchema.index({ httpStatus: 1, createdAt: -1 });
ApiLogSchema.index({ responseTimeMs: -1 });
ApiLogSchema.index({ createdAt: -1 });
ApiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 86400 }); // 30 day TTL for raw API logs

export const getApiLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.ApiLog || conn.model<IApiLog>('ApiLog', ApiLogSchema);
};

export default getApiLogModel;
