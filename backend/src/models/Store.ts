import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo?: string;
    favicon?: string;
    currency: string;
    timezone: string;
    isActive: boolean;

    // SEO Fields
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        ogTitle?: string;
        ogDescription?: string;
    };

    // Store Configuration
    settings: {
        emailNotifications?: boolean;
        orderNotifications?: boolean;
        maintenanceMode?: boolean;
        allowGuestCheckout?: boolean;
        requireEmailVerification?: boolean;
        minOrderAmount?: number;
        maxOrderAmount?: number;
        taxEnabled?: boolean;
        taxRate?: number;
        shippingEnabled?: boolean;
        [key: string]: any;
    };

    createdAt: Date;
    updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
        },
        favicon: {
            type: String,
        },
        currency: {
            type: String,
            required: true,
            default: 'USD',
            uppercase: true,
            maxlength: 3,
        },
        timezone: {
            type: String,
            required: true,
            default: 'UTC',
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        seo: {
            metaTitle: { type: String, trim: true },
            metaDescription: { type: String, trim: true },
            metaKeywords: [{ type: String, trim: true }],
            ogImage: { type: String },
            ogTitle: { type: String, trim: true },
            ogDescription: { type: String, trim: true },
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {
                emailNotifications: true,
                orderNotifications: true,
                maintenanceMode: false,
                allowGuestCheckout: true,
                requireEmailVerification: false,
                taxEnabled: false,
                shippingEnabled: true,
                // Review settings
                reviewSettings: {
                    allowReviews: true,
                    allowGuestReviews: true,
                    requireGuestEmailVerification: false,
                    requireApproval: true,
                    minRating: 1,
                    maxRating: 5,
                    allowImages: true,
                    maxImagesPerReview: 5,
                },
            },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
StoreSchema.index({ slug: 1 });
StoreSchema.index({ domain: 1 });
StoreSchema.index({ isActive: 1 });

const Store = mongoose.model<IStore>('Store', StoreSchema);

export default Store;
