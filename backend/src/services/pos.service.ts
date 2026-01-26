import POSSession, { IPOSSession } from '../models/POSSession';
import Order from '../models/Order';
import User from '../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import ReturnCalculationService from './return-calculation.service';

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
        refundMethod: string,
        reason: string,
        notes?: string
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
        const tolerance = 0.01; // $0.01 tolerance for rounding differences
        if (Math.abs(refundCalculation.refundAmount - refundAmount) > tolerance) {
            throw new Error(
                `Refund amount mismatch. Calculated: ${refundCalculation.refundAmount.toFixed(2)}, Provided: ${refundAmount.toFixed(2)}`
            );
        }

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

        // Add return record to order
        if (!order.returns) order.returns = [];
        order.returns.push({
            returnedAt: new Date(),
            items: refundCalculation.itemRefunds.map(item => ({
                productId: new mongoose.Types.ObjectId(item.productId),
                variantId: item.variantId,
                quantity: item.quantity,
                reason: items.find(i => i.productId === item.productId)?.reason || reason,
                refundAmount: item.totalRefund,
            })),
            totalRefundAmount: refundCalculation.refundAmount,
            refundMethod,
            processedBy: userId,
            note: notes,
            refundReference: `REF-${Date.now()}`,
        });

        // Update Order Status if fully returned
        const allItemsReturned = order.items.every((i: any) => (i.returnedQuantity || 0) === i.quantity);
        if (allItemsReturned) {
            order.status = 'returned';
            order.paymentStatus = 'refunded';
            order.refundStatus = 'processed';
            order.refundedAt = new Date();
        } else {
            order.status = 'partially_returned';
            order.refundStatus = 'processed';
        }

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

        return {
            order,
            refundCalculation,
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
