import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
    name: string;
    keyHash: string;
    keyPrefix: string; // First 8 chars for display (e.g., "ak_xxxx...")
    channel: 'web' | 'mobile' | 'third_party' | 'internal';
    allowedIps: string[]; // Empty or ['0.0.0.0'] means any IP
    validFrom: Date;
    validUntil?: Date; // Optional - if not set, key never expires
    rateLimit?: number; // Requests per minute, undefined = unlimited
    permissions: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
    storeScope: 'all' | 'single';
    storeId?: mongoose.Types.ObjectId; // Required if storeScope is 'single'
    isActive: boolean;
    trackUsage: boolean; // Whether to track lastUsedAt and usageCount
    lastUsedAt?: Date;
    usageCount: number;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        keyHash: {
            type: String,
            required: true,
            unique: true,
        },
        keyPrefix: {
            type: String,
            required: true,
        },
        channel: {
            type: String,
            enum: ['web', 'mobile', 'third_party', 'internal'],
            required: true,
            default: 'third_party',
        },
        allowedIps: {
            type: [String],
            default: ['0.0.0.0'], // Default: allow all
        },
        validFrom: {
            type: Date,
            required: true,
            default: Date.now,
        },
        validUntil: {
            type: Date,
        },
        rateLimit: {
            type: Number,
            min: 1,
            max: 10000,
        },
        permissions: {
            type: [String],
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            required: true,
            default: ['GET'],
        },
        storeScope: {
            type: String,
            enum: ['all', 'single'],
            required: true,
            default: 'all',
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        trackUsage: {
            type: Boolean,
            default: true, // Track usage by default
        },
        lastUsedAt: {
            type: Date,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes

ApiKeySchema.index({ isActive: 1 });
ApiKeySchema.index({ createdBy: 1 });

// Static method to generate a new API key
ApiKeySchema.statics.generateKey = function (): { key: string; hash: string; prefix: string } {
    const key = `ak_${crypto.randomBytes(32).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 12) + '...';
    return { key, hash, prefix };
};

// Static method to hash a key for lookup
ApiKeySchema.statics.hashKey = function (key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
};

// Instance method to check if key is currently valid
ApiKeySchema.methods.isValid = function (): boolean {
    if (!this.isActive) return false;

    const now = new Date();
    if (this.validFrom > now) return false;
    if (this.validUntil && this.validUntil < now) return false;

    return true;
};

// Instance method to check IP access
ApiKeySchema.methods.isIpAllowed = function (ip: string): boolean {
    // If no IPs specified or contains 0.0.0.0, allow all
    if (!this.allowedIps || this.allowedIps.length === 0) return true;
    if (this.allowedIps.includes('0.0.0.0')) return true;

    // Check if IP matches any allowed IP
    return this.allowedIps.includes(ip);
};

// Instance method to check method permission
ApiKeySchema.methods.hasPermission = function (method: string): boolean {
    return this.permissions.includes(method.toUpperCase());
};

// Instance method to record usage
ApiKeySchema.methods.recordUsage = async function (): Promise<void> {
    this.lastUsedAt = new Date();
    this.usageCount += 1;
    await this.save();
};

const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;
