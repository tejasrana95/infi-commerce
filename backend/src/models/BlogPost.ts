import mongoose, { Schema, Document } from 'mongoose';

/**
 * Blog Post Model - Blog articles with rich content
 */
export interface IBlogPost extends Document {
    storeId: mongoose.Types.ObjectId;

    // Content
    title: string;
    slug: string;
    excerpt?: string;                   // Short summary
    content: string;                    // Rich text HTML
    featuredImage?: string;

    // Categorization
    categoryIds: mongoose.Types.ObjectId[];
    tags: string[];

    // Author
    author: {
        name: string;
        avatar?: string;
        bio?: string;
        userId?: mongoose.Types.ObjectId; // Link to admin user
    };

    // Related products (for product-related blog posts)
    relatedProducts?: mongoose.Types.ObjectId[];

    // Custom layout (optional)
    layoutId?: mongoose.Types.ObjectId;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        canonicalUrl?: string;
    };

    // Publishing
    status: 'draft' | 'published' | 'scheduled' | 'archived';
    publishedAt?: Date;
    scheduledAt?: Date;

    // Engagement
    viewCount: number;
    likeCount: number;
    commentCount: number;

    // Settings
    allowComments: boolean;
    isFeatured: boolean;
    isPinned: boolean;

    // Reading time (auto-calculated)
    readingTime?: number;               // Minutes

    createdAt: Date;
    updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
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
            maxlength: 300,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
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
            maxlength: 1000000,         // ~1MB of HTML
        },
        featuredImage: {
            type: String,
            trim: true,
        },

        categoryIds: [{
            type: Schema.Types.ObjectId,
            ref: 'BlogCategory',
        }],
        tags: {
            type: [String],
            default: [],
        },

        author: {
            name: { type: String, required: true, trim: true },
            avatar: { type: String, trim: true },
            bio: { type: String, trim: true, maxlength: 500 },
            userId: { type: Schema.Types.ObjectId, ref: 'User' },
        },

        relatedProducts: [{
            type: Schema.Types.ObjectId,
            ref: 'Product',
        }],

        layoutId: {
            type: Schema.Types.ObjectId,
            ref: 'Layout',
        },

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
            enum: ['draft', 'published', 'scheduled', 'archived'],
            default: 'draft',
            index: true,
        },
        publishedAt: {
            type: Date,
            index: true,
        },
        scheduledAt: {
            type: Date,
        },

        viewCount: {
            type: Number,
            default: 0,
        },
        likeCount: {
            type: Number,
            default: 0,
        },
        commentCount: {
            type: Number,
            default: 0,
        },

        allowComments: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },

        readingTime: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
BlogPostSchema.index({ storeId: 1, slug: 1 }, { unique: true });
BlogPostSchema.index({ storeId: 1, status: 1, publishedAt: -1 });
BlogPostSchema.index({ storeId: 1, categoryIds: 1 });
BlogPostSchema.index({ storeId: 1, tags: 1 });
BlogPostSchema.index({ storeId: 1, isFeatured: 1 });
BlogPostSchema.index({ storeId: 1, isPinned: 1 });
BlogPostSchema.index({ 'author.userId': 1 });

// Calculate reading time before save
BlogPostSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        // Strip HTML and count words
        const text = this.content.replace(/<[^>]*>/g, '');
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        // Average reading speed: 200 words per minute
        this.readingTime = Math.ceil(wordCount / 200);
    }

    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    next();
});

// Update category post counts after save
BlogPostSchema.post('save', async function () {
    if (this.categoryIds && this.categoryIds.length > 0) {
        const BlogCategory = mongoose.model('BlogCategory');
        for (const categoryId of this.categoryIds) {
            const count = await mongoose.model('BlogPost').countDocuments({
                categoryIds: categoryId,
                status: 'published',
            });
            await BlogCategory.updateOne({ _id: categoryId }, { postCount: count });
        }
    }
});

const BlogPost = mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPost;
