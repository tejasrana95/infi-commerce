import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    storeId: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId; // Optional for guest checkout
    guestEmail?: string; // Email for guest orders
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
        taxRate?: number;
        taxAmount?: number;
        // Digital product fields
        downloadable?: boolean;
        downloadFiles?: Array<{
            name: string;
            url: string;
            fileSize: number;
        }>;
        downloadLimit?: number;
        downloadCount?: number;
        downloadExpiresAt?: Date;
    }>;

    // Pricing
    subtotal: number;
    shippingCost: number;
    tax: number;
    taxBreakdown?: Array<{
        name: string;
        rate: number;
        amount: number;
        taxRateId: mongoose.Types.ObjectId;
        isSplit?: boolean;
        subTaxes?: Array<{
            name: string;
            rate: number;
        }>;
    }>;
    discount: number;
    couponId?: mongoose.Types.ObjectId;
    couponCode?: string;
    total: number;
    currency: string;
    exchangeRate?: number; // Exchange rate at time of order creation

    // Shipping
    shippingAddress: {
        firstName: string;
        lastName: string;
        email?: string; // Guest email can also be here
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
        email?: string;
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
    refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'processed';
    refundReason?: string;
    refundRequestedAt?: Date;
    refundedAt?: Date;
    // Order status
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'returned';

    // Tracking
    trackingNumber?: string;
    courierName?: string;
    trackingUrl?: string;
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
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: false, // Optional for guest checkout
        },
        guestEmail: {
            type: String,
            required: false,
            lowercase: true,
            trim: true,
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
                taxRate: { type: Number, default: 0 },
                taxAmount: { type: Number, default: 0 },
                // Digital product fields
                downloadable: { type: Boolean, default: false },
                downloadFiles: [
                    {
                        name: String,
                        url: String,
                        fileSize: Number,
                    },
                ],
                downloadLimit: Number,
                downloadCount: { type: Number, default: 0 },
                downloadExpiresAt: Date,
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
        taxBreakdown: [
            {
                name: { type: String, required: true },
                rate: { type: Number, required: true },
                amount: { type: Number, required: true },
                taxRateId: {
                    type: Schema.Types.ObjectId,
                    ref: 'TaxRate',
                },
                isSplit: Boolean,
                subTaxes: [
                    {
                        name: String,
                        rate: Number,
                    },
                ],
            },
        ],
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        couponId: {
            type: Schema.Types.ObjectId,
            ref: 'Coupon',
        },
        couponCode: {
            type: String,
            uppercase: true,
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
        exchangeRate: {
            type: Number,
            required: false,
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
        refundStatus: {
            type: String,
            enum: ['none', 'requested', 'approved', 'rejected', 'processed'],
            default: 'none',
        },
        refundReason: String,
        refundRequestedAt: Date,
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'returned'],
            default: 'pending',
        },
        trackingNumber: String,
        courierName: String,
        trackingUrl: String,
        shippedAt: Date,
        deliveredAt: Date,
        customerNote: String,
        adminNote: String,
        refundedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
OrderSchema.index({ storeId: 1, orderNumber: 1 });
OrderSchema.index({ customerId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
