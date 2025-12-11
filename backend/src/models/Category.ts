import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: mongoose.Types.ObjectId;
    isActive: boolean;
    sortOrder: number;
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
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
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        seo: {
            metaTitle: String,
            metaDescription: String,
            metaKeywords: [String],
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for unique slug per store
CategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ isActive: 1 });

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
