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
        hsnCode?: string;
        // Pricing
        originalPrice: number;          // Price before any discount (per unit)
        price: number;                  // Final price after all discounts (per unit)
        costPrice?: number;             // Cost price snapshot for accounting
        quantity: number;
        shippingCost?: number;          // Shipping share per unit
        image?: string;
        attributes?: Record<string, string>;
        weight?: number;
        categoryIds?: mongoose.Types.ObjectId[]; // Product categories for coupon eligibility
        // Tax (per unit)
        taxRate?: number;
        taxAmount?: number;
        // Discount breakdown (per unit)
        discountAmount?: number;        // Total discount per unit (coupon + manual)
        couponDiscount?: number;        // Portion from coupon (per unit)
        manualDiscount?: number;        // Portion from manual/POS discount (per unit)
        isCouponEligible?: boolean;     // Was this item eligible for coupon?
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
        // Return tracking
        returnedQuantity?: number;
        refundedAmount?: number;
        // Return window snapshot (captured at order creation)
        returnWindowDays?: number; // Snapshot of return window at order time
        exchangeWindowDays?: number; // Snapshot of exchange window at order time
        isReturnable?: boolean; // Whether item is returnable
    }>;

    // Returns history (with transparent breakdown)
    returns?: Array<{
        returnedAt: Date;
        items: Array<{
            productId: mongoose.Types.ObjectId;
            variantId?: string;
            quantity: number;
            reason: string;
            refundAmount: number;
            subtotalRefund?: number;
            taxRefund?: number;
            shippingRefund?: number;
        }>;
        totalRefundAmount: number;
        refundBreakdown?: {
            itemsSubtotal: number;
            itemsTax: number;
            itemsShipping: number;
            totalRefund: number;
        };
        refundMethod: string;
        refundReference?: string;
        processedBy?: mongoose.Types.ObjectId;
        note?: string;
        returnRequestId?: mongoose.Types.ObjectId; // Link to ReturnRequest for POS returns
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
    paymentMethod: 'razorpay' | 'stripe' | 'paypal' | 'cod' | 'cash' | 'card' | 'upi' | 'qr';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    paymentId?: string;
    paymentDetails?: Record<string, any>;
    refundStatus?: 'none' | 'requested' | 'approved' | 'rejected' | 'processed';
    refundReason?: string;
    refundRequestedAt?: Date;
    refundedAt?: Date;
    refundReferenceId?: string; // Gateway refund ID (Razorpay/Stripe/PayPal) for future tracking
    // Order status
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'return_requested' | 'exchange_requested' | 'returned' | 'partially_returned';

    // Tracking
    trackingNumber?: string;
    courierName?: string;
    trackingUrl?: string;
    shippedAt?: Date;
    deliveredAt?: Date;

    // Notes
    customerNote?: string;
    adminNote?: string;

    // Accounting reference
    accountingId?: mongoose.Types.ObjectId;

    // Return reference
    returnStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refund_initiated' | 'refund_completed' | 'exchange_shipped' | 'completed' | 'cancelled';
    returnRequestId?: mongoose.Types.ObjectId;

    // POS (Point of Sale) fields
    isPOSOrder?: boolean;
    posSessionId?: mongoose.Types.ObjectId;
    posUserId?: mongoose.Types.ObjectId;
    roundOffAmount?: number;        // Amount added/subtracted for rounding (if enabled)

    // POS Payment Details
    posPaymentDetails?: {
        method: 'cash' | 'card' | 'qr';

        // Cash payment details
        cashDetails?: {
            amountReceived: number;
            changeGiven: number;
            roundOffAmount: number;
        };

        // Card payment details
        cardDetails?: {
            terminalId?: string;
            transactionId?: string;
            authCode?: string;
            cardLast4?: string;
            cardNetwork?: string;
        };

        // QR payment details
        qrDetails?: {
            mode: 'gateway' | 'custom';
            paymentType: string;

            // Gateway payment tracking
            gatewayDetails?: {
                gatewayType: string;
                gatewayOrderId: string;
                gatewayPaymentId: string;
                qrCodeId?: string;
                transactionRef?: string;
                payerIdentifier?: string;
                status: 'pending' | 'completed' | 'failed' | 'refunded';
            };

            // Manual entry for custom QR
            manualEntry?: {
                referenceNumber: string;
                payerName?: string;
                payerIdentifier?: string;
                verifiedBy: mongoose.Types.ObjectId;
                verifiedAt: Date;
                notes?: string;
            };
        };
    };

    // Audit logging for discounts
    discountsApplied?: Array<{
        productId: mongoose.Types.ObjectId;
        variantId?: string;
        discountAmount: number;
        discountType: 'fixed' | 'percentage';
        originalPrice: number;
        quantity: number;
    }>;

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
                hsnCode: String,
                // Pricing
                originalPrice: { type: Number, required: true, min: 0 }, // Price before discount
                price: { type: Number, required: true, min: 0 },         // Final price after discount
                costPrice: { type: Number, min: 0 },                     // Cost price snapshot
                quantity: { type: Number, required: true, min: 1 },
                shippingCost: { type: Number, default: 0, min: 0 },      // Per-unit shipping share
                image: String,
                attributes: Schema.Types.Mixed,
                weight: Number,
                categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
                // Tax (per unit)
                taxRate: { type: Number, default: 0 },
                taxAmount: { type: Number, default: 0 },
                // Discount breakdown (per unit)
                discountAmount: { type: Number, default: 0 },   // Total discount per unit
                couponDiscount: { type: Number, default: 0 },   // Coupon portion per unit
                manualDiscount: { type: Number, default: 0 },   // Manual/POS discount per unit
                isCouponEligible: { type: Boolean, default: false },
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
                // Return tracking
                returnedQuantity: { type: Number, default: 0 },
                refundedAmount: { type: Number, default: 0 },
                // Return window snapshot (captured at order creation)
                returnWindowDays: { type: Number },
                exchangeWindowDays: { type: Number },
                isReturnable: { type: Boolean, default: true },
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
            enum: ['razorpay', 'stripe', 'paypal', 'cod', 'cash', 'card', 'upi', 'qr'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
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
        refundReferenceId: String, // Gateway refund ID (Razorpay/Stripe/PayPal)
        status: {
            type: String,
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return_requested', 'exchange_requested', 'returned', 'partially_returned'],
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
        accountingId: {
            type: Schema.Types.ObjectId,
            ref: 'OrderAccounting',
        },
        // Return tracking
        returnStatus: {
            type: String,
            enum: ['none', 'pending', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'received', 'inspected', 'refund_initiated', 'refund_completed', 'exchange_shipped', 'completed', 'cancelled'],
            default: 'none',
        },
        returnRequestId: {
            type: Schema.Types.ObjectId,
            ref: 'ReturnRequest',
        },
        // POS fields
        isPOSOrder: {
            type: Boolean,
            default: false,
            index: true,
        },
        posSessionId: {
            type: Schema.Types.ObjectId,
            ref: 'POSSession',
        },
        posUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        roundOffAmount: {
            type: Number,
            default: 0,
        },
        // POS Payment Details
        posPaymentDetails: {
            method: {
                type: String,
                enum: ['cash', 'card', 'qr'],
            },
            cashDetails: {
                amountReceived: Number,
                changeGiven: Number,
                roundOffAmount: Number,
            },
            cardDetails: {
                terminalId: String,
                transactionId: String,
                authCode: String,
                cardLast4: String,
                cardNetwork: String,
            },
            qrDetails: {
                mode: {
                    type: String,
                    enum: ['gateway', 'custom'],
                },
                paymentType: String,
                gatewayDetails: {
                    gatewayType: String,
                    gatewayOrderId: String,
                    gatewayPaymentId: String,
                    qrCodeId: String,
                    transactionRef: String,
                    payerIdentifier: String,
                    status: {
                        type: String,
                        enum: ['pending', 'completed', 'failed', 'refunded'],
                    },
                },
                manualEntry: {
                    referenceNumber: String,
                    payerName: String,
                    payerIdentifier: String,
                    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                    verifiedAt: Date,
                    notes: String,
                },
            },
        },
        // Audit logging array
        discountsApplied: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                variantId: String,
                discountAmount: { type: Number, required: true },
                discountType: {
                    type: String,
                    enum: ['fixed', 'percentage'],
                    required: true,
                },
                originalPrice: { type: Number, required: true },
                quantity: { type: Number, required: true },
            },
        ],
        // Returns history (with transparent breakdown)
        returns: [
            {
                returnedAt: { type: Date, default: Date.now },
                items: [
                    {
                        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
                        variantId: String,
                        quantity: Number,
                        reason: String,
                        refundAmount: Number,
                        subtotalRefund: Number,
                        taxRefund: Number,
                        shippingRefund: Number,
                    }
                ],
                totalRefundAmount: Number,
                refundBreakdown: {
                    itemsSubtotal: Number,
                    itemsTax: Number,
                    itemsShipping: Number,
                    totalRefund: Number,
                },
                refundMethod: String,
                refundReference: String,
                processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                note: String,
                returnRequestId: { type: Schema.Types.ObjectId, ref: 'ReturnRequest' }, // Link to ReturnRequest for POS returns
            }
        ],
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
