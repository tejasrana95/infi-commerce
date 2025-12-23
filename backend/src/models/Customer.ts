import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Customer Model - For customer/shopper accounts
 * Separate from User model (admin accounts) for better security
 */
export interface ICustomer extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isActive: boolean;
    emailVerified: boolean;
    socialAccounts?: Array<{
        provider: string;
        providerId: string;
    }>;
    addresses: Array<{
        type: 'billing' | 'shipping';
        firstName: string;
        lastName: string;
        address1: string;
        address2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        phone: string;
        isDefault: boolean;
    }>;
    wishlist: mongoose.Types.ObjectId[]; // Product IDs
    cart?: mongoose.Types.ObjectId; // Cart ID
    preferences: {
        currency?: string;
        language?: string;
        newsletter?: boolean;
    };
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        socialAccounts: [
            {
                provider: { type: String, required: true },
                providerId: { type: String, required: true },
            },
        ],
        addresses: [
            {
                type: {
                    type: String,
                    enum: ['billing', 'shipping'],
                    required: true,
                },
                firstName: { type: String, required: true },
                lastName: { type: String, required: true },
                address1: { type: String, required: true },
                address2: String,
                city: { type: String, required: true },
                state: { type: String, required: true },
                country: { type: String, required: true },
                postalCode: { type: String, required: true },
                phone: { type: String, required: true },
                isDefault: { type: Boolean, default: false },
            },
        ],
        wishlist: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
        cart: {
            type: Schema.Types.ObjectId,
            ref: 'Cart',
        },
        preferences: {
            currency: {
                type: String,
                default: 'USD',
            },
            language: {
                type: String,
                default: 'en',
            },
            newsletter: {
                type: Boolean,
                default: false,
            },
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
CustomerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// Method to compare passwords
CustomerSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ isActive: 1 });
CustomerSchema.index({ emailVerified: 1 });
CustomerSchema.index({ createdAt: -1 });

const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;
