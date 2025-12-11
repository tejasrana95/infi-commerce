import mongoose, { Schema, Document } from 'mongoose';

/**
 * Sale Model - For category-based or product-based sales
 * Automatically applies discounts to products in selected categories
 */
export interface ISale extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: 'percentage' | 'fixed';
    value: number; // Percentage (e.g., 10 for 10%) or fixed amount

    // Apply to
    applyTo: 'categories' | 'products' | 'all';
    categoryIds?: mongoose.Types.ObjectId[];
    productIds?: mongoose.Types.ObjectId[];

    // Date range
    startDate: Date;
    endDate: Date;

    // Status
    isActive: boolean;
    priority: number; // Higher priority sales apply first

    // Limits
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;

    createdAt: Date;
    updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
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
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        applyTo: {
            type: String,
            enum: ['categories', 'products', 'all'],
            required: true,
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        productIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        priority: {
            type: Number,
            default: 0,
        },
        minPurchaseAmount: {
            type: Number,
            min: 0,
        },
        maxDiscountAmount: {
            type: Number,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
SaleSchema.index({ storeId: 1, isActive: 1 });
SaleSchema.index({ startDate: 1, endDate: 1 });
SaleSchema.index({ categoryIds: 1 });
SaleSchema.index({ productIds: 1 });

// Method to check if sale is currently active
SaleSchema.methods.isCurrentlyActive = function () {
    if (!this.isActive) return false;

    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
};

// Method to calculate discount for a product
SaleSchema.methods.calculateDiscount = function (productPrice: number) {
    if (!this.isCurrentlyActive()) return 0;

    let discount = 0;

    if (this.type === 'percentage') {
        discount = (productPrice * this.value) / 100;
    } else {
        discount = this.value;
    }

    // Apply max discount limit if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
        discount = this.maxDiscountAmount;
    }

    return discount;
};

// Static method to get active sales for a product
SaleSchema.statics.getActiveSalesForProduct = async function (
    productId: mongoose.Types.ObjectId,
    categoryIds: mongoose.Types.ObjectId[]
) {
    const now = new Date();

    const sales = await this.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
            { applyTo: 'all' },
            { applyTo: 'products', productIds: productId },
            { applyTo: 'categories', categoryIds: { $in: categoryIds } },
        ],
    }).sort({ priority: -1 });

    return sales;
};

const Sale = mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
