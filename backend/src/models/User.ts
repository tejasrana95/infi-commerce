import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'customer' | 'admin' | 'store_admin';
    storeId?: mongoose.Types.ObjectId;
    isActive: boolean;
    emailVerified: boolean;
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
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
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
        role: {
            type: String,
            enum: ['customer', 'admin', 'store_admin'],
            default: 'customer',
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
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
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
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
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ storeId: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
