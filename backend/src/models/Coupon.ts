import mongoose, { Schema, Document } from 'mongoose';

/**
 * Coupon Model - For discount codes and promotions
 */
export interface ICoupon extends Document {
    code: string; // Unique coupon code
    storeId: mongoose.Types.ObjectId;
    description?: string;

    // Discount configuration
    discountType: 'flat' | 'percentage';
    discountValue: number;

    // Applicability
    applyTo: 'store' | 'categories'; // Whole store or specific categories
    categoryIds?: mongoose.Types.ObjectId[]; // If applyTo is 'categories'

    // Conditions
    minCartValue?: number; // Minimum cart value to apply coupon
    maxDiscountAmount?: number; // Maximum discount cap (for percentage)

    // Usage limits
    usageLimit?: number; // Total number of times coupon can be used
    usageCount: number; // Current usage count
    perCustomerLimit?: number; // Max uses per customer
    customerUsage: Map<string, number>; // Track usage per customer ID

    // Date range
    startDate: Date;
    endDate: Date;

    // Status
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;

    // Methods
    isCurrentlyValid(): boolean;
    canCustomerUse(customerId: string): boolean;
    calculateDiscount(cartValue: number, applicableAmount: number): number;
    incrementUsage(customerId?: string): Promise<void>;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },

        // Discount configuration
        discountType: {
            type: String,
            enum: ['flat', 'percentage'],
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },

        // Applicability
        applyTo: {
            type: String,
            enum: ['store', 'categories'],
            required: true,
            default: 'store',
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],

        // Conditions
        minCartValue: {
            type: Number,
            min: 0,
        },
        maxDiscountAmount: {
            type: Number,
            min: 0,
        },

        // Usage limits
        usageLimit: {
            type: Number,
            min: 0,
        },
        usageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        perCustomerLimit: {
            type: Number,
            min: 0,
        },
        customerUsage: {
            type: Map,
            of: Number,
            default: new Map(),
        },

        // Date range
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
CouponSchema.index({ storeId: 1, isActive: 1 });
CouponSchema.index({ startDate: 1, endDate: 1 });
CouponSchema.index({ code: 1, storeId: 1 });

// Method to check if coupon is currently valid
CouponSchema.methods.isCurrentlyValid = function () {
    if (!this.isActive) return false;

    const now = new Date();
    if (now < this.startDate || now > this.endDate) return false;

    // Check usage limit
    if (this.usageLimit !== undefined && this.usageCount >= this.usageLimit) {
        return false;
    }

    return true;
};

// Method to check if customer can use coupon
CouponSchema.methods.canCustomerUse = function (customerId: string) {
    if (!this.isCurrentlyValid()) return false;

    if (this.perCustomerLimit !== undefined) {
        const customerUses = this.customerUsage.get(customerId) || 0;
        if (customerUses >= this.perCustomerLimit) {
            return false;
        }
    }

    return true;
};

// Method to calculate discount
CouponSchema.methods.calculateDiscount = function (applicableAmount: number) {
    let discount = 0;

    if (this.discountType === 'flat') {
        discount = this.discountValue;
    } else if (this.discountType === 'percentage') {
        discount = (applicableAmount * this.discountValue) / 100;

        // Apply max discount cap
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    }

    // Discount cannot exceed applicable amount
    if (discount > applicableAmount) {
        discount = applicableAmount;
    }

    return parseFloat(discount.toFixed(2));
};

// Method to increment usage
CouponSchema.methods.incrementUsage = async function (customerId?: string) {
    this.usageCount += 1;

    if (customerId && this.perCustomerLimit !== undefined) {
        const currentUses = this.customerUsage.get(customerId) || 0;
        this.customerUsage.set(customerId, currentUses + 1);
    }

    await this.save();
};

const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);

export default Coupon;
