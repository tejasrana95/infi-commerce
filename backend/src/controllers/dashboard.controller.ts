import { Response } from 'express';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Product from '../models/Product';
import Review from '../models/Review';
import ReturnRequest from '../models/ReturnRequest';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get administrative dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Aggregated data for orders, revenue, customers, and inventory.
 *       - Super Admin: Can view all stores or filter by storeId.
 *       - Store Admin: Restricted to their assigned store.
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Optional store ID to filter data (Super Admins only)
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalRevenue: { type: 'number' }
 *                         ordersCount: { type: 'number' }
 *                         customersCount: { type: 'number' }
 *                         productsCount: { type: 'number' }
 *                         lowStockCount: { type: 'number' }
 *                         pendingReviewsCount: { type: 'number' }
 *                     recentOrders:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Order' }
 *                     topProducts:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Product' }
 *                     salesData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: 'string', description: 'Date string' }
 *                           revenue: { type: 'number' }
 *                           orders: { type: 'number' }
 *                     statusDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: 'string', description: 'Status name' }
 *                           count: { type: 'number' }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Requires admin role
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.query.storeId as string;
        const userRole = req.user?.role;
        const isStoreAdmin = userRole === 'store_admin';
        const assignedStoreIds = req.user?.storeIds || [];

        // Determine which store(s) to filter by
        let filterStoreIds: string[] = [];

        if (isStoreAdmin) {
            // Store admin is always restricted to their assigned stores
            filterStoreIds = assignedStoreIds;
        } else if (storeId && storeId !== 'all') {
            // Super admin or admin filtering by a specific store
            filterStoreIds = [storeId];
        }

        const filter: any = {};
        if (filterStoreIds.length > 0) {
            filter.storeId = { $in: filterStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
        }

        // 1. Basic Stats (Counts)
        // For customerCount: if store-specific, count customers who have orders in this store
        // If all stores, count all unique customers in the system
        const getCustomerCount = async () => {
            if (filter.storeId) {
                const results = await Order.distinct('customerId', filter);
                return results.length;
            }
            return Customer.countDocuments({});
        };

        const [
            ordersCount,
            customersCount,
            productsCount,
            lowStockCount,
            pendingReviewsCount,
            returnRequestsCount
        ] = await Promise.all([
            Order.countDocuments(filter),
            getCustomerCount(),
            Product.countDocuments(filter),
            Product.countDocuments({
                ...filter,
                manageStock: true,
                $expr: { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 5] }] }
            }),
            Review.countDocuments({ ...filter, isApproved: false }),
            ReturnRequest.countDocuments(filter)
        ]);

        // 2. Revenue Calculation (Paid orders)
        const revenueResult = await Order.aggregate([
            { $match: { ...filter, paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // 3. Recent Orders
        const recentOrders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'firstName lastName email');

        // 4. Top Selling Products
        const topProducts = await Product.find(filter)
            .sort({ salesCount: -1 })
            .limit(5)
            .select('name sku salesCount price featuredImage salePrice images');

        // 5. Sales Data (Filtered by revenuePeriod)
        const revenuePeriod = (req.query.revenuePeriod as string) || '30_days';
        let periodStart: Date | null = new Date();
        let dateFormat = "%Y-%m-%d";

        if (revenuePeriod === '30_days') {
            periodStart.setDate(periodStart.getDate() - 30);
            dateFormat = "%Y-%m-%d";
        } else if (revenuePeriod === '3_months') {
            periodStart.setMonth(periodStart.getMonth() - 3);
            dateFormat = "%Y-%m-%d";
        } else if (revenuePeriod === '6_months') {
            periodStart.setMonth(periodStart.getMonth() - 6);
            dateFormat = "%Y-%m";
        } else if (revenuePeriod === 'ytd') {
            const now = new Date();
            periodStart = new Date(now.getFullYear(), 0, 1);
            dateFormat = "%Y-%m-%d";
        } else if (revenuePeriod === 'all_time') {
            periodStart = null;
            dateFormat = "%Y-%m";
        } else {
            periodStart.setDate(periodStart.getDate() - 30);
            dateFormat = "%Y-%m-%d";
        }

        const salesMatch: any = {
            ...filter,
            paymentStatus: 'paid'
        };
        if (periodStart) {
            salesMatch.createdAt = { $gte: periodStart };
        }

        const salesData = await Order.aggregate([
            {
                $match: salesMatch
            },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 6. Order Status Distribution
        const statusDistribution = await Order.aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 7. Return Request Status Distribution
        const returnStatusDistribution = await ReturnRequest.aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                stats: {
                    totalRevenue,
                    ordersCount,
                    customersCount,
                    productsCount,
                    lowStockCount,
                    pendingReviewsCount,
                    returnRequestsCount
                },
                recentOrders,
                topProducts,
                salesData,
                statusDistribution,
                returnStatusDistribution
            }
        });

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
