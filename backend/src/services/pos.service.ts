import POSSession, { IPOSSession } from '../models/POSSession';
import Order from '../models/Order';
import Product from '../models/Product';
import Store from '../models/Store';
import User from '../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

        session.status = 'closed';
        session.endedAt = new Date();
        session.closingCash = closingCash;
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
        limit: number = 20,
        skip: number = 0
    ): Promise<{ sessions: IPOSSession[]; total: number }> {
        const sessions = await POSSession.find({ storeId })
            .populate('userId', 'name email')
            .sort({ startedAt: -1 })
            .limit(limit)
            .skip(skip);



        const total = await POSSession.countDocuments({ storeId });

        return { sessions, total };
    }

    /**
     * Update session totals when order is created
     */
    async updateSessionTotals(
        sessionId: mongoose.Types.ObjectId,
        orderTotal: number,
        paymentMethod: 'cash' | 'card' | 'upi'
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
            session.paymentBreakdown[paymentMethod] += orderTotal;
        }

        await session.save();
    }


    /**
     * Check if user has specific POS permission
     */
    async checkUserPermission(
        userId: mongoose.Types.ObjectId,
        permission: 'canOverridePrice' | 'canApplyDiscount'
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
}

export default new POSService();
