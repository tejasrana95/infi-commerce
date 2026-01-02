import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingRule extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    isActive: boolean;
    priority: number;

    // Conditions
    geoGroupId?: mongoose.Types.ObjectId; // Reference to GeoGroup for country matching
    categoryIds?: mongoose.Types.ObjectId[]; // Specific categories this rule applies to
    minWeight?: number;
    maxWeight?: number;
    minOrderValue?: number;
    maxOrderValue?: number;

    // Rate calculation
    rateType: 'flat' | 'per_kg' | 'free' | 'percentage';
    rate: number;
    currency: string;
    estimatedDays?: string; // e.g., "3-5 business days"

    createdAt: Date;
    updatedAt: Date;
}

const ShippingRuleSchema = new Schema<IShippingRule>(
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
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 0,
            comment: 'Higher priority rules are evaluated first',
        },
        // Conditions - simplified to geoGroupId
        geoGroupId: {
            type: Schema.Types.ObjectId,
            ref: 'GeoGroup',
        },
        categoryIds: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Category',
            },
        ],
        minWeight: Number,
        maxWeight: Number,
        minOrderValue: Number,
        maxOrderValue: Number,
        // Rate calculation
        rateType: {
            type: String,
            enum: ['flat', 'per_kg', 'free', 'percentage'],
            required: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            required: true,
            uppercase: true,
            maxlength: 3,
        },
        estimatedDays: {
            type: String,
            trim: true,
            default: '3-7 business days',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ShippingRuleSchema.index({ storeId: 1, isActive: 1 });
ShippingRuleSchema.index({ priority: -1 });
ShippingRuleSchema.index({ geoGroupId: 1 });

const ShippingRule = mongoose.model<IShippingRule>('ShippingRule', ShippingRuleSchema);

export default ShippingRule;
