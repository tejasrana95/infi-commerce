import mongoose, { Schema, Document } from 'mongoose';

/**
 * User Interest Model for Personalized Recommendations
 * Tracks user browsing behavior, searches, and purchases
 * to provide personalized product suggestions
 * 
 * SCALABILITY FEATURES:
 * - TTL index auto-expires guest sessions after 30 days
 * - Array limits prevent unbounded growth (50 views, 30 searches, 100 purchases)
 * - Static cleanup method for scheduled maintenance
 * - Efficient compound indexes for queries
 */

// Configuration constants for scalability
const MAX_VIEWED_PRODUCTS = 50;     // Keep only last 50 views
const MAX_SEARCH_QUERIES = 30;      // Keep only last 30 searches
const MAX_PURCHASED_PRODUCTS = 100; // Keep last 100 purchases
const GUEST_SESSION_TTL_DAYS = 30;  // Auto-delete guest sessions after 30 days

export interface IViewedProduct {
    productId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    tags: string[];
    viewedAt: Date;
}

export interface ISearchQuery {
    query: string;
    searchedAt: Date;
}

export interface IPurchasedProduct {
    productId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    purchasedAt: Date;
}

export interface IUserInterest extends Document {
    storeId: mongoose.Types.ObjectId;
    userId?: mongoose.Types.ObjectId;
    sessionId?: string;

    viewedProducts: IViewedProduct[];
    searchQueries: ISearchQuery[];
    purchasedProducts: IPurchasedProduct[];

    // For TTL - tracks when guest session should expire
    expiresAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ViewedProductSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    categoryIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
    }],
    tags: [String],
    viewedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const SearchQuerySchema = new Schema({
    query: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200, // Limit query length
    },
    searchedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const PurchasedProductSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    categoryIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
    }],
    purchasedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const UserInterestSchema = new Schema<IUserInterest>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            index: true,
            sparse: true,
        },
        sessionId: {
            type: String,
            index: true,
            sparse: true,
        },
        viewedProducts: {
            type: [ViewedProductSchema],
            default: [],
        },
        searchQueries: {
            type: [SearchQuerySchema],
            default: [],
        },
        purchasedProducts: {
            type: [PurchasedProductSchema],
            default: [],
        },
        // TTL field - only set for guest sessions
        expiresAt: {
            type: Date,
            index: { expireAfterSeconds: 0 }, // MongoDB TTL index
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
UserInterestSchema.index({ storeId: 1, userId: 1 });
UserInterestSchema.index({ storeId: 1, sessionId: 1 });
UserInterestSchema.index({ 'viewedProducts.viewedAt': -1 });
UserInterestSchema.index({ 'purchasedProducts.purchasedAt': -1 });
UserInterestSchema.index({ updatedAt: 1 }); // For cleanup queries

// Pre-save middleware to enforce array limits and set TTL
UserInterestSchema.pre('save', function (next) {
    // Enforce array size limits
    if (this.viewedProducts.length > MAX_VIEWED_PRODUCTS) {
        // Keep most recent
        this.viewedProducts = this.viewedProducts
            .sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime())
            .slice(0, MAX_VIEWED_PRODUCTS);
    }

    if (this.searchQueries.length > MAX_SEARCH_QUERIES) {
        // Keep most recent
        this.searchQueries = this.searchQueries
            .sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime())
            .slice(0, MAX_SEARCH_QUERIES);
    }

    if (this.purchasedProducts.length > MAX_PURCHASED_PRODUCTS) {
        // Keep most recent
        this.purchasedProducts = this.purchasedProducts
            .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
            .slice(0, MAX_PURCHASED_PRODUCTS);
    }

    // Set TTL for guest sessions (no userId)
    if (this.sessionId && !this.userId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + GUEST_SESSION_TTL_DAYS);
        this.expiresAt = expiresAt;
    } else {
        // Remove TTL for logged-in users
        this.expiresAt = undefined;
    }

    next();
});

// Methods to clean old data
UserInterestSchema.methods.cleanOldData = function (retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    this.viewedProducts = this.viewedProducts.filter(
        (v: IViewedProduct) => v.viewedAt > cutoffDate
    );
    this.searchQueries = this.searchQueries.filter(
        (s: ISearchQuery) => s.searchedAt > cutoffDate
    );

    return this.save();
};

// Static method to get or create interest record
UserInterestSchema.statics.getOrCreate = async function (
    storeId: string,
    userId?: string,
    sessionId?: string
) {
    const query: any = { storeId };

    if (userId) {
        query.userId = userId;
    } else if (sessionId) {
        query.sessionId = sessionId;
    } else {
        throw new Error('Either userId or sessionId is required');
    }

    let interest = await this.findOne(query);

    if (!interest) {
        interest = await this.create(query);
    }

    return interest;
};

/**
 * Static method to clean up old/stale data
 * Run this as a scheduled job (e.g., daily via cron)
 */
UserInterestSchema.statics.cleanupStaleData = async function (retentionDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Remove old entries from arrays in bulk
    const result = await this.updateMany(
        {},
        {
            $pull: {
                viewedProducts: { viewedAt: { $lt: cutoffDate } },
                searchQueries: { searchedAt: { $lt: cutoffDate } },
            },
        }
    );

    // Delete empty records with no userId (orphaned guest sessions)
    await this.deleteMany({
        userId: { $exists: false },
        viewedProducts: { $size: 0 },
        searchQueries: { $size: 0 },
        purchasedProducts: { $size: 0 },
    });

    return result;
};

/**
 * Static method to get database statistics
 */
UserInterestSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                avgViewedProducts: { $avg: { $size: '$viewedProducts' } },
                avgSearchQueries: { $avg: { $size: '$searchQueries' } },
                avgPurchasedProducts: { $avg: { $size: '$purchasedProducts' } },
                guestSessions: {
                    $sum: { $cond: [{ $eq: ['$userId', null] }, 1, 0] }
                },
                userRecords: {
                    $sum: { $cond: [{ $ne: ['$userId', null] }, 1, 0] }
                },
            },
        },
    ]);

    return stats[0] || {
        totalRecords: 0,
        avgViewedProducts: 0,
        avgSearchQueries: 0,
        avgPurchasedProducts: 0,
        guestSessions: 0,
        userRecords: 0,
    };
};

const UserInterest = mongoose.model<IUserInterest>('UserInterest', UserInterestSchema);

export default UserInterest;

