import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    storeId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderNumber: string;

    // Items
    items: Array<{
        productId: mongoose.Types.ObjectId;
        variantId?: string;
        name: string;
        sku: string;
        price: number;
        quantity: number;
        image?: string;
        attributes?: Record<string, string>;
        weight?: number;
    }>;

    // Pricing
    subtotal: number;
    shippingCost: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;

    // Shipping
    shippingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone: string;
    };

    // Billing
    billingAddress: {
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone: string;
    };

    // Payment
    paymentMethod: 'razorpay' | 'stripe' | 'paypal' | 'cod';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentId?: string;
    paymentDetails?: Record<string, any>;

    // Order status
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

    // Tracking
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;

    // Notes
    customerNote?: string;
    adminNote?: string;

    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
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
                weight: Number,
            },
        ],
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingCost: {
            type: Number,
            required: true,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            maxlength: 3,
        },
        shippingAddress: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            address1: { type: String, required: true },
            address2: String,
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            postalCode: { type: String, required: true },
            phone: { type: String, required: true },
        },
        billingAddress: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            address1: { type: String, required: true },
            address2: String,
            city: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            postalCode: { type: String, required: true },
            phone: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            enum: ['razorpay', 'stripe', 'paypal', 'cod'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentId: String,
        paymentDetails: Schema.Types.Mixed,
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            default: 'pending',
        },
        trackingNumber: String,
        shippedAt: Date,
        deliveredAt: Date,
        customerNote: String,
        adminNote: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
OrderSchema.index({ storeId: 1, orderNumber: 1 });
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
