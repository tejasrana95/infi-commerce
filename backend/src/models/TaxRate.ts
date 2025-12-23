import mongoose, { Schema, Document } from 'mongoose';

/**
 * Global Tax Rate Model
 * Supports split taxes (e.g., CGST + SGST = GST)
 * Not store-bound - available globally
 */

export interface ISubTax {
    name: string;
    rate: number;
}

export interface ITaxRate extends Document {
    name: string;           // e.g., "GST 18%", "VAT 20%", "Sales Tax 10%"
    rate: number;           // Total percentage (auto-calculated if split)
    isSplit: boolean;       // true for split taxes like GST
    subTaxes?: ISubTax[];   // Sub-taxes (only if isSplit is true)
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubTaxSchema = new Schema<ISubTax>(
    {
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
    },
    { _id: false }
);

const TaxRateSchema = new Schema<ITaxRate>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        rate: {
            type: Number,
            required: true,
            min: 0,
        },
        isSplit: {
            type: Boolean,
            default: false,
        },
        subTaxes: {
            type: [SubTaxSchema],
            default: undefined,
        },
        description: {
            type: String,
            trim: true,
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

// Index for active taxes
TaxRateSchema.index({ isActive: 1 });

// Pre-save middleware to auto-calculate rate from subTaxes
TaxRateSchema.pre('save', function (next) {
    if (this.isSplit && this.subTaxes && this.subTaxes.length > 0) {
        // Calculate total rate from sub-taxes
        this.rate = this.subTaxes.reduce((sum, subTax) => sum + subTax.rate, 0);
    }
    next();
});

// Virtual to get tax breakdown for display
TaxRateSchema.methods.getBreakdown = function (amount: number) {
    const taxAmount = (amount * this.rate) / 100;

    if (this.isSplit && this.subTaxes && this.subTaxes.length > 0) {
        return {
            total: taxAmount,
            breakdown: this.subTaxes.map((subTax: ISubTax) => ({
                name: subTax.name,
                rate: subTax.rate,
                amount: (amount * subTax.rate) / 100,
            })),
        };
    }

    return {
        total: taxAmount,
        breakdown: [{ name: this.name, rate: this.rate, amount: taxAmount }],
    };
};

const TaxRate = mongoose.model<ITaxRate>('TaxRate', TaxRateSchema);

export default TaxRate;
