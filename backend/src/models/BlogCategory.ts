import mongoose, { Schema, Document } from 'mongoose';

/**
 * Blog Category Model - Categories for blog posts
 * Supports hierarchical structure like product categories
 */
export interface IBlogCategory extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    image?: string;

    parentId?: mongoose.Types.ObjectId;
    level: number;
    path: string;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
    };

    // Display
    isActive: boolean;
    sortOrder: number;
    postCount: number;                  // Denormalized count

    createdAt: Date;
    updatedAt: Date;
}

const BlogCategorySchema = new Schema<IBlogCategory>(
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
            maxlength: 1000,
        },
        image: {
            type: String,
            trim: true,
        },

        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'BlogCategory',
            default: null,
            index: true,
        },
        level: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        path: {
            type: String,
            default: '',
        },

        seo: {
            metaTitle: { type: String, trim: true, maxlength: 60 },
            metaDescription: { type: String, trim: true, maxlength: 160 },
            metaKeywords: { type: [String], default: [] },
            ogImage: { type: String, trim: true },
        },

        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        postCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
BlogCategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
BlogCategorySchema.index({ storeId: 1, parentId: 1 });
BlogCategorySchema.index({ storeId: 1, isActive: 1 });
BlogCategorySchema.index({ path: 1 });

// Pre-save middleware for path and level calculation
BlogCategorySchema.pre('save', async function (next) {
    if (this.isModified('parentId') || this.isNew) {
        if (this.parentId) {
            const parent = await mongoose.model('BlogCategory').findById(this.parentId);
            if (parent) {
                if (parent.storeId.toString() !== this.storeId.toString()) {
                    throw new Error('Parent category must belong to the same store');
                }
                this.level = parent.level + 1;
                this.path = parent.path ? `${parent.path}/${this.slug}` : this.slug;

                if (this.level > 5) {
                    throw new Error('Maximum category depth (5 levels) exceeded');
                }
            } else {
                throw new Error('Parent category not found');
            }
        } else {
            this.level = 0;
            this.path = this.slug;
        }
    }
    next();
});

const BlogCategory = mongoose.model<IBlogCategory>('BlogCategory', BlogCategorySchema);

export default BlogCategory;
