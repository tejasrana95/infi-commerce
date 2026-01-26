/**
 * Accounting Types for Admin Panel
 */

export interface MiscellaneousExpense {
    description: string;
    amount: number;
}

export interface OrderAccountingItem {
    productId: string;
    variantId?: string;
    name: string;
    quantity: number;
    unitCostPrice: number;
    totalCostPrice: number;
    isOverridden: boolean;
}

export interface ProfitMetrics {
    grossRevenue: number;
    totalReturns: number;
    netRevenue: number;
    totalCogs: number;
    adjustedCogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
}

export interface OrderAccounting {
    _id: string;
    orderId: string;
    storeId: string;

    // Revenue
    orderTotal: number;
    orderCurrency: string;

    // Converted values
    baseCurrency: string;
    convertedOrderTotal: number;
    exchangeRateUsed: number;
    tax: number;
    shippingCollected: number;

    // Returns & Refunds
    returns: {
        totalReturnedAmount: number;
        totalReturnedCogs: number;
        items: Array<{
            productId: string;
            variantId?: string;
            name: string;
            quantity: number;
            unitPrice: number;
            unitCostPrice: number;
            refundAmount: number;
            returnedAt: string;
        }>;
    };

    // COGS
    cogs: {
        items: OrderAccountingItem[];
        totalCogs: number;
        adjustedCogs: number;
    };

    // Expenses
    expenses: {
        actualShippingCost: number;
        paymentGatewayFee: number;
        actualDepositedAmount: number;
        miscellaneous: MiscellaneousExpense[];
        totalExpenses: number;
    };

    // Profit metrics
    profitMetrics: ProfitMetrics;

    // Metadata
    isComplete: boolean;
    autoFetchedAt?: string;
    lastUpdatedBy?: string;
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

export interface PLSummary {
    totalOrders: number;
    completedAccounting: number;
    pendingAccounting: number;
    totalRevenue: number;
    totalReturns: number;
    totalAdjustedRevenue: number;
    totalCogs: number;
    totalAdjustedCogs: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    averageProfitMargin: number;
    currency: string;
}

export interface DailyBreakdown {
    date: string;
    orders: number;
    revenue: number;
    cogs: number;
    expenses: number;
    profit: number;
}

export interface OrderWithAccounting {
    _id: string;
    orderId: {
        _id: string;
        orderNumber: string;
        createdAt: string;
        customerId?: {
            firstName: string;
            lastName: string;
            email: string;
        };
        guestEmail?: string;
        status: string;
    };
    revenue: number;
    returns: number;
    adjustedRevenue: number;
    cogs: number;
    expenses: number;
    netProfit: number;
    profitMargin: number;
    isComplete: boolean;
    currency: string;
}

export interface PLReport {
    period: {
        startDate: string;
        endDate: string;
    };
    summary: PLSummary;
    breakdown: {
        byDay: DailyBreakdown[];
        topProfitableOrders: Array<{
            orderId: string;
            revenue: number;
            profit: number;
            margin: number;
        }>;
        leastProfitableOrders: Array<{
            orderId: string;
            revenue: number;
            profit: number;
            margin: number;
        }>;
    };
}

export type DateRangePreset =
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'this_month'
    | 'last_30_days'
    | 'last_90_days'
    | 'custom';

export interface DateRange {
    startDate: string;
    endDate: string;
    preset?: DateRangePreset;
}

export interface AccountingUpdatePayload {
    expenses?: {
        actualShippingCost?: number;
        paymentGatewayFee?: number;
        actualDepositedAmount?: number;
        miscellaneous?: MiscellaneousExpense[];
    };
    cogs?: {
        items?: Array<{
            productId: string;
            variantId?: string;
            unitCostPrice: number;
            isOverridden: boolean;
        }>;
    };
    notes?: string;
}
