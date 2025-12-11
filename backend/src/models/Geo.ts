import mongoose, { Schema, Document } from 'mongoose';

/**
 * Country/Geo Model - For shipping and geo-restrictions
 */
export interface IGeo extends Document {
    countryCode: string; // ISO 3166-1 alpha-2 (US, CA, GB, etc.)
    countryName: string;
    states?: Array<{
        code: string;
        name: string;
        cities?: string[];
    }>;
    isActive: boolean;
    isShippingAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const GeoSchema = new Schema<IGeo>(
    {
        countryCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            length: 2,
        },
        countryName: {
            type: String,
            required: true,
            trim: true,
        },
        states: [
            {
                code: {
                    type: String,
                    uppercase: true,
                    trim: true,
                },
                name: {
                    type: String,
                    trim: true,
                },
                cities: [String],
            },
        ],
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

GeoSchema.index({ countryCode: 1 });
GeoSchema.index({ isActive: 1 });
GeoSchema.index({ isShippingAvailable: 1 });

const Geo = mongoose.model<IGeo>('Geo', GeoSchema);

export default Geo;
