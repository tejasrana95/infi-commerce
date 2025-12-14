import mongoose, { Schema, Document } from 'mongoose';

/**
 * Attribute Model - For product specifications/features
 * Used for: Product details page, filtering, product comparison
 * Examples: Screen Size, HDD Capacity, Recyclable?, Material, etc.
 */
export interface IAttribute extends Document {
    name: string;           // Display name: "Screen Size"
    slug: string;           // URL-friendly: "screen-size"
    type: 'select' | 'multiselect' | 'checkbox' | 'text' | 'number';
    options?: string[];     // For select/multiselect: ["13 inch", "16 inch", "17 inch"]
    unit?: string;          // For number type: "kg", "cm", "GB"
    isFilterable: boolean;  // Show in product filters
    isComparable: boolean;  // Show in product comparison table
    isRequired: boolean;    // Required when adding to product
    categoryIds?: mongoose.Types.ObjectId[]; // Limit to specific categories
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
            enum: ['select', 'multiselect', 'checkbox', 'text', 'number'],
            default: 'select',
        },
        options: {
            type: [String],
            default: [],
        },
        unit: {
            type: String,
            trim: true,
        },
        isFilterable: {
            type: Boolean,
            default: true,
        },
        isComparable: {
            type: Boolean,
            default: true,
        },
        isRequired: {
            type: Boolean,
            default: false,
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
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
AttributeSchema.index({ storeId: 1, isFilterable: 1 });
AttributeSchema.index({ categoryIds: 1 });

const Attribute = mongoose.model<IAttribute>('Attribute', AttributeSchema);

export default Attribute;
