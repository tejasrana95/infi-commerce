import mongoose, { Schema, Document } from 'mongoose';

/**
 * Return Request Model
 * Tracks the lifecycle of return/exchange requests from customers
 */

export type ReturnRequestType = 'return' | 'exchange';

export type ReturnRequestStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'pickup_scheduled'
    | 'picked_up'
    | 'received'
    | 'inspected'
    | 'refund_initiated'
    | 'refund_completed'
    | 'exchange_shipped'
    | 'completed'
    | 'cancelled';

export type RefundMethod = 'original' | 'store_credit' | 'bank_transfer';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ItemCondition = 'unopened' | 'opened' | 'damaged';
export type PickupMethod = 'pickup' | 'dropoff' | 'courier';

export interface IReturnRequestItem {
    productId: mongoose.Types.ObjectId;
    variantId?: string;
    name: string;
    sku: string;
    image?: string;
    quantity: number;
    reason: string;
    condition?: ItemCondition;
    refundAmount?: number;
    customerNotes?: string;
    // For exchange
    exchangeProductId?: mongoose.Types.ObjectId;
    exchangeVariantId?: string;
    exchangeSku?: string;
    exchangeName?: string;
    exchangePriceDifference?: number;
}

export interface IReturnRequest extends Document {
    storeId: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    orderNumber: string;
    customerId?: mongoose.Types.ObjectId;
    requestNumber: string; // RET-XXXXXX
    totalRefundAmount?: number;

    type: ReturnRequestType;
    status: ReturnRequestStatus;

    items: IReturnRequestItem[];

    // Pickup details
    pickup?: {
        method: PickupMethod;
        scheduledDate?: Date;
        scheduledSlot?: string;
        address?: {
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
        courierName?: string;
        trackingNumber?: string;
        trackingUrl?: string;
        pickedUpAt?: Date;
        receivedAt?: Date;
        adminNotes?: string;
    };

    // Refund details
    refund?: {
        method: RefundMethod;
        amount: number;
        status: RefundStatus;
        processedAt?: Date;
        transactionId?: string;
    };

    // Exchange details (creates a new order)
    exchange?: {
        newOrderId?: mongoose.Types.ObjectId;
        newOrderNumber?: string;
        priceDifference?: number;
        paymentRequired?: boolean;
        paymentStatus?: 'pending' | 'paid' | 'not_required';
    };

    reason: string;
    customerNotes?: string;
    adminNotes?: string;

    requestedAt: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    completedAt?: Date;

    processedBy?: mongoose.Types.ObjectId;

    // Status history for timeline
    statusHistory?: Array<{
        status: ReturnRequestStatus;
        note?: string;
        updatedBy?: mongoose.Types.ObjectId;
        updatedAt: Date;
    }>;

    createdAt: Date;
    updatedAt: Date;
}

const ReturnRequestSchema = new Schema<IReturnRequest>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true,
        },
        orderNumber: {
            type: String,
            required: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            index: true,
        },
        requestNumber: {
            type: String,
            required: true,
            unique: true,
        },
        totalRefundAmount: Number,

        type: {
            type: String,
            enum: ['return', 'exchange'],
            required: true,
        },
        status: {
            type: String,
            enum: [
                'pending',
                'approved',
                'rejected',
                'pickup_scheduled',
                'picked_up',
                'received',
                'inspected',
                'refund_initiated',
                'refund_completed',
                'exchange_shipped',
                'completed',
                'cancelled',
            ],
            default: 'pending',
            index: true,
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
                image: String,
                quantity: { type: Number, required: true, min: 1 },
                reason: { type: String, required: true },
                condition: {
                    type: String,
                    enum: ['unopened', 'opened', 'damaged'],
                },
                refundAmount: Number,
                // Exchange fields
                exchangeProductId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                },
                exchangeVariantId: String,
                exchangeSku: String,
                exchangeName: String,
                exchangePriceDifference: Number,
            },
        ],

        // Pickup details
        pickup: {
            method: {
                type: String,
                enum: ['pickup', 'dropoff', 'courier', 'internal'],
            },
            scheduledDate: Date,
            scheduledSlot: String,
            address: {
                firstName: String,
                lastName: String,
                address1: String,
                address2: String,
                city: String,
                state: String,
                country: String,
                postalCode: String,
                phone: String,
            },
            courierName: String,
            trackingNumber: String,
            trackingUrl: String,
            pickedUpAt: Date,
            receivedAt: Date,
            adminNotes: String,
        },

        // Refund details
        refund: {
            method: {
                type: String,
                enum: ['original', 'store_credit', 'bank_transfer'],
            },
            amount: Number,
            status: {
                type: String,
                enum: ['pending', 'processing', 'completed', 'failed'],
            },
            processedAt: Date,
            transactionId: String,
        },

        // Exchange details
        exchange: {
            newOrderId: {
                type: Schema.Types.ObjectId,
                ref: 'Order',
            },
            newOrderNumber: String,
            priceDifference: Number,
            paymentRequired: Boolean,
            paymentStatus: {
                type: String,
                enum: ['pending', 'paid', 'not_required'],
            },
        },

        reason: {
            type: String,
            required: true,
        },
        customerNotes: String,
        adminNotes: String,

        requestedAt: {
            type: Date,
            default: Date.now,
        },
        approvedAt: Date,
        rejectedAt: Date,
        completedAt: Date,

        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        statusHistory: [
            {
                status: {
                    type: String,
                    enum: [
                        'pending',
                        'approved',
                        'rejected',
                        'pickup_scheduled',
                        'picked_up',
                        'received',
                        'inspected',
                        'refund_initiated',
                        'refund_completed',
                        'exchange_shipped',
                        'completed',
                        'cancelled',
                    ],
                    required: true,
                },
                note: String,
                updatedBy: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
ReturnRequestSchema.index({ storeId: 1, status: 1 });
ReturnRequestSchema.index({ storeId: 1, customerId: 1 });
ReturnRequestSchema.index({ storeId: 1, requestedAt: -1 });
ReturnRequestSchema.index({ orderId: 1, status: 1 });

// Pre-validate middleware to generate request number
ReturnRequestSchema.pre('validate', async function (next) {
    if (this.isNew && !this.requestNumber && this.storeId) {
        try {
            const count = await mongoose.models.ReturnRequest.countDocuments({
                storeId: this.storeId,
            });
            this.requestNumber = `RET-${String(count + 1).padStart(6, '0')}`;
        } catch (err) {
            // If model is not compiled yet or error
            console.error("Error generating request number", err);
            // Fallback or let it fail?
            // Usually mongoose.models.ReturnRequest works if model is exported. 
            // Better: use this.db.model('ReturnRequest') if available or just unique logic
            // Simple timestamp fallback if DB fails to ensure it passes validation? No, duplicate risk.
        }
    }
    next();
});

// Pre-save middleware for history
ReturnRequestSchema.pre('save', async function (next) {
    // Add to status history if status changed
    if (this.isModified('status')) {
        if (!this.statusHistory) {
            this.statusHistory = [];
        }
        this.statusHistory.push({
            status: this.status,
            updatedAt: new Date(),
            updatedBy: this.processedBy,
        });
    }

    next();
});

export default mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
