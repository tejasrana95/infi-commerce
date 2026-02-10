import mongoose, { Schema, Document } from 'mongoose';

export interface ISlugRegistry extends Document {
    storeId: mongoose.Types.ObjectId;
    slug: string;
    entityType: 'product' | 'category' | 'page' | 'brand';
    entityId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SlugRegistrySchema = new Schema<ISlugRegistry>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        entityType: {
            type: String,
            enum: ['product', 'category', 'page', 'brand'],
            required: true,
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to prevent duplicate slugs within a store
SlugRegistrySchema.index({ storeId: 1, slug: 1 }, { unique: true });

// Compound index for fast lookup by entity
SlugRegistrySchema.index({ storeId: 1, entityType: 1, entityId: 1 });

const SlugRegistry = mongoose.model<ISlugRegistry>('SlugRegistry', SlugRegistrySchema);

export default SlugRegistry;
