import mongoose, { Schema, Document } from 'mongoose';

/**
 * Product Review Model
 * Supports guest reviews and customer reviews with moderation workflow
 */
export interface IReview extends Document {
    storeId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;

    // Reviewer - either customer or guest
    customerId?: mongoose.Types.ObjectId;
    isGuestReview: boolean;
    guestName?: string;
    guestEmail?: string;
    guestEmailVerified: boolean;

    // Review content
    rating: number; // 1-5
    title: string;
    content: string;
    images?: string[];

    // Status and flags
    isApproved: boolean;
    isVerifiedPurchase: boolean;
    helpfulCount: number;
    votedBy: mongoose.Types.ObjectId[];
    reportCount: number;

    // Admin reply
    adminReply?: {
        content: string;
        repliedAt: Date;
        repliedBy: mongoose.Types.ObjectId;
    };

    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },

        // Reviewer info
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            default: null,
        },
        isGuestReview: {
            type: Boolean,
            required: true,
            default: false,
        },
        guestName: {
            type: String,
            trim: true,
        },
        guestEmail: {
            type: String,
            trim: true,
            lowercase: true,
        },
        guestEmailVerified: {
            type: Boolean,
            default: false,
        },

        // Review content
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
        images: [{
            type: String,
        }],

        // Status
        isApproved: {
            type: Boolean,
            default: false,
        },
        isVerifiedPurchase: {
            type: Boolean,
            default: false,
        },
        helpfulCount: {
            type: Number,
            default: 0,
        },
        votedBy: [{
            type: Schema.Types.ObjectId,
            ref: 'Customer',
        }],
        reportCount: {
            type: Number,
            default: 0,
        },

        // Admin reply
        adminReply: {
            content: { type: String, trim: true },
            repliedAt: { type: Date },
            repliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
ReviewSchema.index({ storeId: 1, productId: 1 });
ReviewSchema.index({ storeId: 1, isApproved: 1 });
ReviewSchema.index({ productId: 1, isApproved: 1, rating: -1 });
ReviewSchema.index({ customerId: 1 });
ReviewSchema.index({ guestEmail: 1 });

// Validate that either customerId or guest info is provided
ReviewSchema.pre('validate', function (this: IReview, next) {
    if (!this.isGuestReview && !this.customerId) {
        return next(new Error('Customer ID is required for non-guest reviews'));
    }
    if (this.isGuestReview && (!this.guestName || !this.guestEmail)) {
        return next(new Error('Guest name and email are required for guest reviews'));
    }
    next();
});

const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
