import mongoose, { Schema, Document } from 'mongoose';
import slugService from '../services/slug.service';

/**
 * Category Model - Hierarchical category system with SEO support
 * Supports parent-child relationships and store-specific categories
 */
export interface ICategory extends Document {
    title: string;
    slug: string;
    description?: string; // HTML content
    storeId: mongoose.Types.ObjectId;
    parentCategory?: mongoose.Types.ObjectId;
    image?: string;
    status: 'active' | 'inactive' | 'draft';

    // SEO Fields
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        canonicalUrl?: string;
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
        twitterCard?: string;
    };

    // Hierarchy helpers
    level: number; // 0 for root, 1 for first level children, etc.
    path: string; // e.g., "electronics/computers/laptops"

    // Sorting and display
    sortOrder: number;
    isVisible: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
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
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
            index: true,
        },
        image: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'draft'],
            default: 'active',
            index: true,
        },

        // SEO Fields
        seo: {
            metaTitle: {
                type: String,
                trim: true,
                maxlength: 60,
            },
            metaDescription: {
                type: String,
                trim: true,
                maxlength: 160,
            },
            metaKeywords: {
                type: [String],
                default: [],
            },
            canonicalUrl: {
                type: String,
                trim: true,
            },
            ogTitle: {
                type: String,
                trim: true,
            },
            ogDescription: {
                type: String,
                trim: true,
            },
            ogImage: {
                type: String,
                trim: true,
            },
            twitterCard: {
                type: String,
                enum: ['summary', 'summary_large_image', 'app', 'player'],
                default: 'summary_large_image',
            },
            score: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
            },
        },

        // Hierarchy helpers
        level: {
            type: Number,
            default: 0,
            min: 0,
            max: 10, // Prevent too deep nesting
        },
        path: {
            type: String,
            default: '',
            index: true,
        },

        // Sorting and display
        sortOrder: {
            type: Number,
            default: 0,
        },
        isVisible: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for better query performance
CategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ storeId: 1, parentCategory: 1 });
CategorySchema.index({ storeId: 1, status: 1 });
CategorySchema.index({ storeId: 1, level: 1 });


// Pre-save middleware to update level, path, and canonical URL
CategorySchema.pre('save', async function (next) {
    if (this.isModified('parentCategory') || this.isNew) {
        if (this.parentCategory) {
            // Get parent category
            const parent = await mongoose.model('Category').findById(this.parentCategory);

            if (parent) {
                // Validate same store
                if (parent.storeId.toString() !== this.storeId.toString()) {
                    throw new Error('Parent category must belong to the same store');
                }

                // Set level
                this.level = parent.level + 1;

                // Build path
                this.path = parent.path ? `${parent.path}/${this.slug}` : this.slug;

                // Validate max depth
                if (this.level > 10) {
                    throw new Error('Maximum category depth (10 levels) exceeded');
                }
            } else {
                throw new Error('Parent category not found');
            }
        } else {
            // Root category
            this.level = 0;
            this.path = this.slug;
        }
    }

    // Auto-generate canonical URL if not manually set or if path/slug changed
    if (this.isModified('path') || this.isModified('slug') || this.isNew) {
        // Get store to build canonical URL
        const Store = mongoose.model('Store');
        const store = await Store.findById(this.storeId);

        if (store) {
            // Build canonical URL: https://store-domain.com/category/path
            const protocol = 'https://';
            // Assuming 'domain' field exists on the Store model
            const domain = (store as any).domain; // Cast to any to access domain if not explicitly typed in ICategory
            const categoryPath = this.path;

            // Auto-generate canonical URL
            // Update to flat URL structure (hierarchical path without /category/ prefix)
            this.seo.canonicalUrl = `${protocol}${domain}/${categoryPath}`;
        }
    }

    // Register slug in global registry
    if (this.isModified('slug') || this.isModified('storeId') || this.isNew) {
        try {
            await slugService.registerSlug(
                this.storeId,
                this.slug,
                'category',
                this._id
            );
        } catch (error: any) {
            return next(error);
        }
    }

    next();
});

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
