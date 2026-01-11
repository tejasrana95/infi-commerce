import mongoose, { Schema, Document } from 'mongoose';

/**
 * Content Card Model - Generic content cards for jobs, events, features, etc.
 */
export interface IContentCard extends Document {
    storeId: mongoose.Types.ObjectId;

    // Content
    title: string;
    slug: string;

    // Visual (Image or Icon)
    visualType: 'image' | 'icon';       // Choose between image or icon
    image?: string;                     // Featured image URL (if visualType is 'image')
    icon?: string;                      // Icon identifier (if visualType is 'icon')

    excerpt?: string;                   // Short summary
    content: string;                    // Rich text content

    // Metadata (flexible key-value pairs with icons)
    metadata: Array<{
        icon?: string;                  // Icon identifier
        label: string;                  // e.g., "Location", "Type"
        value: string;                  // e.g., "San Francisco", "Full Time"
    }>;

    // Value Display (e.g., salary, price)
    valueDisplay?: {
        prefix?: string;                // e.g., "$", "€"
        amount: string;                 // e.g., "30000", "Full Time"
        postfix?: string;               // e.g., "/yr", "/month"
    };

    // Categorization
    categoryId?: mongoose.Types.ObjectId;
    tags: string[];

    // Actions (Buttons)
    buttons: Array<{
        label: string;
        url: string;
        isPrimary: boolean;
        openInNewTab: boolean;
    }>;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        canonicalUrl?: string;
        score?: number;
    };

    // Publishing
    status: 'draft' | 'published' | 'archived';
    publishedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ContentCardSchema = new Schema<IContentCard>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        visualType: {
            type: String,
            enum: ['image', 'icon'],
            default: 'image',
        },
        image: {
            type: String,
            trim: true,
        },
        icon: {
            type: String,
            trim: true,
        },
        excerpt: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        content: {
            type: String,
            required: true,
            maxlength: 100000,
        },

        metadata: [{
            icon: { type: String, trim: true },
            label: { type: String, required: true, trim: true, maxlength: 50 },
            value: { type: String, required: true, trim: true, maxlength: 200 },
        }],

        valueDisplay: {
            prefix: { type: String, trim: true, maxlength: 10 },
            amount: { type: String, trim: true, maxlength: 50 },
            postfix: { type: String, trim: true, maxlength: 20 },
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'ContentCardCategory',
            index: true,
        },
        tags: {
            type: [String],
            default: [],
        },

        buttons: [{
            label: { type: String, required: true, trim: true, maxlength: 50 },
            url: { type: String, required: true, trim: true },
            isPrimary: { type: Boolean, default: false },
            openInNewTab: { type: Boolean, default: false },
        }],

        seo: {
            metaTitle: { type: String, trim: true, maxlength: 60 },
            metaDescription: { type: String, trim: true, maxlength: 160 },
            metaKeywords: { type: [String], default: [] },
            ogImage: { type: String, trim: true },
            canonicalUrl: { type: String, trim: true },
            score: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
            },
        },

        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true,
        },
        publishedAt: {
            type: Date,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ContentCardSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ContentCardSchema.index({ storeId: 1, status: 1, publishedAt: -1 });
ContentCardSchema.index({ storeId: 1, categoryId: 1 });
ContentCardSchema.index({ storeId: 1, tags: 1 });

// Validation: Max 2 buttons
ContentCardSchema.pre('save', function (next) {
    if (this.buttons && this.buttons.length > 2) {
        return next(new Error('Maximum 2 buttons allowed per content card'));
    }

    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

// Update category card counts after save
ContentCardSchema.post('save', async function () {
    if (this.categoryId) {
        const ContentCardCategory = mongoose.model('ContentCardCategory');
        const count = await mongoose.model('ContentCard').countDocuments({
            categoryId: this.categoryId,
            status: 'published',
        });
        await ContentCardCategory.updateOne({ _id: this.categoryId }, { cardCount: count });
    }
});

// Update category card counts after delete
ContentCardSchema.post('findOneAndDelete', async function (doc) {
    if (doc && doc.categoryId) {
        const ContentCardCategory = mongoose.model('ContentCardCategory');
        const count = await mongoose.model('ContentCard').countDocuments({
            categoryId: doc.categoryId,
            status: 'published',
        });
        await ContentCardCategory.updateOne({ _id: doc.categoryId }, { cardCount: count });
    }
});

const ContentCard = mongoose.model<IContentCard>('ContentCard', ContentCardSchema);

export default ContentCard;
