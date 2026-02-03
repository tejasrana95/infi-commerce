import POSSession, { IPOSSession } from '../models/POSSession';
import Order from '../models/Order';
import User from '../models/User';
import Store from '../models/Store';
import ReturnRequest from '../models/ReturnRequest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import ReturnCalculationService from './return-calculation.service';
import { PaymentService } from './payment/payment.service';

class POSService {
    /**
     * Start a new POS session
     */
    async startSession(
        storeId: mongoose.Types.ObjectId,
        userId: mongoose.Types.ObjectId,
        openingCash: number
    ): Promise<IPOSSession> {
        // Check if there's an active session for this store
        const activeSession = await POSSession.findOne({
            storeId,
            status: 'active',
        });

        if (activeSession) {
            throw new Error('An active POS session already exists for this store. Please close it first.');
        }

        // Generate session number
        const sessionNumber = await this.generateSessionNumber(storeId);

        const session = await POSSession.create({
            storeId,
            userId,
            sessionNumber,
            openingCash,
            startedAt: new Date(),
            status: 'active',
            totalSales: 0,
            totalTransactions: 0,
            totalOrders: 0,
            paymentBreakdown: {
                cash: 0,
                card: 0,
                upi: 0,
                qr: 0,
            },
        });

        return session;
    }

