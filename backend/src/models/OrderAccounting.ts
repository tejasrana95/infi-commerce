import mongoose, { Schema, Document } from 'mongoose';

/**
 * Order Accounting Model
 * Stores accounting data for each order including COGS, expenses, and profit calculations
 * All monetary values are stored in the store's base currency
 */

export interface IOrderAccountingItem {
    productId: mongoose.Types.ObjectId;
    variantId?: string;
    name: string;
    quantity: number;
    unitCostPrice: number;
    totalCostPrice: number;
    isOverridden: boolean;
}

export interface IMiscellaneousExpense {
    description: string;
    amount: number;
}

export interface IOrderAccounting extends Document {
    orderId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;

    // Revenue (from Order)
    orderTotal: number;
    orderCurrency: string;

    // Converted to Store Base Currency
    baseCurrency: string;
    convertedOrderTotal: number;
    exchangeRateUsed: number;
    tax: number;
    shippingCollected: number;

    // Cost of Goods Sold (COGS)
    cogs: {
        items: IOrderAccountingItem[];
        totalCogs: number;
    };

    // Expenses
    expenses: {
        actualShippingCost: number;
        paymentGatewayFee: number;
        actualDepositedAmount: number;
        miscellaneous: IMiscellaneousExpense[];
        totalExpenses: number;
    };

    // Profit Calculations (auto-calculated)
    profitMetrics: {
        grossRevenue: number;
        totalCogs: number;
        grossProfit: number;
        totalExpenses: number;
        netProfit: number;
        profitMargin: number;
    };

    // Metadata
    isComplete: boolean;
    autoFetchedAt?: Date;
    lastUpdatedBy?: mongoose.Types.ObjectId;
    notes?: string;

    createdAt: Date;
    updatedAt: Date;
    orderDate: Date; // Date when order was placed
}

const OrderAccountingSchema = new Schema<IOrderAccounting>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            unique: true,
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        orderDate: {
            type: Date,
            required: true,
            index: true,
        },

        // Revenue
        orderTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        orderCurrency: {
            type: String,
            required: true,
            uppercase: true,
            maxlength: 3,
        },

        // Converted values
        baseCurrency: {
            type: String,
            required: true,
            uppercase: true,
            maxlength: 3,
        },
        convertedOrderTotal: {
            type: Number,
            required: true,
            min: 0,
        },
        exchangeRateUsed: {
            type: Number,
            required: true,
            default: 1,
        },
        tax: {
            type: Number,
            default: 0,
        },
        shippingCollected: {
            type: Number,
            default: 0,
        },

        // COGS
        cogs: {
            items: [
                {
                    productId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Product',
                        required: true,
                    },
                    variantId: String,
                    name: {
                        type: String,
                        required: true,
                    },
                    quantity: {
                        type: Number,
                        required: true,
                        min: 1,
                    },
                    unitCostPrice: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    totalCostPrice: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    isOverridden: {
                        type: Boolean,
                        default: false,
                    },
                },
            ],
            totalCogs: {
                type: Number,
                default: 0,
                min: 0,
            },
        },

        // Expenses
        expenses: {
            actualShippingCost: {
                type: Number,
                default: 0,
                min: 0,
            },
            paymentGatewayFee: {
                type: Number,
                default: 0,
                min: 0,
            },
            actualDepositedAmount: {
                type: Number,
                default: 0,
                min: 0,
            },
            miscellaneous: [
                {
                    description: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    amount: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                },
            ],
            totalExpenses: {
                type: Number,
                default: 0,
                min: 0,
            },
        },

        // Profit Metrics
        profitMetrics: {
            grossRevenue: {
                type: Number,
                default: 0,
            },
            totalCogs: {
                type: Number,
                default: 0,
            },
            grossProfit: {
                type: Number,
                default: 0,
            },
            totalExpenses: {
                type: Number,
                default: 0,
            },
            netProfit: {
                type: Number,
                default: 0,
            },
            profitMargin: {
                type: Number,
                default: 0,
            },
        },

        // Metadata
        isComplete: {
            type: Boolean,
            default: false,
            index: true,
        },
        autoFetchedAt: Date,
        lastUpdatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin',
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient querying
OrderAccountingSchema.index({ storeId: 1, orderDate: -1 });
OrderAccountingSchema.index({ storeId: 1, isComplete: 1 });

// Pre-save middleware to calculate totals and profit metrics
OrderAccountingSchema.pre('save', function (next) {
    // Calculate total COGS
    if (this.cogs && this.cogs.items) {
        this.cogs.totalCogs = this.cogs.items.reduce(
            (sum, item) => sum + (item.totalCostPrice || 0),
            0
        );
    }

    // Calculate total expenses
    if (this.expenses) {
        const miscTotal = (this.expenses.miscellaneous || []).reduce(
            (sum, item) => sum + (item.amount || 0),
            0
        );
        this.expenses.totalExpenses =
            (this.expenses.actualShippingCost || 0) +
            (this.expenses.paymentGatewayFee || 0) +
            miscTotal;
    }

    // Calculate profit metrics
    const grossRevenue = this.convertedOrderTotal || 0;
    const tax = this.tax || 0;
    const netRevenue = grossRevenue - tax; // Revenue for profit calculation should exclude tax

    const totalCogs = this.cogs?.totalCogs || 0;
    const grossProfit = netRevenue - totalCogs;
    const totalExpenses = this.expenses?.totalExpenses || 0;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    this.profitMetrics = {
        grossRevenue,
        totalCogs,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100, // Round to 2 decimal places
    };

    // Determine if accounting is complete
    // Complete if all expense fields have been entered (non-zero or explicitly set)
    this.isComplete =
        this.expenses.actualShippingCost > 0 ||
        this.expenses.paymentGatewayFee > 0 ||
        this.expenses.actualDepositedAmount > 0;

    next();
});

const OrderAccounting = mongoose.model<IOrderAccounting>(
    'OrderAccounting',
    OrderAccountingSchema
);

export default OrderAccounting;
