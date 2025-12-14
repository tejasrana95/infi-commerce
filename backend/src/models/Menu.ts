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
    productId?: mongoose.Types.ObjectId;
    pageId?: mongoose.Types.ObjectId;
    blogCategoryId?: mongoose.Types.ObjectId;

    // Mega menu content
    megaMenu?: {
        columns: Array<{
            title?: string;
            items: IMenuItem[];
            width: number;              // Percentage
        }>;
        featuredImage?: string;
        featuredLink?: string;
        featuredTitle?: string;
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
    location: 'header-main' | 'header-top' | 'footer-primary' | 'footer-secondary' | 'sidebar' | 'mobile' | 'custom';
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
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        pageId: { type: Schema.Types.ObjectId, ref: 'Page' },
        blogCategoryId: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },

        megaMenu: {
            columns: [{
                title: { type: String, trim: true },
                items: { type: [Schema.Types.Mixed] as any, default: [] },
                width: { type: Number, default: 25 },
            }],
            featuredImage: { type: String, trim: true },
            featuredLink: { type: String, trim: true },
            featuredTitle: { type: String, trim: true },
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
            enum: ['header-main', 'header-top', 'footer-primary', 'footer-secondary', 'sidebar', 'mobile', 'custom'],
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
