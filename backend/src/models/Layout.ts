import mongoose, { Schema, Document } from 'mongoose';

/**
 * Module - Building block for layouts
 */
export interface IModule {
    id: string;                         // UUID for frontend
    type: string;                       // Module type (banner, text-block, etc.)
    config: Record<string, any>;        // Module-specific configuration
    styling: {
        className?: string;
        customCSS?: string;
        marginTop?: number;
        marginBottom?: number;
        paddingTop?: number;
        paddingBottom?: number;
    };
    visibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
    isPlaceholder: boolean;             // Required dynamic modules
    isRemovable: boolean;               // false for placeholders
    order: number;
}

/**
 * Column - For split-layout sections
 */
export interface IColumn {
    id: string;
    width: number;                      // Percentage or grid units
    modules: IModule[];
}

/**
 * Section - Container for modules
 */
export interface ISection {
    id: string;                         // UUID for frontend
    name?: string;                      // "Hero Section", "Featured Products"
    type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    settings: {
        backgroundColor?: string;
        backgroundImage?: string;
        backgroundSize?: string;        // 'cover' | 'contain' | 'auto'
        backgroundPosition?: string;    // 'center' | 'top' | 'bottom'
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginTop?: number;
        marginBottom?: number;
        maxWidth?: number;
        customClass?: string;
    };
    columns?: IColumn[];                // For split layouts
    modules: IModule[];                 // For non-split layouts
    visibility: {
        desktop: boolean;
        tablet: boolean;
        mobile: boolean;
    };
    order: number;
}

/**
 * Layout Model - Page layout configuration
 * Stores the structure and modules for each page type
 */
export interface ILayout extends Document {
    storeId: mongoose.Types.ObjectId;
    themeId?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'page' | 'cart' | 'checkout' | 'account';

    sections: ISection[];

    // Page-level settings
    settings: {
        backgroundColor?: string;
        customCSS?: string;
        customJS?: string;
        bodyClass?: string;
    };

    // SEO (for static layouts)
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };

    isDefault: boolean;                 // Default layout for this page type
    isTemplate: boolean;                // Is this a template for copying?
    templateCategory?: string;          // 'starter' | 'minimal' | 'promo' etc.

    status: 'draft' | 'published';

    createdAt: Date;
    updatedAt: Date;
}

// Module sub-schema
const ModuleSchema = new Schema<IModule>(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        config: { type: Schema.Types.Mixed, default: {} },
        styling: {
            className: { type: String, trim: true },
            customCSS: { type: String },
            marginTop: { type: Number },
            marginBottom: { type: Number },
            paddingTop: { type: Number },
            paddingBottom: { type: Number },
        },
        visibility: {
            desktop: { type: Boolean, default: true },
            tablet: { type: Boolean, default: true },
            mobile: { type: Boolean, default: true },
        },
        isPlaceholder: { type: Boolean, default: false },
        isRemovable: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

// Column sub-schema
const ColumnSchema = new Schema<IColumn>(
    {
        id: { type: String, required: true },
        width: { type: Number, default: 50 },
        modules: { type: [ModuleSchema], default: [] },
    },
    { _id: false }
);

// Section sub-schema
const SectionSchema = new Schema<ISection>(
    {
        id: { type: String, required: true },
        name: { type: String, trim: true },
        type: {
            type: String,
            enum: ['full-width', 'container', 'split-2', 'split-3', 'split-4', 'custom'],
            default: 'container',
        },
        settings: {
            backgroundColor: { type: String, trim: true },
            backgroundImage: { type: String, trim: true },
            backgroundSize: { type: String, default: 'cover' },
            backgroundPosition: { type: String, default: 'center' },
            paddingTop: { type: Number, default: 40 },
            paddingBottom: { type: Number, default: 40 },
            paddingLeft: { type: Number },
            paddingRight: { type: Number },
            marginTop: { type: Number },
            marginBottom: { type: Number },
            maxWidth: { type: Number },
            customClass: { type: String, trim: true },
        },
        columns: { type: [ColumnSchema], default: [] },
        modules: { type: [ModuleSchema], default: [] },
        visibility: {
            desktop: { type: Boolean, default: true },
            tablet: { type: Boolean, default: true },
            mobile: { type: Boolean, default: true },
        },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const LayoutSchema = new Schema<ILayout>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        themeId: {
            type: Schema.Types.ObjectId,
            ref: 'Theme',
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        type: {
            type: String,
            enum: ['homepage', 'category', 'product', 'search', 'blog-list', 'blog-post', 'page', 'cart', 'checkout', 'account'],
            required: true,
            index: true,
        },

        sections: {
            type: [SectionSchema],
            default: [],
        },

        settings: {
            backgroundColor: { type: String, trim: true },
            customCSS: { type: String, maxlength: 50000 },
            customJS: { type: String, maxlength: 50000 },
            bodyClass: { type: String, trim: true },
        },

        seo: {
            metaTitle: { type: String, trim: true, maxlength: 60 },
            metaDescription: { type: String, trim: true, maxlength: 160 },
            metaKeywords: { type: [String], default: [] },
        },

        isDefault: {
            type: Boolean,
            default: false,
        },
        isTemplate: {
            type: Boolean,
            default: false,
        },
        templateCategory: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
LayoutSchema.index({ storeId: 1, type: 1 });
LayoutSchema.index({ storeId: 1, type: 1, isDefault: 1 });
LayoutSchema.index({ storeId: 1, status: 1 });
LayoutSchema.index({ isTemplate: 1, templateCategory: 1 });

// Ensure only one default layout per type per store
LayoutSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await mongoose.model('Layout').updateMany(
            {
                storeId: this.storeId,
                type: this.type,
                _id: { $ne: this._id },
                isDefault: true
            },
            { isDefault: false }
        );
    }
    next();
});

const Layout = mongoose.model<ILayout>('Layout', LayoutSchema);

export default Layout;
