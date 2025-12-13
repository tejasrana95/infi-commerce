import mongoose, { Schema, Document } from 'mongoose';

/**
 * Brand Model - For product brands
 * Used for product categorization and filtering
 */
export interface IBrand extends Document {
    name: string;
    slug: string;
    logo?: string; // Brand logo URL
    description?: string;
    website?: string;
    isActive: boolean;
    storeId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        logo: {
            type: String,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique slug per store
BrandSchema.index({ storeId: 1, slug: 1 }, { unique: true });

const Brand = mongoose.model<IBrand>('Brand', BrandSchema);

export default Brand;
