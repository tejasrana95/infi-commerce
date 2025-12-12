import mongoose, { Schema, Document } from 'mongoose';

/**
 * Flat Geo Model - Each country, state, and city is a separate document
 */
export interface IGeo extends Document {
    name: string;
    type: 'country' | 'state' | 'city';
    code?: string; // ISO code for countries/states
    parentId?: mongoose.Types.ObjectId; // Reference to parent geo (country for state, state for city)
    isActive: boolean;
    isShippingAvailable?: boolean; // Only for countries
    createdAt: Date;
    updatedAt: Date;
}

const GeoSchema = new Schema<IGeo>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['country', 'state', 'city'],
            required: true,
        },
        code: {
            type: String,
            uppercase: true,
            trim: true,
            sparse: true, // Allows multiple null values
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Geo',
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isShippingAvailable: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
GeoSchema.index({ type: 1, isActive: 1 });
GeoSchema.index({ parentId: 1 });
GeoSchema.index({ code: 1, type: 1 }, { unique: true, sparse: true });
GeoSchema.index({ name: 1, type: 1 });

const Geo = mongoose.model<IGeo>('Geo', GeoSchema);

export default Geo;
