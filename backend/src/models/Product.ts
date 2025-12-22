import mongoose, { Schema, Document } from 'mongoose';

/**
 * Comprehensive Product Model for Ecommerce
 * Supports: Simple, Variable, Digital products
 * Features: Geo-limits, Videos, Auto canonical URL, Sale pricing with dates, Attributes
 */
export interface IProduct extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description: string; // HTML content
    shortDescription?: string;
    type: 'simple' | 'variable' | 'digital';
    sku: string;

    // Pricing
    price: number;
    salePrice?: number;
    salePriceStartDate?: Date;
    salePriceEndDate?: Date;
    costPrice?: number;

    // Inventory
    stock: number;
    manageStock: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order';
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order';
    lowStockThreshold?: number;
    taxClassId?: mongoose.Types.ObjectId;

    // Shipping & Geo Limits
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit: 'cm' | 'in';
    };
    geoLimit?: {
        enabled: boolean;
        countries?: string[]; // ISO country codes
        states?: string[]; // For specific states/provinces
        cities?: string[];
        // If empty arrays, ships everywhere
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

    // Product Options (for variants - linked to ProductOption model)
    productOptions?: Array<{
        optionId: mongoose.Types.ObjectId;
        values: string[]; // Selected values from option
        isVariation: boolean; // Used for variations
    }>;

    // Legacy Attributes (for backward compatibility)
    attributes?: Array<{
        attributeId: mongoose.Types.ObjectId;
        values: string[];
        isVariation: boolean;
    }>;

    // Specifications (for product details - linked to new Attribute model)
    specifications?: Array<{
        attributeId: mongoose.Types.ObjectId;
        value: any; // Can be string, number, boolean, or array
    }>;

    // Variable product variants
    variants?: Array<{
        sku: string;
        attributes: Record<string, string>; // e.g., { color: 'red', size: 'L' }
        price: number;
        salePrice?: number;
        stock: number;
        images: string[]; // Multiple images per variant
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
        };
    }>;

    // Media
    images: string[];
    featuredImage?: string;
    videos?: Array<{
        type: 'youtube' | 'vimeo' | 'url';
        url: string;
        thumbnail?: string;
        title?: string;
    }>;

    // Categorization
    categoryIds: mongoose.Types.ObjectId[];
    tags: string[];
    brand?: string;

    // SEO
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        focusKeyword?: string;
        canonicalUrl?: string; // Auto-generated
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };

    // Status
    isActive: boolean;
    isFeatured: boolean;
    isOnSale: boolean; // Auto-calculated based on sale price dates

    // Stats
    views: number;
    salesCount: number;
    averageRating?: number;
    reviewCount: number;

    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
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
            required: true,
        },
        shortDescription: {
            type: String,
            trim: true,
            maxlength: 500,
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
            trim: true,
        },

        // Pricing
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        salePrice: {
            type: Number,
            min: 0,
        },
        salePriceStartDate: {
            type: Date,
        },
        salePriceEndDate: {
            type: Date,
        },
        costPrice: {
            type: Number,
            min: 0,
        },

        // Inventory
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
            enum: ['in_stock', 'out_of_stock', 'on_backorder', 'made_to_order'],
            default: 'in_stock',
        },
        lowStockThreshold: {
            type: Number,
            default: 5,
        },
        taxClassId: {
            type: Schema.Types.ObjectId,
            ref: 'TaxRate',
        },

        // Shipping & Geo Limits
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
        geoLimit: {
            enabled: {
                type: Boolean,
                default: false,
            },
            countries: {
                type: [String],
                default: [],
            },
            states: {
                type: [String],
                default: [],
            },
            cities: {
                type: [String],
                default: [],
            },
        },

        // Digital product
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

        // Product Options (for variants - linked to ProductOption model)
        productOptions: [
            {
                optionId: {
                    type: Schema.Types.ObjectId,
                    ref: 'ProductOption',
                },
                values: [String],
                isVariation: {
                    type: Boolean,
                    default: true,
                },
            },
        ],

        // Legacy Attributes (for backward compatibility)
        attributes: [
            {
                attributeId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Attribute',
                },
                values: [String],
                isVariation: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        // Specifications (for product details)
        specifications: [
            {
                attributeId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Attribute',
                },
                value: Schema.Types.Mixed, // Can be string, number, boolean, or array
            },
        ],

        // Variable product variants
        variants: [
            {
                sku: {
                    type: String,
                    uppercase: true,
                },
                attributes: Schema.Types.Mixed,
                price: Number,
                salePrice: Number,
                stock: Number,
                images: {
                    type: [String],
                    default: [],
                },
                weight: Number,
                dimensions: {
                    length: Number,
                    width: Number,
                    height: Number,
                },
            },
        ],

        // Media
        images: {
            type: [String],
            default: [],
        },
        featuredImage: String,
        videos: [
            {
                type: {
                    type: String,
                    enum: ['youtube', 'vimeo', 'url'],
                },
                url: String,
                thumbnail: String,
                title: String,
            },
        ],

        // Categorization
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
                index: true,
            },
        ],
        tags: {
            type: [String],
            default: [],
            index: true,
        },
        brand: {
            type: String,
            trim: true,
        },

        // SEO
        seo: {
            metaTitle: {
                type: String,
                maxlength: 60,
            },
            metaDescription: {
                type: String,
                maxlength: 160,
            },
            metaKeywords: [String],
            focusKeyword: String,
            canonicalUrl: String, // Auto-generated
            ogTitle: String,
            ogDescription: String,
            ogImage: String,
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
            index: true,
        },
        isOnSale: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Stats
        views: {
            type: Number,
            default: 0,
        },
        salesCount: {
            type: Number,
            default: 0,
        },
        averageRating: {
            type: Number,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for better query performance
ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, isActive: 1, isFeatured: 1 });
ProductSchema.index({ storeId: 1, isOnSale: 1 });
ProductSchema.index({ categoryIds: 1, isActive: 1 });
ProductSchema.index({ 'attributes.attributeId': 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ salesCount: -1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ createdAt: -1 });

