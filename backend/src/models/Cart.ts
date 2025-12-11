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
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate subtotal before saving
CartSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
    next();
});

// Indexes
CartSchema.index({ userId: 1 });
CartSchema.index({ sessionId: 1 });
CartSchema.index({ storeId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for cart expiration

const Cart = mongoose.model<ICart>('Cart', CartSchema);

export default Cart;
