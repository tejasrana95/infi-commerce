import mongoose, { Schema, Document } from 'mongoose';

export interface ICart extends Document {
    userId?: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    sessionId?: string; // For guest users
    items: Array<{
        productId: mongoose.Types.ObjectId;
        variantId?: string;
        name: string;
        sku: string;
        price: number;
        quantity: number;
        image?: string;
        attributes?: Record<string, string>;
    }>;
    subtotal: number;

    // Shipping information
    shippingAddress?: {
        country: string;
        state?: string;
        city?: string;
        postalCode?: string;
        addressLine1?: string;
        addressLine2?: string;
    };
    shippingMethod?: {
        ruleId: mongoose.Types.ObjectId;
        name: string;
        cost: number;
        estimatedDays?: string;
    };
    shippingCost: number;

    // Coupon information
    coupon?: {
        code: string;
        couponId: mongoose.Types.ObjectId;
        discountAmount: number;
        discountType: 'flat' | 'percentage';
    };
    discount: number;

    // Totals
    tax: number;
    total: number;

    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CartSchema = new Schema<ICart>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        sessionId: {
            type: String,
            trim: true,
        },
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                variantId: String,
                name: { type: String, required: true },
                sku: { type: String, required: true },
                price: { type: Number, required: true, min: 0 },
                quantity: { type: Number, required: true, min: 1 },
                image: String,
                attributes: Schema.Types.Mixed,
            },
        ],
        subtotal: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Shipping information
        shippingAddress: {
            country: String,
            state: String,
            city: String,
            postalCode: String,
            addressLine1: String,
            addressLine2: String,
        },
        shippingMethod: {
            ruleId: {
                type: Schema.Types.ObjectId,
                ref: 'ShippingRule',
            },
            name: String,
            cost: Number,
            estimatedDays: String,
        },
        shippingCost: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Coupon information
        coupon: {
            code: String,
            couponId: {
                type: Schema.Types.ObjectId,
                ref: 'Coupon',
            },
            discountAmount: Number,
            discountType: {
                type: String,
                enum: ['flat', 'percentage'],
            },
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Totals
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            default: 0,
            min: 0,
        },

        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate subtotal and total before saving
CartSchema.pre('save', function (next) {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);

    // Calculate total (subtotal + shipping + tax)
    this.total = this.subtotal + (this.shippingCost || 0) + (this.tax || 0);

    next();
});

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ storeId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for cart expiration

const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
