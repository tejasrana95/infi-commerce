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

    // Returns & Refunds (NEW)
    returns: {
        totalReturnedAmount: number; // Total refund amount given to customer
        totalReturnedCogs: number; // COGS of returned items
        items: Array<{
            productId: mongoose.Types.ObjectId;
            variantId?: string;
            name: string;
            quantity: number;
            unitPrice: number; // Price at which item was sold
            unitCostPrice: number; // Cost price of the item
            refundAmount: number; // Amount refunded for this line item
            returnedAt: Date;
        }>;
    };

    // Cost of Goods Sold (COGS)
    cogs: {
        items: IOrderAccountingItem[];
        totalCogs: number;
        adjustedCogs: number; // COGS after deducting returned items
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
        totalReturns: number; // NEW: Total amount returned to customer
        netRevenue: number; // NEW: Revenue after returns
        totalCogs: number;
        adjustedCogs: number; // NEW: COGS after returns
        grossProfit: number; // Based on adjusted values
        totalExpenses: number;
        netProfit: number; // Based on adjusted values
        profitMargin: number; // Based on adjusted values
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

        // Returns & Refunds tracking
        returns: {
            totalReturnedAmount: {
                type: Number,
                default: 0,
                min: 0,
            },
            totalReturnedCogs: {
                type: Number,
                default: 0,
                min: 0,
            },
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
                    unitPrice: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    unitCostPrice: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    refundAmount: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    returnedAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
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
            adjustedCogs: {
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
            totalReturns: {
                type: Number,
                default: 0,
            },
            netRevenue: {
                type: Number,
                default: 0,
            },
            totalCogs: {
                type: Number,
                default: 0,
            },
            adjustedCogs: {
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
    // Calculate total COGS from original items
    if (this.cogs && this.cogs.items) {
        this.cogs.totalCogs = this.cogs.items.reduce(
            (sum, item) => sum + (item.totalCostPrice || 0),
            0
        );
    }

    // Calculate total returned COGS
    if (this.returns && this.returns.items) {
        const itemsAmount = this.returns.items.reduce(
            (sum, item) => sum + (item.refundAmount || 0),
            0
        );
        this.returns.totalReturnedCogs = this.returns.items.reduce(
            (sum, item) => sum + (item.unitCostPrice * item.quantity),
            0
        );

        const manualReturnAmount = this.returns.totalReturnedAmount || 0;
        // Preserve manually set return amount for full cancellations (includes tax & shipping)
        this.returns.totalReturnedAmount =
            manualReturnAmount > itemsAmount ? manualReturnAmount : itemsAmount;
    }

    // Calculate adjusted COGS (original COGS - returned items' COGS)
    const totalCogs = this.cogs?.totalCogs || 0;
    const returnedCogs = this.returns?.totalReturnedCogs || 0;
    this.cogs.adjustedCogs = totalCogs - returnedCogs;

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

    // Calculate profit metrics with returns factored in
    const grossRevenue = this.convertedOrderTotal || 0;
    const totalReturns = this.returns?.totalReturnedAmount || 0;
    const netRevenue = grossRevenue - totalReturns; // Revenue after returns
    const tax = this.tax || 0;
    
    // Tax handling: 
    // - If order is fully cancelled/refunded (netRevenue <= 0), tax is also refunded to customer
    // - Only deduct tax from profit calculation if there's remaining revenue
    const taxableNetRevenue = netRevenue <= 0 ? 0 : netRevenue - tax;

    const adjustedCogs = this.cogs?.adjustedCogs || 0;
    const grossProfit = taxableNetRevenue - adjustedCogs; // Profit after COGS and returns
    const totalExpenses = this.expenses?.totalExpenses || 0;
    const netProfit = grossProfit - totalExpenses; // Final profit after all deductions
    const profitMargin = taxableNetRevenue > 0 ? (netProfit / taxableNetRevenue) * 100 : 0;

    this.profitMetrics = {
        grossRevenue,
        totalReturns,
        netRevenue,
        totalCogs,
        adjustedCogs,
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
