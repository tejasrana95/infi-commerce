import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model - For Admin and Store Admin accounts only
 * For customer accounts, use the Customer model
 */
export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: 'admin' | 'store_admin' | 'super_admin';
    storeId?: mongoose.Types.ObjectId;
    isActive: boolean;
    emailVerified: boolean;
    permissions?: string[]; // For granular permissions
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    twoFactorBackupCodes?: string[];
    lastLogin?: Date;
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
            index: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
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
            enum: ['admin', 'store_admin', 'super_admin'],
            default: 'admin',
            required: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            // Required for store_admin, optional for super_admin
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        permissions: {
            type: [String],
            default: [],
        },
        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },
        twoFactorSecret: {
            type: String,
        },
        twoFactorBackupCodes: {
            type: [String],
            default: [],
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
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12); // Increased salt rounds for admin accounts
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
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ storeId: 1 });
UserSchema.index({ isActive: 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
