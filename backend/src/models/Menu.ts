import mongoose, { Schema, Document } from 'mongoose';

/**
 * Menu Item - Recursive menu structure supporting mega menus
 */
export interface IMenuItem {
    id: string;                         // UUID for frontend
    label: string;
    type: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'mega-menu' | 'divider';

    // Target based on type
    url?: string;                       // For type: link
    categoryId?: mongoose.Types.ObjectId;
    categorySlug?: string;
    productId?: mongoose.Types.ObjectId;
    productSlug?: string;
    pageId?: mongoose.Types.ObjectId;
    pageSlug?: string;
    blogCategoryId?: mongoose.Types.ObjectId;
    blogCategorySlug?: string;

    // Mega menu content - Sections-based structure
    megaMenu?: {
        sections: Array<{
            id: string;
            type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
            columns: Array<{
                id: string;
                width: number;
                items: Array<{
                    id: string;
                    type: 'category' | 'product' | 'image' | 'custom-link' | 'page' | 'divider';
                    label?: string;
                    categoryId?: string;
                    categoryName?: string;
                    productLimit?: number;
                    autoAddProducts?: boolean;
                    productIds?: string[];
                    productNames?: string[];
                    products?: Array<{ _id: string; name: string }>; // Array of product objects
                    imageUrl?: string;
                    imageLink?: string;
                    imageAlt?: string;
                    linkLabel?: string;
                    linkTitle?: string;
                    linkUrl?: string;
                    linkOpenInNewTab?: boolean;
                    pageId?: string;
                    pageName?: string;
                }>;
            }>;
            settings: {
                backgroundColor?: string;
                padding?: number;
            };
        }>;
    };

    icon?: string;                      // Icon name or URL
    badge?: {
        text: string;
        color: string;
    };
    openInNewTab: boolean;

    children: IMenuItem[];              // Nested items
    order: number;
}

/**
 * Menu Model - Navigation menus for header, footer, sidebar
 */
export interface IMenu extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom';
    description?: string;

    items: IMenuItem[];

    // Settings
    settings: {
        style: 'horizontal' | 'vertical' | 'mega' | 'flyout' | 'accordion';
        showIcons: boolean;
        maxDepth: number;
        mobileBreakpoint: number;
    };

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

// MenuItem sub-schema
const MenuItemSchema = new Schema<IMenuItem>(
    {
        id: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        type: {
            type: String,
            enum: ['link', 'category', 'product', 'page', 'blog-category', 'mega-menu', 'divider'],
            default: 'link',
        },

        url: { type: String, trim: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
        categorySlug: { type: String, trim: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productSlug: { type: String, trim: true },
        pageId: { type: Schema.Types.ObjectId, ref: 'Page' },
        pageSlug: { type: String, trim: true },
        blogCategoryId: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
        blogCategorySlug: { type: String, trim: true },

        megaMenu: {
            sections: [{
                id: { type: String },
                type: {
                    type: String,
                    enum: ['full-width', 'container', 'split-2', 'split-3', 'split-4', 'custom']
                },
                columns: [{
                    id: { type: String },
                    width: { type: Number, default: 25 },
                    items: [{
                        id: { type: String },
                        type: {
                            type: String,
                            enum: ['category', 'product', 'image', 'custom-link', 'page', 'divider']
                        },
                        label: { type: String, trim: true },
                        categoryId: { type: String },
                        categoryName: { type: String, trim: true },
                        categorySlug: { type: String, trim: true },
                        productLimit: { type: Number },
                        autoAddProducts: { type: Boolean },
                        productIds: [{ type: String }],
                        productNames: [{ type: String, trim: true }],
                        products: [{
                            _id: { type: String },
                            name: { type: String, trim: true },
                            slug: { type: String, trim: true }
                        }],
                        imageUrl: { type: String, trim: true },
                        imageLink: { type: String, trim: true },
                        imageAlt: { type: String, trim: true },
                        linkLabel: { type: String, trim: true },
                        linkTitle: { type: String, trim: true },
                        linkUrl: { type: String, trim: true },
                        linkOpenInNewTab: { type: Boolean },
                        pageId: { type: String },
                        pageName: { type: String, trim: true },
                        pageSlug: { type: String, trim: true },
                    }],
                }],
                settings: {
                    backgroundColor: { type: String, trim: true },
                    padding: { type: Number },
                },
            }],
        },

        icon: { type: String, trim: true },
        badge: {
            text: { type: String, trim: true },
            color: { type: String, trim: true },
        },
        openInNewTab: { type: Boolean, default: false },

        children: { type: [Schema.Types.Mixed] as any, default: [] },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const MenuSchema = new Schema<IMenu>(
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
        location: {
            type: String,
            enum: ['header', 'footer', 'sidebar', 'mobile', 'custom'],
            default: 'custom',
        },
        description: {
            type: String,
            trim: true,
            maxlength: 255,
        },

        items: {
            type: [MenuItemSchema],
            default: [],
        },

        settings: {
            style: {
                type: String,
                enum: ['horizontal', 'vertical', 'mega', 'flyout', 'accordion'],
                default: 'horizontal',
            },
            showIcons: { type: Boolean, default: false },
            maxDepth: { type: Number, default: 3, min: 1, max: 5 },
            mobileBreakpoint: { type: Number, default: 768 },
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
MenuSchema.index({ storeId: 1, slug: 1 }, { unique: true });
MenuSchema.index({ storeId: 1, location: 1 });
MenuSchema.index({ storeId: 1, isActive: 1 });

const Menu = mongoose.model<IMenu>('Menu', MenuSchema);

export default Menu;
