import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxRate extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    rate: number; // Percentage
    priority: number;
    isCompound: boolean;
    class: 'standard' | 'reduced' | 'zero' | 'custom'; // Standardization
    country?: string; // For geo-specific tax
    state?: string;
    isActive: boolean;
}

const TaxRateSchema = new Schema<ITaxRate>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        priority: {
            type: Number,
            default: 1,
        },
        isCompound: {
            type: Boolean,
            default: false,
        },
        class: {
            type: String,
            default: 'standard',
        },
        country: String,
        state: String,
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

TaxRateSchema.index({ storeId: 1, isActive: 1 });

const TaxRate = mongoose.model<ITaxRate>('TaxRate', TaxRateSchema);

export default TaxRate;