    /**
     * End a POS session
     */
    async endSession(
        sessionId: mongoose.Types.ObjectId,
        closingCash: number,
        notes?: string
    ): Promise<IPOSSession> {
        const session = await POSSession.findById(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        if (session.status !== 'active') {
            throw new Error('Session is not active');
        }

        // Aggregate actual sales from orders to ensure accuracy
        const aggregation = await Order.aggregate([
            {
                $match: {
                    posSessionId: session._id,
                    paymentStatus: 'paid' // Only count paid orders
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Reset and populate from aggregation
        let totalSales = 0;
        let totalOrders = 0;
        const breakdown = {
            cash: 0,
            card: 0,
            upi: 0,
            qr: 0
        };

        for (const stat of aggregation) {
            totalSales += stat.total;
            totalOrders += stat.count;

            const method = stat._id;
            if (method === 'cash') breakdown.cash += stat.total;
            else if (method === 'card') breakdown.card += stat.total;
            else if (method === 'upi' || method === 'qr') breakdown.qr += stat.total;
        }

        session.status = 'closed';
        session.endedAt = new Date();
        session.closingCash = closingCash;
        session.totalSales = totalSales;
        session.totalOrders = totalOrders;
        session.paymentBreakdown = breakdown; // Update with aggregated values

        if (notes) {
            session.notes = notes;
        }

        await session.save();

        return session;
    }

    /**
     * Get current active session for a store
     */
    async getCurrentSession(storeId: mongoose.Types.ObjectId): Promise<IPOSSession | null> {
        const session = await POSSession.findOne({
            storeId,
            status: 'active',
        }).populate('userId', 'name email');

        return session;
    }

    /**
     * Get session history
     */
    async getSessionHistory(
        storeId: mongoose.Types.ObjectId,
        search = '',
        status = 'all',
        limit: number = 20,
        skip: number = 0
    ): Promise<{ sessions: IPOSSession[]; total: number; stats: { activeSessions: number; totalSales: number } }> {
        const filter: any = {};
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (storeId) {
            filter.storeId = storeId;
        }
        if (search) {
            filter.$or = [
                { sessionNumber: { $regex: search, $options: 'i' } },
            ];
        }
        const sessions = await POSSession.find(filter)
            .populate('userId', 'firstName lastName role email')
            .sort({ startedAt: -1 })
            .limit(limit)
            .skip(skip);

        const total = await POSSession.countDocuments({ storeId });

        // Calculate stats
        const statsAggregation = await POSSession.aggregate([
            {
                $match: {
                    storeId,
                },
            },
            {
                $facet: {
                    activeSessions: [
                        {
                            $match: { status: 'active' },
                        },
                        {
                            $count: 'count',
                        },
                    ],
                    totalSales: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$totalSales' },
                            },
                        },
                    ],
                },
            },
        ]);

        const activeSessions = statsAggregation[0].activeSessions[0]?.count || 0;
        const totalSales = statsAggregation[0].totalSales[0]?.total || 0;

        return {
            sessions,
            total,
            stats: {
                activeSessions,
                totalSales,
            },
        };
    }

    /**
     * Update session totals when order is created
     */
    async updateSessionTotals(
        sessionId: mongoose.Types.ObjectId,
        orderTotal: number,
        paymentMethod: 'cash' | 'card' | 'upi' | 'qr'
    ): Promise<void> {
        const session = await POSSession.findById(sessionId);

        if (!session) {
            throw new Error('Session not found');
        }

        session.totalSales += orderTotal;
        session.totalTransactions += 1;
        session.totalOrders += 1;

        // Update payment breakdown
        if (session.paymentBreakdown) {
            // Normalize upi/qr
            const method = paymentMethod === 'upi' ? 'qr' : paymentMethod;

            if (method === 'qr') {
                session.paymentBreakdown.qr = (session.paymentBreakdown.qr || 0) + orderTotal;
            } else {
                // Safe access
                const key = method as keyof typeof session.paymentBreakdown;
                if (session.paymentBreakdown[key] !== undefined) {
                    session.paymentBreakdown[key] += orderTotal;
                }
            }
        }

        await session.save();
    }


    /**
     * Check if user has specific POS permission
     */
    async checkUserPermission(
        userId: mongoose.Types.ObjectId,
        permission: 'canApplyDiscount'
    ): Promise<boolean> {
        const user = await User.findById(userId);

        if (!user) {
            return false;
        }

        // Super admin always has all permissions
        if (user.role === 'super_admin') {
            return true;
        }

        // Check POS permissions
        if (user.posPermissions) {
            return user.posPermissions[permission] === true;
        }

        return false;
    }

    /**
     * Verify user password for sensitive actions
     */
    async verifyPassword(
        userId: mongoose.Types.ObjectId,
        password: string
    ): Promise<boolean> {
        const user = await User.findById(userId).select('+password');

        if (!user || !user.password) {
            throw new Error('User not found');
        }

        const isValid = await bcrypt.compare(password, user.password);

        return isValid;
    }

    /**
     * Calculate round-off amount
     */
    calculateRoundOff(amount: number): number {
        const rounded = Math.round(amount);
        return rounded - amount; // Positive if rounding up, negative if rounding down
    }

    /**
     * Get POS dashboard data (today's sales, orders, etc.)
     */
    async getDashboardData(storeId: mongoose.Types.ObjectId): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get current active session
        const currentSession = await this.getCurrentSession(storeId);

        // Get today's orders
        const todayOrders = await Order.find({
            storeId,
            isPOSOrder: true,
            createdAt: { $gte: today, $lt: tomorrow },
        }).select('orderNumber total paymentStatus createdAt');

        // Calculate today's totals
        const todayStats = {
            totalSales: todayOrders.reduce((sum, order) => sum + order.total, 0),
            totalOrders: todayOrders.length,
            paidOrders: todayOrders.filter(o => o.paymentStatus === 'paid').length,
        };

        // Get payment method breakdown for today
        const paymentBreakdown = await Order.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId.toString()),
                    isPOSOrder: true,
                    createdAt: { $gte: today, $lt: tomorrow },
                },
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$total' },
                    count: { $sum: 1 },
                },
            },
        ]);

        return {
            currentSession,
            today: todayStats,
            paymentBreakdown,
            recentOrders: todayOrders.slice(0, 10),
        };
    }

    /**
     * Generate receipt data for an order
     */
    async generateReceiptData(orderId: mongoose.Types.ObjectId): Promise<any> {
        const order = await Order.findById(orderId)
            .populate('storeId')
            .populate('customerId', 'name email phone');

        if (!order) {
            throw new Error('Order not found');
        }

        const store: any = order.storeId;

        // Get POS settings for receipt configuration
        const receiptSettings = store.posSettings?.receiptSettings || {};

        return {
            order,
            store: {
                name: store.name,
                logo: receiptSettings.showLogo ? store.logo : null,
                headerText: receiptSettings.headerText,
                footerText: receiptSettings.footerText,
            },
            paperWidth: receiptSettings.paperWidth || '80mm',
        };
    }

    // Helper Methods

    /**
     * Generate unique session number
     */
    private async generateSessionNumber(storeId: mongoose.Types.ObjectId): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        // Count sessions for today
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const count = await POSSession.countDocuments({
            storeId,
            startedAt: { $gte: todayStart, $lte: todayEnd },
        });

        const sequenceNumber = (count + 1).toString().padStart(3, '0');

        return `POS-${dateStr}-${sequenceNumber}`;
    }

    /**
     * Calculate refund amount for return items (without processing the return)
     */
    async calculateRefund(
        orderId: mongoose.Types.ObjectId,
        storeId: mongoose.Types.ObjectId,
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
        }>
    ): Promise<any> {
        const order = await Order.findOne({ _id: orderId, storeId });
        if (!order) {
            throw new Error('Order not found');
        }

        // Prepare order details for calculation service
        // Since discount is now stored per-item, no need to fetch coupon details
        const orderDetails = {
            items: order.items.map((item: any) => ({
                productId: item.productId.toString(),
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                originalPrice: item.originalPrice || item.price,
                price: item.price,
                quantity: item.quantity,
                taxRate: item.taxRate || 0,
                taxAmount: item.taxAmount || 0,
                shippingCost: (item as any).shippingCost || 0,
                // New discount fields (per unit)
                discountAmount: item.discountAmount || 0,
                couponDiscount: item.couponDiscount || 0,
                manualDiscount: item.manualDiscount || 0,
                isCouponEligible: item.isCouponEligible || false,
                // Return tracking
                returnedQuantity: item.returnedQuantity || 0,
                refundedAmount: item.refundedAmount || 0,
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            shippingCost: order.shippingCost || 0,
            total: order.total,
            discount: order.discount || 0,
            couponCode: order.couponCode,
        };

        // Prepare return items for calculation service
        const returnItems = items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
        }));

        // Validate return request
        const validation = ReturnCalculationService.validateReturn(orderDetails, returnItems);
        if (!validation.valid) {
            throw new Error(`Return validation failed: ${validation.errors.join(', ')}`);
        }

        // Calculate refund using the service
        const refundCalculation = ReturnCalculationService.calculateRefund(orderDetails, returnItems);

        return refundCalculation;
    }

    /**
     * Process order return
     * Creates a ReturnRequest document for consistency with frontend returns
     * Automatically processes refund via payment gateway if applicable
     */
    async processReturn(
        orderId: mongoose.Types.ObjectId,
        storeId: mongoose.Types.ObjectId,
        userId: mongoose.Types.ObjectId,
        sessionId: mongoose.Types.ObjectId,
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
            reason?: string;
        }>,
        refundAmount: number,
        refundMethod: string, // 'cash' | 'original'
        reason: string,
        notes?: string
    ): Promise<any> {
        const order = await Order.findOne({ _id: orderId, storeId });
        if (!order) {
            throw new Error('Order not found');
        }

        // Validate Return Window
        const store = await Store.findById(storeId).select('settings.returnSettings');
        const returnWindow = store?.settings?.returnSettings?.defaultReturnWindow || 30; // Default 30 days

        const orderDate = new Date(order.createdAt);
        const currentDate = new Date();
        const diffTime = Math.abs(currentDate.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > returnWindow) {
            throw new Error(`Return window expired. This order was placed ${diffDays} days ago (limit: ${returnWindow} days).`);
        }

        // Prepare order details for calculation service
        const orderDetails = {
            items: order.items.map((item: any) => ({
                productId: item.productId.toString(),
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                originalPrice: item.originalPrice || item.price,
                price: item.price,
                quantity: item.quantity,
                taxRate: item.taxRate || 0,
                taxAmount: item.taxAmount || 0,
                shippingCost: (item as any).shippingCost || 0,
                discountAmount: item.discountAmount || 0,
                couponDiscount: item.couponDiscount || 0,
                manualDiscount: item.manualDiscount || 0,
                isCouponEligible: item.isCouponEligible || false,
                returnedQuantity: item.returnedQuantity || 0,
                refundedAmount: item.refundedAmount || 0,
            })),
            subtotal: order.subtotal,
            tax: order.tax,
            shippingCost: order.shippingCost || 0,
            total: order.total,
            discount: order.discount || 0,
            couponCode: order.couponCode,
        };

        // Prepare return items for calculation service
        const returnItems = items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reason: item.reason,
        }));

        // Validate return request
        const validation = ReturnCalculationService.validateReturn(orderDetails, returnItems);
        if (!validation.valid) {
            throw new Error(`Return validation failed: ${validation.errors.join(', ')}`);
        }

        // Calculate refund using the service
        const refundCalculation = ReturnCalculationService.calculateRefund(orderDetails, returnItems);

        // Validate that frontend calculation matches backend calculation (within small tolerance)
        const tolerance = 0.01;
        if (Math.abs(refundCalculation.refundAmount - refundAmount) > tolerance) {
            throw new Error(
                `Refund amount mismatch. Calculated: ${refundCalculation.refundAmount.toFixed(2)}, Provided: ${refundAmount.toFixed(2)}`
            );
        }

        // Build return items with refund breakdown for ReturnRequest
        // Note: ReturnCalculationService returns unitPrice (per unit price after discount), taxAmount (total tax for quantity)
        const returnRequestItems = refundCalculation.itemRefunds.map((itemRefund: any) => {
            const orderItem = order.items.find(
                (i: any) =>
                    i.productId.toString() === itemRefund.productId &&
                    (i.variantId === itemRefund.variantId || (!i.variantId && !itemRefund.variantId))
            );
            const inputItem = items.find(i => i.productId === itemRefund.productId);

            // Calculate subtotal refund (price * quantity, before tax)
            const subtotalRefund = itemRefund.unitPrice * itemRefund.quantity;

            return {
                productId: new mongoose.Types.ObjectId(itemRefund.productId),
                variantId: itemRefund.variantId,
                name: orderItem?.name || itemRefund.name || '',
                sku: orderItem?.sku || itemRefund.sku || '',
                image: orderItem?.image,
                quantity: itemRefund.quantity,
                reason: inputItem?.reason || reason,
                condition: 'opened' as const,
                unitPrice: itemRefund.unitPrice,
                unitTax: itemRefund.taxAmount / itemRefund.quantity, // Per unit tax
                unitShipping: 0, // POS orders typically don't have shipping
                subtotalRefund: subtotalRefund,
                taxRefund: itemRefund.taxAmount,
                shippingRefund: itemRefund.shippingRefund || 0,
                refundAmount: itemRefund.totalRefund,
            };
        });

        // Determine if we should process via payment gateway
        const isGatewayRefund = refundMethod === 'original' &&
            order.paymentStatus === 'paid' &&
            order.paymentMethod &&
            ['razorpay', 'stripe', 'paypal'].includes(order.paymentMethod);

        let gatewayRefundResponse: any = null;
        let refundTransactionId: string | undefined;

        // Process refund via payment gateway if applicable
        if (isGatewayRefund) {
            // Get payment ID from order - check different locations
            const paymentId = order.paymentId ||
                order.posPaymentDetails?.qrDetails?.gatewayDetails?.gatewayPaymentId ||
                order.posPaymentDetails?.cardDetails?.transactionId;

            if (!paymentId) {
                throw new Error(`No payment ID found for this order. Cannot process automatic refund via ${order.paymentMethod}.`);
            }

            try {
                // console.log(`💳 Processing POS refund via ${order.paymentMethod} for payment: ${paymentId}`);

                const paymentService = await PaymentService.getGatewayInstance({
                    storeId: storeId.toString(),
                    gatewayType: order.paymentMethod,
                });

                // Apply exchange rate if stored on order
                const exchangeRate = order.exchangeRate || 1;
                const refundAmountInGatewayCurrency = refundCalculation.refundAmount * exchangeRate;
                const currency = order.currency || 'INR';

                gatewayRefundResponse = await paymentService.processRefund({
                    paymentId,
                    amount: refundAmountInGatewayCurrency,
                    currency,
                    reason: `POS Return for order #${order.orderNumber}`,
                });

                if (gatewayRefundResponse.status !== 'success' && gatewayRefundResponse.status !== 'pending') {
                    const errorMessage = gatewayRefundResponse.gatewayResponse?.message || 'Unknown error';
                    throw new Error(`Refund processing failed: ${errorMessage}`);
                }

                refundTransactionId = gatewayRefundResponse.refundId;

            } catch (error: any) {
                console.error('Payment gateway refund error:', error);
                throw new Error(`Failed to process refund via ${order.paymentMethod}: ${error.message}`);
            }
        }

        // Create ReturnRequest document for audit trail and consistency
        // Use refundCalculation.breakdown which has properly calculated values
        const returnRequest = await ReturnRequest.create({
            storeId,
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerId: order.customerId,
            type: 'return',
            status: 'refund_completed', // POS returns are processed immediately
            totalRefundAmount: refundCalculation.refundAmount,
            refundBreakdown: {
                itemsSubtotal: refundCalculation.breakdown.subtotal,
                itemsTax: refundCalculation.breakdown.tax,
                itemsShipping: refundCalculation.breakdown.shipping,
                totalRefund: refundCalculation.refundAmount,
            },
            currency: order.currency,
            exchangeRate: order.exchangeRate,
            // POS-specific fields
            isPOSReturn: true,
            posSessionId: sessionId,
            posUserId: userId,
            items: returnRequestItems,
            pickup: {
                method: 'internal', // POS returns don't need pickup
                receivedAt: new Date(),
            },
            refund: {
                method: refundMethod === 'original' ? 'original' : 'original', // Cash refunds handled at counter
                amount: refundCalculation.refundAmount,
                subtotal: refundCalculation.breakdown.subtotal,
                tax: refundCalculation.breakdown.tax,
                shipping: refundCalculation.breakdown.shipping,
                status: 'completed',
                processedAt: new Date(),
                transactionId: refundTransactionId || `POS-REF-${Date.now()}`,
            },
            reason,
            customerNotes: notes,
            requestedAt: new Date(),
            approvedAt: new Date(),
            completedAt: new Date(),
            processedBy: userId,
            statusHistory: [
                { status: 'pending', updatedAt: new Date(), updatedBy: userId },
                { status: 'approved', updatedAt: new Date(), updatedBy: userId },
                { status: 'received', updatedAt: new Date(), updatedBy: userId },
                { status: 'refund_completed', updatedAt: new Date(), updatedBy: userId },
            ],
        });

        // Update order items with returned quantities and refunded amounts
        for (const itemRefund of refundCalculation.itemRefunds) {
            const orderItem = order.items.find(
                (i: any) =>
                    i.productId.toString() === itemRefund.productId &&
                    (i.variantId === itemRefund.variantId || (!i.variantId && !itemRefund.variantId))
            );

            if (orderItem) {
                orderItem.returnedQuantity = (orderItem.returnedQuantity || 0) + itemRefund.quantity;
                orderItem.refundedAmount = (orderItem.refundedAmount || 0) + itemRefund.totalRefund;
            }
        }

        // Add return record to order (keeping existing structure for backward compatibility)
        // itemRefund has: unitPrice (per unit price), taxAmount (total tax for qty), shippingRefund, totalRefund
        if (!order.returns) order.returns = [];
        order.returns.push({
            returnedAt: new Date(),
            items: refundCalculation.itemRefunds.map((item: any) => ({
                productId: new mongoose.Types.ObjectId(item.productId),
                variantId: item.variantId,
                quantity: item.quantity,
                reason: items.find(i => i.productId === item.productId)?.reason || reason,
                refundAmount: item.totalRefund,
                subtotalRefund: item.unitPrice * item.quantity, // Calculate subtotal from unit price
                taxRefund: item.taxAmount,
                shippingRefund: item.shippingRefund || 0,
            })),
            totalRefundAmount: refundCalculation.refundAmount,
            refundBreakdown: {
                itemsSubtotal: refundCalculation.breakdown.subtotal,
                itemsTax: refundCalculation.breakdown.tax,
                itemsShipping: refundCalculation.breakdown.shipping,
                totalRefund: refundCalculation.refundAmount,
            },
            refundMethod,
            processedBy: userId,
            note: notes,
            refundReference: refundTransactionId || `POS-REF-${Date.now()}`,
            returnRequestId: returnRequest._id, // Link to ReturnRequest
        });

        // Update Order Status
        const allItemsReturned = order.items.every((i: any) => (i.returnedQuantity || 0) === i.quantity);
        if (allItemsReturned) {
            order.status = 'returned';
            order.paymentStatus = 'refunded';
            order.refundStatus = 'processed';
            order.refundedAt = new Date();
        } else {
            order.status = 'partially_returned';
            order.paymentStatus = 'partially_refunded';
            order.refundStatus = 'processed';
        }

        // Store gateway refund reference on order
        if (gatewayRefundResponse?.refundId) {
            order.refundReferenceId = gatewayRefundResponse.refundId;
        }
        order.returnStatus = 'refund_completed';
        order.returnRequestId = returnRequest._id;

        await order.save();

        // Restore Inventory
        const inventoryItems = items.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
        }));

        // Dynamic import to avoid circular dependency
        const { default: InventoryService } = await import('./inventory.service');
        await InventoryService.restoreStock(inventoryItems);

        // Update POS Session with Refund
        await this.recordSessionRefund(sessionId, refundCalculation.refundAmount);

        // Sync accounting if applicable
        try {
            const { AccountingService } = await import('./accounting.service');
            await AccountingService.syncReturnsToAccounting(order._id.toString());
        } catch (error) {
            console.error('Failed to sync accounting for POS return:', error);
        }

        return {
            order,
            returnRequest,
            refundCalculation,
            gatewayRefund: gatewayRefundResponse ? {
                refundId: gatewayRefundResponse.refundId,
                status: gatewayRefundResponse.status,
                gateway: order.paymentMethod,
            } : null,
        };
    }

    /**
     * Record refund in POS session
     */
    async recordSessionRefund(
        sessionId: mongoose.Types.ObjectId,
        amount: number
    ): Promise<void> {
        const session = await POSSession.findById(sessionId);
        if (!session) return;

        session.totalRefunds = (session.totalRefunds || 0) + amount;
        // Optionally update cash drawer if refund method is cash
        // But typically refunds are tracked separately from 'closingCash' reconciliation
        // However, if cash is given out, the drawer has less cash.
        // We should explicitly decide if we want to track 'cash given out' vs 'cash taken in'.
        // For simplicity, we just track 'totalRefunds' now.

        await session.save();
    }
}

export default new POSService();
