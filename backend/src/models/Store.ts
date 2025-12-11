import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo?: string;
    currency: string;
    timezone: string;
    isActive: boolean;
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
        },
        currency: {
            type: String,
            required: true,
            default: 'USD',
            uppercase: true,
            maxlength: 3,
        },
        timezone: {
            type: String,
            required: true,
            default: 'UTC',
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
StoreSchema.index({ slug: 1 });
StoreSchema.index({ domain: 1 });
StoreSchema.index({ isActive: 1 });

const Store = mongoose.model<IStore>('Store', StoreSchema);

export default Store;
