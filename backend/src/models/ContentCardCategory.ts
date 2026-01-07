import mongoose, { Schema, Document } from 'mongoose';

/**
 * Content Card Category Model - Categories for organizing content cards
 */
export interface IContentCardCategory extends Document {
    storeId: mongoose.Types.ObjectId;

    // Basic Info
    name: string;
    slug: string;
    description?: string;
    icon?: string;                      // Icon identifier for category

    // Display
    displayOrder: number;
    isActive: boolean;

    // Stats
    cardCount: number;                  // Number of cards in this category

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };

    createdAt: Date;
    updatedAt: Date;
}

const ContentCardCategorySchema = new Schema<IContentCardCategory>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        icon: {
            type: String,
            trim: true,
        },

        displayOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        cardCount: {
            type: Number,
            default: 0,
        },

        seo: {
            metaTitle: { type: String, trim: true, maxlength: 60 },
            metaDescription: { type: String, trim: true, maxlength: 160 },
            metaKeywords: { type: [String], default: [] },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ContentCardCategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
ContentCardCategorySchema.index({ storeId: 1, isActive: 1, displayOrder: 1 });

const ContentCardCategory = mongoose.model<IContentCardCategory>('ContentCardCategory', ContentCardCategorySchema);

export default ContentCardCategory;
