import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    type: 'simple' | 'variable' | 'digital';
    sku: string;

    // Pricing
    price: number;
    salePrice?: number;
    costPrice?: number;

    // Inventory
    stock: number;
    manageStock: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder';

    // Physical properties
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit: 'cm' | 'in';
    };

    // Digital product
    downloadable: boolean;
    downloadFiles?: Array<{
        name: string;
        url: string;
        fileSize: number;
    }>;
    downloadLimit?: number;
    downloadExpiry?: number; // days

    // Variable product
    attributes?: Array<{
        name: string;
        values: string[];
        variation: boolean;
    }>;
    variants?: Array<{
        sku: string;
        attributes: Record<string, string>;
        price: number;
        salePrice?: number;
        stock: number;
        image?: string;
    }>;

    // Media
    images: string[];
    featuredImage?: string;

    // Categorization
    categoryIds: mongoose.Types.ObjectId[];
    tags: string[];

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        focusKeyword?: string;
    };

    // Status
    isActive: boolean;
    isFeatured: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        shortDescription: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['simple', 'variable', 'digital'],
            required: true,
            default: 'simple',
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        salePrice: {
            type: Number,
            min: 0,
        },
        costPrice: {
            type: Number,
            min: 0,
        },
        stock: {
            type: Number,
            default: 0,
            min: 0,
        },
        manageStock: {
            type: Boolean,
            default: true,
        },
        stockStatus: {
            type: String,
            enum: ['in_stock', 'out_of_stock', 'on_backorder'],
            default: 'in_stock',
        },
        weight: {
            type: Number,
            min: 0,
        },
        dimensions: {
            length: Number,
            width: Number,
            height: Number,
            unit: {
                type: String,
                enum: ['cm', 'in'],
                default: 'cm',
            },
        },
        downloadable: {
            type: Boolean,
            default: false,
        },
        downloadFiles: [
            {
                name: String,
                url: String,
                fileSize: Number,
            },
        ],
        downloadLimit: Number,
        downloadExpiry: Number,
        attributes: [
            {
                name: String,
                values: [String],
                variation: Boolean,
            },
        ],
        variants: [
            {
                sku: String,
                attributes: Schema.Types.Mixed,
                price: Number,
                salePrice: Number,
                stock: Number,
                image: String,
            },
        ],
        images: {
            type: [String],
            default: [],
        },
        featuredImage: String,
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        tags: {
            type: [String],
            default: [],
        },
        seo: {
            metaTitle: String,
            metaDescription: String,
            metaKeywords: [String],
            focusKeyword: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ storeId: 1, isActive: 1 });
ProductSchema.index({ storeId: 1, isFeatured: 1 });
ProductSchema.index({ categoryIds: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
