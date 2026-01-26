import mongoose from 'mongoose';
import OrderAccounting, { IOrderAccounting } from '../models/OrderAccounting';
import Order from '../models/Order';
import Store from '../models/Store';
import Product from '../models/Product';
import Currency from '../models/Currency';

/**
 * Accounting Service
 * Handles accounting operations for orders including COGS, expenses, and profit calculations
 */

export interface GatewayData {
    paymentGatewayFee: number;
    actualDepositedAmount: number;
    currency: string;
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

export interface PLReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    summary: PLSummary;
    breakdown: {
        byDay: DailyBreakdown[];
        topProfitableOrders: any[];
        leastProfitableOrders: any[];
    };
}

export class AccountingService {
    /**
     * Create initial accounting record when order is placed
     */
    static async createAccountingRecord(orderId: string): Promise<IOrderAccounting> {
        const order = await Order.findById(orderId).populate('storeId');
        if (!order) {
            throw new Error('Order not found');
        }

        // Check if accounting record already exists
        const existing = await OrderAccounting.findOne({ orderId });
        if (existing) {
            return existing;
        }

        const store = await Store.findById(order.storeId);
        if (!store) {
            throw new Error('Store not found');
        }

        const baseCurrency = store.currency || 'USD';
        const orderCurrency = order.currency || baseCurrency;

        // Calculate exchange rate (if same currency, rate is 1)
        let exchangeRateUsed = order.exchangeRate || 1;

        if (orderCurrency !== baseCurrency && !order.exchangeRate) {
            const currencyDoc = await Currency.findOne({ code: orderCurrency, isActive: true });
            exchangeRateUsed = currencyDoc ? currencyDoc.exchangeRate : 1;
        }

        // order.total is in ORDER CURRENCY (e.g., $89.03 USD)
        // orderTotal stores the original order currency value
        const orderTotal = order.total;
        // convertedOrderTotal is the BASE CURRENCY value (e.g., ₹2967.80 INR)
        const convertedOrderTotal = orderTotal;

        // Build COGS items from order items
        const cogsItems = await Promise.all(
            order.items.map(async (item) => {
                // Use cost price from order item if available, otherwise fetch from product
                let unitCostPrice = item.costPrice || 0;

                if (!unitCostPrice) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        if (item.variantId && product.variants) {
                            const variant = product.variants.find((v: any) => v._id?.toString() === item.variantId);
                            unitCostPrice = variant?.costPrice || product.costPrice || 0;
                        } else {
                            unitCostPrice = product.costPrice || 0;
                        }
                    }
                }

                return {
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    quantity: item.quantity,
                    unitCostPrice,
                    totalCostPrice: unitCostPrice * item.quantity,
                    isOverridden: false,
                };
            })
        );

        const totalCogs = cogsItems.reduce((sum, item) => sum + item.totalCostPrice, 0);

        // Process returns from order (if any exist already)
        const returnItems = [];
        let totalReturnedAmount = 0;
        let totalReturnedCogs = 0;
        
        // If order is cancelled or refunded, treat entire order as returned
        if (order.status === 'cancelled' || order.status === 'refunded' || order.paymentStatus === 'refunded') {
            // Mark entire order as returned
            // order.total already includes tax, shipping, and discount applied
            // So totalReturnedAmount = full amount customer paid and gets refunded
            totalReturnedAmount = orderTotal;
            totalReturnedCogs = totalCogs;
            
            // Create return entries for all items
            for (const item of order.items) {
                const cogsItem = cogsItems.find(
                    c => c.productId.toString() === item.productId.toString() &&
                         (c.variantId || '') === (item.variantId || '')
                );
                
                const unitCostPrice = cogsItem?.unitCostPrice || 0;
                const itemTotal = item.price * item.quantity;
                
                returnItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    unitCostPrice,
                    refundAmount: itemTotal,
                    returnedAt: order.refundedAt || (order as any).updatedAt || new Date(),
                });
            }
        } else if (order.returns && order.returns.length > 0) {
            // Process partial returns
            for (const returnEntry of order.returns) {
                for (const returnedItem of returnEntry.items) {
                    // Find corresponding COGS item to get cost price
                    const cogsItem = cogsItems.find(
                        c => c.productId.toString() === returnedItem.productId.toString() &&
                             (c.variantId || '') === (returnedItem.variantId || '')
                    );
                    
                    const unitCostPrice = cogsItem?.unitCostPrice || 0;
                    const refundAmount = returnedItem.refundAmount || 0;
                    
                    returnItems.push({
                        productId: returnedItem.productId,
                        variantId: returnedItem.variantId,
                        name: cogsItem?.name || 'Unknown Product',
                        quantity: returnedItem.quantity,
                        unitPrice: returnedItem.quantity > 0 ? refundAmount / returnedItem.quantity : 0,
                        unitCostPrice,
                        refundAmount,
                        returnedAt: returnEntry.returnedAt,
                    });
                    
                    totalReturnedAmount += refundAmount;
                    totalReturnedCogs += unitCostPrice * returnedItem.quantity;
                }
            }
        }

        const accounting = new OrderAccounting({
            orderId: order._id,
            storeId: order.storeId,
            orderDate: (order as any).createdAt || new Date(),
            orderTotal,
            orderCurrency,
            baseCurrency,
            convertedOrderTotal,
            exchangeRateUsed,
            tax: order.tax || 0,
            shippingCollected: order.shippingCost || 0,
            returns: {
                totalReturnedAmount,
                totalReturnedCogs,
                items: returnItems,
            },
            cogs: {
                items: cogsItems,
                totalCogs,
                adjustedCogs: totalCogs - totalReturnedCogs,
            },
            expenses: {
                actualShippingCost: order.shippingCost || 0, // Default to collected shipping until actual is entered
                paymentGatewayFee: 0,
                actualDepositedAmount: 0,
                miscellaneous: [],
                totalExpenses: order.shippingCost || 0, // Initial expenses include shipping cost
            },
            isComplete: false,
        });

        try {
            await accounting.save();
        } catch (error: any) {
            // Handle race condition: if duplicate key error, return existing record
            if (error.code === 11000) {
                const existingRecord = await OrderAccounting.findOne({ orderId });
                if (existingRecord) {
                    return existingRecord;
                }
            }
            throw error;
        }

        // Update order with accounting reference
        try {
            order.accountingId = accounting._id as mongoose.Types.ObjectId;
            await order.save();
        } catch (error) {
            console.error('Failed to update order with accounting ID', error);
            // Ignore error as accounting record is created successfully
        }

        return accounting;
    }

    /**
     * Get accounting data for an order
     */
    static async getOrderAccounting(orderId: string): Promise<IOrderAccounting | null> {
        return OrderAccounting.findOne({ orderId });
    }

    /**
     * Regenerate accounting record for an order
     * Deletes existing record and creates a fresh one with correct calculations
     */
    static async regenerateAccountingRecord(orderId: string): Promise<IOrderAccounting> {
        // Delete existing record if any
        await OrderAccounting.deleteOne({ orderId });

        // Also clear the accountingId reference from the order
        await Order.findByIdAndUpdate(orderId, { $unset: { accountingId: 1 } });

        // Create fresh record with correct calculations
        return this.createAccountingRecord(orderId);
    }

    /**
     * Sync returns from Order model to Accounting model
     * Called when returns are processed on an order
     */
    static async syncReturnsToAccounting(orderId: string): Promise<IOrderAccounting> {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        let accounting = await OrderAccounting.findOne({ orderId });
        if (!accounting) {
            // Create accounting record if it doesn't exist
            accounting = await this.createAccountingRecord(orderId) as any;
        }

        if (!accounting) {
            throw new Error('Could not find or create accounting record');
        }

        // Process returns from order
        const returnItems = [];
        let totalReturnedAmount = 0;
        let totalReturnedCogs = 0;
        
        // If order is cancelled or refunded, treat entire order as returned
        if (order.status === 'cancelled' || order.status === 'refunded' || order.paymentStatus === 'refunded') {
            // Mark entire order as returned
            // convertedOrderTotal already includes tax, shipping, and discount
            // So totalReturnedAmount = full amount customer paid and gets refunded
            totalReturnedAmount = accounting.convertedOrderTotal;
            totalReturnedCogs = accounting.cogs.totalCogs;
            
            // Create return entries for all items
            for (const item of accounting.cogs.items) {
                const orderItem = order.items.find(
                    oi => oi.productId.toString() === item.productId.toString() &&
                          (oi.variantId || '') === (item.variantId || '')
                );
                
                const itemTotal = orderItem ? orderItem.price * orderItem.quantity : 0;
                
                returnItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: orderItem?.price || 0,
                    unitCostPrice: item.unitCostPrice,
                    refundAmount: itemTotal,
                    returnedAt: order.refundedAt || (order as any).updatedAt || new Date(),
                });
            }
        } else if (order.returns && order.returns.length > 0) {
            // Process partial returns
            for (const returnEntry of order.returns) {
                for (const returnedItem of returnEntry.items) {
                    // Find corresponding COGS item to get cost price
                    const cogsItem = accounting.cogs.items.find(
                        c => c.productId.toString() === returnedItem.productId.toString() &&
                             (c.variantId || '') === (returnedItem.variantId || '')
                    );
                    
                    const unitCostPrice = cogsItem?.unitCostPrice || 0;
                    const refundAmount = returnedItem.refundAmount || 0;
                    
                    returnItems.push({
                        productId: returnedItem.productId,
                        variantId: returnedItem.variantId,
                        name: cogsItem?.name || 'Unknown Product',
                        quantity: returnedItem.quantity,
                        unitPrice: returnedItem.quantity > 0 ? refundAmount / returnedItem.quantity : 0,
                        unitCostPrice,
                        refundAmount,
                        returnedAt: returnEntry.returnedAt,
                    });
                    
                    totalReturnedAmount += refundAmount;
                    totalReturnedCogs += unitCostPrice * returnedItem.quantity;
                }
            }
        }

        // Update returns in accounting
        accounting.returns = {
            totalReturnedAmount,
            totalReturnedCogs,
            items: returnItems,
        };

        await accounting.save();
        return accounting;
    }

    /**
     * Update accounting data for an order
     */
    static async updateAccountingData(
        orderId: string,
        data: {
            expenses?: {
                actualShippingCost?: number;
                paymentGatewayFee?: number;
                actualDepositedAmount?: number;
                miscellaneous?: Array<{ description: string; amount: number }>;
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
            lastUpdatedBy?: string;
        }
    ): Promise<IOrderAccounting> {
        let accounting = await OrderAccounting.findOne({ orderId });

        if (!accounting) {
            // Create if doesn't exist
            accounting = await this.createAccountingRecord(orderId) as any;
        }

        if (!accounting) {
            throw new Error('Could not find or create accounting record');
        }

        if (!accounting.orderDate) {
            // Backfill orderDate if missing
            const order = await Order.findById(orderId).select('createdAt');
            if (order) {
                accounting.orderDate = (order as any).createdAt;
            }
        }

        // Update expenses
        if (data.expenses) {
            if (data.expenses.actualShippingCost !== undefined) {
                accounting.expenses.actualShippingCost = data.expenses.actualShippingCost;
            }
            if (data.expenses.paymentGatewayFee !== undefined) {
                accounting.expenses.paymentGatewayFee = data.expenses.paymentGatewayFee;
            }
            if (data.expenses.actualDepositedAmount !== undefined) {
                accounting.expenses.actualDepositedAmount = data.expenses.actualDepositedAmount;
            }
            if (data.expenses.miscellaneous !== undefined) {
                accounting.expenses.miscellaneous = data.expenses.miscellaneous;
            }
        }

        // Update COGS items if provided
        if (data.cogs?.items) {
            for (const update of data.cogs.items) {
                const item = accounting.cogs.items.find(
                    (i) =>
                        i.productId.toString() === update.productId &&
                        (i.variantId || '') === (update.variantId || '')
                );
                if (item) {
                    item.unitCostPrice = update.unitCostPrice;
                    item.totalCostPrice = update.unitCostPrice * item.quantity;
                    item.isOverridden = update.isOverridden;
                }
            }
        }

        if (data.notes !== undefined) {
            accounting.notes = data.notes;
        }

        if (data.lastUpdatedBy) {
            accounting.lastUpdatedBy = new mongoose.Types.ObjectId(data.lastUpdatedBy);
        }

        await accounting.save();
        return accounting;
    }

    /**
     * Update accounting with payment gateway data
     */
    static async updateWithGatewayData(
        orderId: string,
        gatewayData: GatewayData
    ): Promise<IOrderAccounting> {
        let accounting = await OrderAccounting.findOne({ orderId });

        if (!accounting) {
            accounting = await this.createAccountingRecord(orderId) as any;
        }

        if (!accounting) {
            throw new Error('Could not find or create accounting record');
        }

        if (!accounting.orderDate) {
            const order = await Order.findById(orderId).select('createdAt');
            if (order) {
                accounting.orderDate = (order as any).createdAt;
            }
        }

        // Convert gateway fee to base currency if needed
        let fee = gatewayData.paymentGatewayFee;
        let deposited = gatewayData.actualDepositedAmount;

        if (gatewayData.currency !== accounting.baseCurrency) {
            // Use the exchange rate from the accounting record if it matches the gateway currency
            if (gatewayData.currency === accounting.orderCurrency) {
                fee = fee / accounting.exchangeRateUsed;
                deposited = deposited / accounting.exchangeRateUsed;
            } else {
                // Fetch current rate for this specific currency
                const currencyDoc = await Currency.findOne({ code: gatewayData.currency, isActive: true });
                const rate = currencyDoc ? currencyDoc.exchangeRate : 1;
                fee = fee / rate;
                deposited = deposited / rate;
            }
        }

        accounting.expenses.paymentGatewayFee = Math.round(fee * 100) / 100;
        accounting.expenses.actualDepositedAmount = Math.round(deposited * 100) / 100;
        accounting.autoFetchedAt = new Date();

        await accounting.save();
        return accounting;
    }

    /**
     * Generate P&L report for a store within date range
     */
    static async generatePLReport(
        storeId: string,
        startDate: Date,
        endDate: Date
    ): Promise<PLReport> {
        const store = await Store.findById(storeId);
        if (!store) {
            throw new Error('Store not found');
        }

        const baseCurrency = store.currency || 'USD';

        // Get all paid orders in date range
        const orders = await Order.find({
            storeId,
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid',
        }).lean();

        const orderIds = orders.map((o) => o._id);

        // Get accounting records for these orders
        const accountingRecords = await OrderAccounting.find({
            orderId: { $in: orderIds },
        });

        // Calculate summary using either existing accounting or defaults from order
        let totalRevenue = 0;
        let totalReturns = 0;
        let totalAdjustedRevenue = 0;
        let totalCogs = 0;
        let totalAdjustedCogs = 0;
        let totalExpenses = 0;
        let completedAccounting = 0;

        const combinedData = orders.map(order => {
            const acc = accountingRecords.find(a => a.orderId.toString() === order._id.toString());

            const revenue = acc?.convertedOrderTotal || order.total;
            const returns = acc?.returns?.totalReturnedAmount || 0;
            const adjustedRevenue = revenue - returns;
            const tax = acc?.tax || order.tax || 0;
            const cogs = acc?.cogs?.totalCogs || 0;
            const adjustedCogs = acc?.cogs?.adjustedCogs || cogs;
            const expenses = acc?.expenses?.totalExpenses || 0;
            
            // Use adjusted values for profit calculation
            const netProfit = adjustedRevenue - tax - adjustedCogs - expenses;
            const profitMargin = adjustedRevenue - tax > 0 ? (netProfit / (adjustedRevenue - tax)) * 100 : 0;

            totalRevenue += revenue;
            totalReturns += returns;
            totalAdjustedRevenue += adjustedRevenue;
            totalCogs += cogs;
            totalAdjustedCogs += adjustedCogs;
            totalExpenses += expenses;
            if (acc?.isComplete) completedAccounting++;

            return {
                orderId: order._id,
                revenue,
                returns,
                adjustedRevenue,
                profit: netProfit,
                margin: profitMargin
            };
        });

        const grossProfit = totalAdjustedRevenue - totalAdjustedCogs;
        const netProfit = grossProfit - totalExpenses;

        const summary: PLSummary = {
            totalOrders: orders.length,
            completedAccounting,
            pendingAccounting: orders.length - completedAccounting,
            totalRevenue,
            totalReturns,
            totalAdjustedRevenue,
            totalCogs,
            totalAdjustedCogs,
            grossProfit,
            totalExpenses,
            netProfit,
            averageProfitMargin: totalAdjustedRevenue > 0 ? Math.round((netProfit / totalAdjustedRevenue) * 10000) / 100 : 0,
            currency: baseCurrency,
        };

        // Get daily breakdown
        const byDay = await this.getDailyBreakdown(storeId, startDate, endDate);

        // Get top/bottom profitable orders
        const sortedByProfit = [...combinedData].sort((a, b) => b.profit - a.profit);

        const topProfitableOrders = sortedByProfit.slice(0, 5);
        const leastProfitableOrders = sortedByProfit.slice(-5).reverse();

        return {
            period: { startDate, endDate },
            summary,
            breakdown: {
                byDay,
                topProfitableOrders,
                leastProfitableOrders,
            },
        };
    }

    /**
     * Get daily breakdown for charts
     */
    static async getDailyBreakdown(
        storeId: string,
        startDate: Date,
        endDate: Date
    ): Promise<DailyBreakdown[]> {
        const result = await OrderAccounting.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    orderDate: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
                    },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$convertedOrderTotal' },
                    cogs: { $sum: '$cogs.totalCogs' },
                    expenses: { $sum: '$expenses.totalExpenses' },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    date: '$_id',
                    orders: 1,
                    revenue: 1,
                    cogs: 1,
                    expenses: 1,
                    profit: {
                        $subtract: [
                            {
                                $subtract: [
                                    { $subtract: ['$revenue', { $ifNull: ['$tax', 0] }] },
                                    '$cogs'
                                ]
                            },
                            '$expenses',
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    data: { $push: '$$ROOT' }
                }
            }
        ]);

        // Note: The aggregate above only includes orders WITH accounting records.
        // For accurate breakdown, it should ideally incorporate Orders directly if we want consistency.
        // But for now, we'll keep it as is or expand if needed.

        return (result[0]?.data || []).map((r: any) => ({
            date: r.date,
            orders: r.orders,
            revenue: r.revenue,
            cogs: r.cogs,
            expenses: r.expenses,
            profit: r.profit,
        }));
    }

    /**
     * Get orders with accounting data for reporting
     */
    static async getOrdersWithAccounting(
        storeId: string,
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        orders: any[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const skip = (page - 1) * limit;

        const matchQuery = {
            storeId: new mongoose.Types.ObjectId(storeId),
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid', // Only include paid orders in accounting
        };

        const total = await Order.countDocuments(matchQuery);

        const orders = await Order.find(matchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customerId', 'firstName lastName email')
            .lean();

        const orderIds = orders.map((o) => o._id);

        const accountingRecords = await OrderAccounting.find({
            orderId: { $in: orderIds },
        });

        const combinedOrders = orders.map((order) => {
            const accounting = accountingRecords.find(
                (acc) => acc.orderId.toString() === order._id.toString()
            );

            // Default values if accounting record doesn't exist
            const revenue = accounting?.convertedOrderTotal || order.total;
            const returns = accounting?.returns?.totalReturnedAmount || 0;
            const adjustedRevenue = revenue - returns;
            const tax = accounting?.tax || order.tax || 0;
            const cogs = accounting?.cogs?.totalCogs || 0;
            const adjustedCogs = accounting?.cogs?.adjustedCogs || cogs;
            const expenses = accounting?.expenses?.totalExpenses || 0;
            
            // Use adjusted COGS for profit calculation
            const netProfit = adjustedRevenue - tax - adjustedCogs - expenses;
            const profitMargin = adjustedRevenue - tax > 0 ? (netProfit / (adjustedRevenue - tax)) * 100 : 0;

            return {
                _id: accounting?._id || `temp-${order._id}`,
                orderId: {
                    _id: order._id,
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt,
                    customerId: order.customerId,
                    guestEmail: order.guestEmail,
                    status: order.status,
                },
                revenue,
                returns,
                adjustedRevenue,
                cogs: adjustedCogs, // Use adjusted COGS
                expenses,
                netProfit,
                profitMargin,
                isComplete: accounting?.isComplete || false,
                currency: accounting?.baseCurrency || 'USD',
            };
        });

        return {
            orders: combinedOrders,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Export accounting data as CSV
     */
    static async exportAccountingData(
        storeId: string,
        startDate: Date,
        endDate: Date
    ): Promise<string> {
        // Query orders first to ensure we include everything visible in the UI
        const orders = await Order.find({
            storeId: new mongoose.Types.ObjectId(storeId),
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid',
        })
            .sort({ createdAt: -1 })
            .lean();

        const orderIds = orders.map((o) => o._id);

        // Fetch corresponding accounting records
        const accountingRecords = await OrderAccounting.find({
            orderId: { $in: orderIds },
        });

        // Build CSV
        const headers = [
            'Order Number',
            'Date',
            'Order Total',
            'Returns',
            'Adjusted Revenue',
            'Order Currency',
            'Converted Total',
            'Base Currency',
            'Exchange Rate',
            'Total COGS',
            'Adjusted COGS',
            'Shipping Cost',
            'Gateway Fee',
            'Deposited Amount',
            'Misc Expenses',
            'Total Expenses',
            'Gross Profit',
            'Net Profit',
            'Profit Margin %',
            'Status',
            'Notes',
        ];

        const rows = orders.map((order) => {
            const acc = accountingRecords.find(
                (r) => r.orderId.toString() === order._id.toString()
            );

            // Calculate returns
            const returns = acc?.returns?.totalReturnedAmount || 0;

            // Calculate derived values for orders without a record
            const revenue = acc?.convertedOrderTotal || order.total;
            const adjustedRevenue = revenue - returns;
            const tax = acc?.tax || order.tax || 0;
            const cogs = acc?.cogs?.totalCogs || 0;
            const adjustedCogs = acc?.cogs?.adjustedCogs || cogs;
            const expenses = acc?.expenses?.totalExpenses || 0;
            const netProfit = adjustedRevenue - tax - adjustedCogs - expenses;
            const grossProfit = adjustedRevenue - tax - adjustedCogs;
            const profitMargin = adjustedRevenue - tax > 0 ? (netProfit / (adjustedRevenue - tax)) * 100 : 0;

            const miscTotal = (acc?.expenses?.miscellaneous || []).reduce(
                (sum, m) => sum + m.amount,
                0
            );

            return [
                order.orderNumber || '',
                order.createdAt.toISOString().split('T')[0],
                order.total,
                returns,
                adjustedRevenue,
                order.currency,
                revenue,
                acc?.baseCurrency || 'USD',
                acc?.exchangeRateUsed || order.exchangeRate || 1,
                cogs,
                adjustedCogs,
                acc?.expenses?.actualShippingCost || 0,
                acc?.expenses?.paymentGatewayFee || 0,
                acc?.expenses?.actualDepositedAmount || 0,
                miscTotal,
                expenses,
                grossProfit,
                netProfit,
                profitMargin,
                acc?.isComplete ? 'Complete' : 'Pending',
                (acc?.notes || '').replace(/"/g, '""'),
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map((row) =>
                row.map((cell) => (typeof cell === 'string' ? `"${cell}"` : cell)).join(',')
            ),
        ].join('\n');

        return csvContent;
    }
}

export default AccountingService;
