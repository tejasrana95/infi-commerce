import mongoose, { Schema, Document } from 'mongoose';

/**
 * Page Model - Static pages (About, Contact, Privacy, etc.)
 * Can use either a layout or simple rich text content
 */
export interface IPage extends Document {
    storeId: mongoose.Types.ObjectId;
    title: string;
    slug: string;

    // Content mode
    useLayout: boolean;                 // true = use layoutId, false = use content
    layoutId?: mongoose.Types.ObjectId; // If using layout designer
    content?: string;                   // Rich text HTML for simple pages

    // Featured image
    featuredImage?: string;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        canonicalUrl?: string;
    };

    // Display settings
    status: 'draft' | 'published';
    showInFooter: boolean;
    footerGroup?: string;               // "Company", "Support", "Legal"
    showInHeader: boolean;

    // Template
    template?: string;                  // 'default' | 'full-width' | 'sidebar' | 'landing'

    // Sorting
    sortOrder: number;

    createdAt: Date;
    updatedAt: Date;
}

const PageSchema = new Schema<IPage>(
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

        useLayout: {
            type: Boolean,
            default: false,
        },
        layoutId: {
            type: Schema.Types.ObjectId,
            ref: 'Layout',
        },
        content: {
            type: String,
            maxlength: 500000,          // ~500KB of HTML
        },

        featuredImage: {
            type: String,
            trim: true,
        },

        seo: {
            metaTitle: { type: String, trim: true, maxlength: 60 },
            metaDescription: { type: String, trim: true, maxlength: 160 },
            metaKeywords: { type: [String], default: [] },
            ogImage: { type: String, trim: true },
            canonicalUrl: { type: String, trim: true },
        },

        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
            index: true,
        },
        showInFooter: {
            type: Boolean,
            default: false,
        },
        footerGroup: {
            type: String,
            trim: true,
            maxlength: 50,
        },
        showInHeader: {
            type: Boolean,
            default: false,
        },

        template: {
            type: String,
            default: 'default',
            enum: ['default', 'full-width', 'sidebar', 'landing'],
        },

        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
PageSchema.index({ storeId: 1, slug: 1 }, { unique: true });
PageSchema.index({ storeId: 1, status: 1 });
PageSchema.index({ storeId: 1, showInFooter: 1 });
PageSchema.index({ storeId: 1, showInHeader: 1 });

// Pre-save middleware to auto-generate canonical URL
PageSchema.pre('save', async function (next) {
    if (this.isModified('slug') || this.isNew) {
        const Store = mongoose.model('Store');
        const store = await Store.findById(this.storeId);

        if (store) {
            const protocol = 'https://';
            const domain = (store as any).domain;
            if (!this.seo) {
                this.seo = {};
            }
            this.seo.canonicalUrl = `${protocol}${domain}/page/${this.slug}`;
        }
    }
    next();
});

const Page = mongoose.model<IPage>('Page', PageSchema);

export default Page;

