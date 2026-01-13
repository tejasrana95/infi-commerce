import mongoose, { Schema, Document } from 'mongoose';

/**
 * Currency Model - For multi-currency support
 */
export interface ICurrency extends Document {
    code: string; // ISO 4217 code (USD, EUR, GBP, etc.)
    name: string;
    symbol: string;
    exchangeRate: number; // Rate relative to base currency
    isBaseCurrency: boolean;
    isActive: boolean;
    decimalPlaces: number;
    symbolPosition: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
    createdAt: Date;
    updatedAt: Date;
}

const CurrencySchema = new Schema<ICurrency>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            length: 3,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        symbol: {
            type: String,
            required: true,
        },
        exchangeRate: {
            type: Number,
            required: true,
            default: 1,
            min: 0,
        },
        isBaseCurrency: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        decimalPlaces: {
            type: Number,
            default: 2,
            min: 0,
            max: 4,
        },
        symbolPosition: {
            type: String,
            enum: ['before', 'after'],
            default: 'before',
        },
        thousandsSeparator: {
            type: String,
            default: ',',
        },
        decimalSeparator: {
            type: String,
            default: '.',
        },
    },
    {
        timestamps: true,
    }
);


CurrencySchema.index({ isActive: 1 });
CurrencySchema.index({ isBaseCurrency: 1 });

const Currency = mongoose.model<ICurrency>('Currency', CurrencySchema);

export default Currency;
