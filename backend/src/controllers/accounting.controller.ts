import { Request, Response } from 'express';
import { AccountingService } from '../services/accounting.service';
import Order from '../models/Order';
import { PaymentService } from '../services/payment/payment.service';

/**
 * Accounting Controller
 * Handles API endpoints for order accounting and P&L reports
 */

/**
 * Get accounting data for a specific order
 * GET /api/accounting/:orderId
 */
export const getOrderAccounting = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        // Verify order exists and belongs to a store the user has access to
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        let accounting = await AccountingService.getOrderAccounting(orderId);

        // Create accounting record if it doesn't exist
        if (!accounting) {
            accounting = await AccountingService.createAccountingRecord(orderId);
        }

        return res.json({
            success: true,
            data: accounting,
        });
    } catch (error: any) {
        console.error('Error getting order accounting:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get accounting data',
        });
    }
};

/**
 * Update accounting data for an order
 * PUT /api/accounting/:orderId
 */
export const updateOrderAccounting = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { expenses, cogs, notes } = req.body;

        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const adminId = (req as any).admin?._id;

        const accounting = await AccountingService.updateAccountingData(orderId, {
            expenses,
            cogs,
            notes,
            lastUpdatedBy: adminId,
        });

        return res.json({
            success: true,
            data: accounting,
            message: 'Accounting data updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating order accounting:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update accounting data',
        });
    }
};

/**
 * Regenerate accounting data for an order (fixes incorrect data)
 * POST /api/accounting/:orderId/regenerate
 */
export const regenerateOrderAccounting = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const accounting = await AccountingService.regenerateAccountingRecord(orderId);

        return res.json({
            success: true,
            data: accounting,
            message: 'Accounting data regenerated successfully',
        });
    } catch (error: any) {
        console.error('Error regenerating order accounting:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to regenerate accounting data',
        });
    }
};

/**
 * Fetch payment gateway data for an order
 * POST /api/accounting/:orderId/fetch-gateway-data
 */
export const fetchGatewayData = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (!order.paymentId) {
            return res.status(400).json({
                success: false,
                message: 'No payment ID found for this order',
            });
        }

        // Get payment gateway instance
        const gateway = await PaymentService.getGatewayInstance({
            storeId: order.storeId.toString(),
            gatewayType: order.paymentMethod,
        });

        // Try to get payout/settlement details
        let gatewayData = null;

        // Each gateway has different methods for getting fee/settlement data
        if (order.paymentMethod === 'stripe' && 'getPayoutDetails' in gateway) {
            gatewayData = await (gateway as any).getPayoutDetails(order.paymentId);
        } else if (order.paymentMethod === 'paypal' && 'getTransactionDetails' in gateway) {
            gatewayData = await (gateway as any).getTransactionDetails(order.paymentId);
        } else if (order.paymentMethod === 'razorpay' && 'getSettlementDetails' in gateway) {
            gatewayData = await (gateway as any).getSettlementDetails(order.paymentId);
        }

        if (!gatewayData) {
            return res.status(400).json({
                success: false,
                message: 'Unable to fetch gateway data. This gateway may not support automatic data retrieval, or the payment has not been settled yet.',
            });
        }

        // Update accounting with gateway data
        const accounting = await AccountingService.updateWithGatewayData(orderId, {
            paymentGatewayFee: gatewayData.fee || 0,
            actualDepositedAmount: gatewayData.netAmount || gatewayData.settledAmount || 0,
            currency: gatewayData.currency,
        });

        return res.json({
            success: true,
            data: accounting,
            message: 'Gateway data fetched and applied successfully',
        });
    } catch (error: any) {
        console.error('Error fetching gateway data:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch gateway data',
        });
    }
};

/**
 * Get P&L report summary
 * GET /api/accounting/reports/summary
 */
export const getReportSummary = async (req: Request, res: Response) => {
    try {
        const { storeId, startDate, endDate, preset } = req.query;

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required',
            });
        }

        // Calculate date range based on preset or custom dates
        const { start, end } = getDateRange(
            preset as string,
            startDate as string,
            endDate as string
        );

        const report = await AccountingService.generatePLReport(
            storeId as string,
            start,
            end
        );

        return res.json({
            success: true,
            data: report,
        });
    } catch (error: any) {
        console.error('Error generating report summary:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate report',
        });
    }
};

/**
 * Get orders with accounting data for reporting
 * GET /api/accounting/reports/orders
 */
export const getReportOrders = async (req: Request, res: Response) => {
    try {
        const { storeId, startDate, endDate, preset, page = '1', limit = '20' } = req.query;

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required',
            });
        }

        const { start, end } = getDateRange(
            preset as string,
            startDate as string,
            endDate as string
        );

        const result = await AccountingService.getOrdersWithAccounting(
            storeId as string,
            start,
            end,
            parseInt(page as string, 10),
            parseInt(limit as string, 10)
        );

        return res.json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error('Error getting report orders:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get orders',
        });
    }
};

/**
 * Export accounting data as CSV
 * GET /api/accounting/reports/export
 */
export const exportReport = async (req: Request, res: Response) => {
    try {
        const { storeId, startDate, endDate, preset } = req.query;

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required',
            });
        }

        const { start, end } = getDateRange(
            preset as string,
            startDate as string,
            endDate as string
        );

        const csv = await AccountingService.exportAccountingData(
            storeId as string,
            start,
            end
        );

        const filename = `accounting-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csv);
    } catch (error: any) {
        console.error('Error exporting report:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to export report',
        });
    }
};

/**
 * Helper function to calculate date range from preset or custom dates
 */
function getDateRange(
    preset?: string,
    startDate?: string,
    endDate?: string
): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (preset) {
        case 'today':
            return { start: today, end: tomorrow };

        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { start: yesterday, end: today };
        }

        case 'last_7_days': {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return { start: sevenDaysAgo, end: tomorrow };
        }

        case 'this_month': {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { start: monthStart, end: tomorrow };
        }

        case 'last_30_days': {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return { start: thirtyDaysAgo, end: tomorrow };
        }

        case 'last_90_days': {
            const ninetyDaysAgo = new Date(today);
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            return { start: ninetyDaysAgo, end: tomorrow };
        }

        case 'custom':
        default:
            // Use provided dates or default to last 30 days
            if (startDate && endDate) {
                return {
                    start: new Date(startDate),
                    end: new Date(endDate),
                };
            }
            const defaultStart = new Date(today);
            defaultStart.setDate(defaultStart.getDate() - 30);
            return { start: defaultStart, end: tomorrow };
    }
}
