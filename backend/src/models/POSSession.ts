import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPOSSession extends Document {
    storeId: Types.ObjectId;
    userId: Types.ObjectId;          // store_admin user
    sessionNumber: string;
    startedAt: Date;
    endedAt?: Date;
    openingCash: number;
    closingCash?: number;
    totalSales: number;
    totalTransactions: number;
    totalOrders: number;
    status: 'active' | 'closed';
    paymentBreakdown?: {
        cash: number;
        card: number;
        upi: number;
    };
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const POSSessionSchema = new Schema<IPOSSession>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        sessionNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
        openingCash: {
            type: Number,
            required: true,
            default: 0,
        },
        closingCash: {
            type: Number,
        },
        totalSales: {
            type: Number,
            required: true,
            default: 0,
        },
        totalTransactions: {
            type: Number,
            required: true,
            default: 0,
        },
        totalOrders: {
            type: Number,
            required: true,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'closed'],
            required: true,
            default: 'active',
            index: true,
        },
        paymentBreakdown: {
            cash: { type: Number, default: 0 },
            card: { type: Number, default: 0 },
            upi: { type: Number, default: 0 },
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
POSSessionSchema.index({ storeId: 1, status: 1 });
POSSessionSchema.index({ userId: 1, startedAt: -1 });
POSSessionSchema.index({ sessionNumber: 1 }, { unique: true });

const POSSession = mongoose.model<IPOSSession>('POSSession', POSSessionSchema);

export default POSSession;
