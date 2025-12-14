import mongoose, { Schema, Document } from 'mongoose';

/**
 * ProductOption Model - For product variations/options
 * Examples: Color, Size, Material, RAM Size, etc.
 * Used to create product variants (variable products)
 */
export interface IProductOption extends Document {
    name: string;
    slug: string;
    type: 'select' | 'multiselect' | 'color' | 'size';
    values: {
        label: string;
        value: string;
        colorCode?: string; // For color type
        image?: string; // Optional image for value
    }[];
    isFilterable: boolean; // Show in product filters
    sortOrder: number;
    storeId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ProductOptionSchema = new Schema<IProductOption>(
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
        type: {
            type: String,
            enum: ['select', 'multiselect', 'color', 'size'],
            default: 'select',
        },
        values: [
            {
                label: {
                    type: String,
                    required: true,
                },
                value: {
                    type: String,
                    required: true,
                },
                colorCode: String, // For color swatches
                image: String, // Optional image for the value
            },
        ],
        isFilterable: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
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
ProductOptionSchema.index({ storeId: 1, slug: 1 }, { unique: true });

const ProductOption = mongoose.model<IProductOption>('ProductOption', ProductOptionSchema);

export default ProductOption;
