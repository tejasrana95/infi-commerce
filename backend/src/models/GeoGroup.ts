import mongoose, { Schema, Document } from 'mongoose';

/**
 * GeoGroup Model - For grouping countries/regions for shipping rules
 * Example: "North America", "Europe", "Asia Pacific"
 */
export interface IGeoGroup extends Document {
    name: string;
    description?: string;
    countries: string[]; // Array of country codes
    storeId: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const GeoGroupSchema = new Schema<IGeoGroup>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        countries: {
            type: [String],
            required: true,
            default: [],
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

GeoGroupSchema.index({ storeId: 1, name: 1 });
GeoGroupSchema.index({ countries: 1 });

const GeoGroup = mongoose.model<IGeoGroup>('GeoGroup', GeoGroupSchema);

export default GeoGroup;
