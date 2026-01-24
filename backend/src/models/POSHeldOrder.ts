import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPOSHeldOrder extends Document {
    storeId: Types.ObjectId;
    sessionId: Types.ObjectId;
    assignedToUserId: Types.ObjectId;  // User who held the order
    customerIdentifier: string;         // Customer name or phone
    customerId?: Types.ObjectId;        // Optional if customer exists in system
    items: {
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        price: number;
        basePrice: number;
        quantity: number;
        taxRate?: number;
        taxAmount?: number;
        image?: string;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    notes?: string;
    heldAt: Date;
    status: 'held' | 'resumed' | 'cancelled';
    resumedAt?: Date;
    resumedByUserId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const POSHeldOrderSchema = new Schema<IPOSHeldOrder>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: 'POSSession',
            required: true,
            index: true,
        },
        assignedToUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        customerIdentifier: {
            type: String,
            required: true,
            trim: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            index: true,
        },
        items: [
            {
                productId: { type: String, required: true },
                variantId: { type: String },
                name: { type: String, required: true },
                sku: { type: String, required: true },
                price: { type: Number, required: true },
                basePrice: { type: Number, required: true },
                quantity: { type: Number, required: true },
                taxRate: { type: Number },
                taxAmount: { type: Number },
                image: { type: String },
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },
        heldAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['held', 'resumed', 'cancelled'],
            required: true,
            default: 'held',
            index: true,
        },
        resumedAt: {
            type: Date,
        },
        resumedByUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
POSHeldOrderSchema.index({ storeId: 1, status: 1 });
POSHeldOrderSchema.index({ assignedToUserId: 1, status: 1 });
POSHeldOrderSchema.index({ sessionId: 1, status: 1 });
POSHeldOrderSchema.index({ heldAt: -1 });

const POSHeldOrder = mongoose.model<IPOSHeldOrder>('POSHeldOrder', POSHeldOrderSchema);

export default POSHeldOrder;
