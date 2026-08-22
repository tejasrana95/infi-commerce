import mongoose, { Schema, Document } from 'mongoose';
import { getLogDbConnection } from '../../config/logDatabase';

export interface ISearchLog extends Document {
    storeId?: mongoose.Types.ObjectId;
    sessionId?: string;
    customerId?: string;
    userType: 'customer' | 'guest' | 'admin' | 'pos_user';
    channel: string;
    keyword: string;
    normalizedKeyword: string;
    resultCount: number;
    filters?: {
        category?: string[];
        brand?: string[];
        priceMin?: number;
        priceMax?: number;
        rating?: number;
        inStockOnly?: boolean;
        customAttributes?: Record<string, any>;
    };
    sort?: string;
    currency?: string;
    language?: string;
    clickedProductId?: string;
    purchasedAfterSearch?: boolean;
    orderId?: string;
    isNoResult: boolean;
    ipAddress?: string;
    createdAt: Date;
}

const SearchLogSchema = new Schema<ISearchLog>(
    {
        storeId: { type: Schema.Types.ObjectId, index: true },
        sessionId: { type: String, index: true },
        customerId: { type: String, index: true },
        userType: { type: String, required: true, index: true },
        channel: { type: String, required: true, index: true },
        keyword: { type: String, required: true, index: true },
        normalizedKeyword: { type: String, required: true, index: true },
        resultCount: { type: Number, required: true, index: true },
        filters: { type: Schema.Types.Mixed },
        sort: { type: String },
        currency: { type: String },
        language: { type: String },
        clickedProductId: { type: String, index: true },
        purchasedAfterSearch: { type: Boolean, default: false, index: true },
        orderId: { type: String, index: true },
        isNoResult: { type: Boolean, required: true, index: true },
        ipAddress: { type: String },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

SearchLogSchema.index({ storeId: 1, normalizedKeyword: 1, createdAt: -1 });
SearchLogSchema.index({ isNoResult: 1, createdAt: -1 });
SearchLogSchema.index({ createdAt: -1 });
SearchLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 }); // 180 day retention

export const getSearchLogModel = () => {
    const conn = getLogDbConnection();
    return conn.models.SearchLog || conn.model<ISearchLog>('SearchLog', SearchLogSchema);
};

export default getSearchLogModel;
