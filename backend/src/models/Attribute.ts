import mongoose, { Schema, Document } from 'mongoose';

/**
 * Attribute Model - For product filters and variations
 * Examples: Color, Size, Material, Brand, etc.
 */
export interface IAttribute extends Document {
    name: string;
    slug: string;
    type: 'select' | 'multiselect' | 'text' | 'color' | 'size';
    values: {
        label: string;
        value: string;
        colorCode?: string; // For color type
        image?: string; // Optional image for value
    }[];
    isFilterable: boolean; // Show in product filters
    isVariation: boolean; // Can be used for variations
    sortOrder: number;
    storeId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AttributeSchema = new Schema<IAttribute>(
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
            enum: ['select', 'multiselect', 'text', 'color', 'size'],
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
        isVariation: {
            type: Boolean,
            default: false,
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
AttributeSchema.index({ storeId: 1, slug: 1 }, { unique: true });

const Attribute = mongoose.model<IAttribute>('Attribute', AttributeSchema);

export default Attribute;
