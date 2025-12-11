import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingRule extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    isActive: boolean;
    priority: number;

    // Conditions
    conditions: {
        countries?: string[]; // ISO country codes
        states?: string[];
        cities?: string[];
        categoryIds?: mongoose.Types.ObjectId[];
        minWeight?: number;
        maxWeight?: number;
        minOrderValue?: number;
        maxOrderValue?: number;
    };

    // Rate calculation
    rateType: 'flat' | 'per_kg' | 'free' | 'percentage';
    rate: number;
    currency: string;

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
        conditions: {
            countries: [String],
            states: [String],
            cities: [String],
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
        },
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
    },
    {
        timestamps: true,
    }
);

// Indexes
ShippingRuleSchema.index({ storeId: 1, isActive: 1 });
ShippingRuleSchema.index({ priority: -1 });

const ShippingRule = mongoose.model<IShippingRule>('ShippingRule', ShippingRuleSchema);

export default ShippingRule;