// Text index for search
ProductSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

// Pre-save middleware to auto-generate canonical URL and calculate isOnSale
ProductSchema.pre('save', async function (next) {
    // Auto-generate canonical URL
    if (this.isModified('slug') || this.isNew) {
        const Store = mongoose.model('Store');
        const store = await Store.findById(this.storeId);

        if (store) {
            const protocol = 'https://';
            const domain = (store as any).domain;
            this.seo.canonicalUrl = `${protocol}${domain}/product/${this.slug}`;
        }
    }

    // Auto-calculate isOnSale based on sale price and dates
    const now = new Date();
    if (this.salePrice && this.salePrice < this.price) {
        // Check if sale is within date range
        const startDateValid = !this.salePriceStartDate || this.salePriceStartDate <= now;
        const endDateValid = !this.salePriceEndDate || this.salePriceEndDate >= now;

        this.isOnSale = startDateValid && endDateValid;
    } else {
        this.isOnSale = false;
    }

    next();
});

// Method to get effective price (sale price if on sale, otherwise regular price)
ProductSchema.methods.getEffectivePrice = function () {
    return this.isOnSale && this.salePrice ? this.salePrice : this.price;
};

// Method to check if product can ship to location
ProductSchema.methods.canShipTo = function (country?: string, state?: string, city?: string) {
    if (!this.geoLimit || !this.geoLimit.enabled) {
        return true; // Ships everywhere
    }

    // If arrays are empty, ships everywhere
    const hasCountryLimit = this.geoLimit.countries && this.geoLimit.countries.length > 0;
    const hasStateLimit = this.geoLimit.states && this.geoLimit.states.length > 0;
    const hasCityLimit = this.geoLimit.cities && this.geoLimit.cities.length > 0;

    if (!hasCountryLimit && !hasStateLimit && !hasCityLimit) {
        return true; // No limits set
    }

    // Check country
    if (hasCountryLimit && country) {
        if (!this.geoLimit.countries.includes(country)) {
            return false;
        }
    }

    // Check state
    if (hasStateLimit && state) {
        if (!this.geoLimit.states.includes(state)) {
            return false;
        }
    }

    // Check city
    if (hasCityLimit && city) {
        if (!this.geoLimit.cities.includes(city)) {
            return false;
        }
    }

    return true;
};

const Product = mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
