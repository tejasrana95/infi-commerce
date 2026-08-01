import { Response } from 'express';
import os from 'os';
import mongoose from 'mongoose';
import User from '../models/User';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Product from '../models/Product';
import Review from '../models/Review';
import NotificationQueue from '../models/NotificationQueue';
import { AuthRequest } from '../middleware/auth';
import cacheService from '../services/cache.service';
import { config } from '../config';

// ----------------------------------------------------
// System Health In-Memory Cache (5 second cache)
// ----------------------------------------------------
let cachedSystemHealth: {
    timestamp: number;
    data: any;
} | null = null;

const CACHE_TTL_MS = 5000;

function getCpuUsage(): number {
    try {
        const cpus = os.cpus();
        if (!cpus || cpus.length === 0) return 0;
        
        let user = 0;
        let nice = 0;
        let sys = 0;
        let idle = 0;
        let irq = 0;

        for (const cpu of cpus) {
            if (!cpu || !cpu.times) continue;
            user += cpu.times.user || 0;
            nice += cpu.times.nice || 0;
            sys += cpu.times.sys || 0;
            idle += cpu.times.idle || 0;
            irq += cpu.times.irq || 0;
        }

        const total = user + nice + sys + idle + irq;
        if (total === 0) return 0;
        const busy = total - idle;
        return Math.min(100, Math.max(0, Math.round((busy / total) * 100)));
    } catch {
        return 0;
    }
}

// ----------------------------------------------------
// 1. Dashboard User Preferences Controllers
// ----------------------------------------------------
export const getDashboardPreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const user = await User.findById(userId).select('dashboardPreferences');
        return res.status(200).json({
            success: true,
            preferences: user?.dashboardPreferences || null,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDashboardPreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { widgetOrder, enabledWidgets } = req.body;

        if (!Array.isArray(widgetOrder) || !Array.isArray(enabledWidgets)) {
            return res.status(400).json({ success: false, message: 'Invalid widget preferences format' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    dashboardPreferences: {
                        widgetOrder,
                        enabledWidgets,
                    },
                },
            },
            { new: true }
        ).select('dashboardPreferences');

        return res.status(200).json({
            success: true,
            message: 'Dashboard preferences updated successfully',
            preferences: user?.dashboardPreferences,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const resetDashboardPreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        await User.findByIdAndUpdate(userId, {
            $unset: { dashboardPreferences: 1 },
        });

        return res.status(200).json({
            success: true,
            message: 'Dashboard preferences reset to default',
            preferences: null,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Helper: Get Store Filter
function getStoreFilter(req: AuthRequest): any {
    const storeId = req.query.storeId as string;
    const userRole = req.user?.role;
    const isStoreAdmin = userRole === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    let filterStoreIds: string[] = [];
    if (isStoreAdmin) {
        filterStoreIds = assignedStoreIds.map(id => id.toString());
    } else if (storeId && storeId !== 'all') {
        filterStoreIds = [storeId];
    }

    const filter: any = {};
    if (filterStoreIds.length > 0) {
        filter.storeId = { $in: filterStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    return filter;
}

// ----------------------------------------------------
// 2. Modular Widget Endpoints
// ----------------------------------------------------

// 2.1 Metrics Summary Widget API
export const getWidgetMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);

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
            pendingReviewsCount
        ] = await Promise.all([
            Order.countDocuments(filter),
            getCustomerCount(),
            Product.countDocuments(filter),
            Product.countDocuments({
                ...filter,
                stock: { $exists: true, $ne: null },
                $or: [
                    { stock: { $lte: 5 } },
                    {
                        $and: [
                            { lowStockThreshold: { $exists: true, $gt: 0 } },
                            { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
                        ]
                    }
                ]
            }),
            Review.countDocuments({ ...filter, isApproved: false })
        ]);

        const revenueResult = await Order.aggregate([
            { $match: { ...filter, paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                ordersCount,
                customersCount,
                productsCount,
                lowStockCount,
                pendingReviewsCount
            }
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.2 Revenue Trend Widget API
export const getWidgetRevenueTrend = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);
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
            { $match: salesMatch },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                    revenue: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: salesData
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.3 Status Distribution Widget API
export const getWidgetStatusDistribution = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);
        const period = (req.query.period as string) || 'all_time';
        let dateMatch: any = null;

        if (period === 'today') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            dateMatch = { $gte: startOfToday };
        } else if (period === 'yesterday') {
            const startOfYesterday = new Date();
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            startOfYesterday.setHours(0, 0, 0, 0);

            const endOfYesterday = new Date();
            endOfYesterday.setHours(0, 0, 0, 0);

            dateMatch = { $gte: startOfYesterday, $lt: endOfYesterday };
        } else if (period === '7_days') {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            dateMatch = { $gte: d };
        } else if (period === '30_days') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            dateMatch = { $gte: d };
        } else if (period === '3_months') {
            const d = new Date();
            d.setMonth(d.getMonth() - 3);
            dateMatch = { $gte: d };
        } else if (period === 'ytd') {
            const startOfYear = new Date(new Date().getFullYear(), 0, 1);
            dateMatch = { $gte: startOfYear };
        }

        const matchFilter: any = { ...filter };
        if (dateMatch) {
            matchFilter.createdAt = dateMatch;
        }

        const statusDistribution = await Order.aggregate([
            { $match: matchFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        return res.status(200).json({
            success: true,
            data: statusDistribution
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.4 Recent Orders Widget API
export const getWidgetRecentOrders = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);
        const recentOrders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('customerId', 'firstName lastName email');

        return res.status(200).json({
            success: true,
            data: recentOrders
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.5 Top Products Widget API
export const getWidgetTopProducts = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);
        const topProducts = await Product.find(filter)
            .sort({ salesCount: -1 })
            .limit(5)
            .select('name sku salesCount price featuredImage salePrice images');

        return res.status(200).json({
            success: true,
            data: topProducts
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.6 Low Stock Widget API
export const getWidgetLowStock = async (req: AuthRequest, res: Response) => {
    try {
        const filter = getStoreFilter(req);
        const lowStockProducts = await Product.find({
            ...filter,
            stock: { $exists: true, $ne: null },
            $or: [
                { stock: { $lte: 5 } },
                {
                    $and: [
                        { lowStockThreshold: { $exists: true, $gt: 0 } },
                        { $expr: { $lte: ['$stock', '$lowStockThreshold'] } }
                    ]
                }
            ]
        })
            .sort({ stock: 1 })
            .limit(20)
            .select('name sku stock lowStockThreshold manageStock price featuredImage images');

        return res.status(200).json({
            success: true,
            data: lowStockProducts
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.7 Latest Customers Widget API (Newest 20)
export const getWidgetLatestCustomers = async (_req: AuthRequest, res: Response) => {
    try {
        const latestCustomers = await Customer.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .select('firstName lastName email phone ordersCount totalSpent createdAt status avatar');

        return res.status(200).json({
            success: true,
            data: latestCustomers
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.8 Notification Queue Status Widget API (Super Admin Only)
export const getWidgetNotificationQueue = async (req: AuthRequest, res: Response) => {
    try {
        const timeframe = (req.query.timeframe as string) || 'today';
        let startDate = new Date();

        if (timeframe === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (timeframe === '7_days') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (timeframe === '30_days') {
            startDate.setDate(startDate.getDate() - 30);
        } else {
            startDate.setHours(0, 0, 0, 0);
        }

        const statsResult = await NotificationQueue.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const counts: Record<string, number> = {
            sent: 0,
            pending: 0,
            processing: 0,
            failed: 0,
            cancelled: 0,
            total: 0
        };

        statsResult.forEach(item => {
            if (counts[item._id] !== undefined) {
                counts[item._id] = item.count;
            }
            counts.total += item.count;
        });

        return res.status(200).json({
            success: true,
            data: counts
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2.9 System Health Widget API (Super Admin Only, Optimized 5s Cache)
export const getWidgetSystemHealth = async (req: AuthRequest, res: Response) => {
    try {
        const force = req.query.force === 'true';
        const now = Date.now();
        if (!force && cachedSystemHealth && now - cachedSystemHealth.timestamp < CACHE_TTL_MS) {
            return res.status(200).json({
                success: true,
                data: cachedSystemHealth.data,
                cached: true
            });
        }

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const processMem = process.memoryUsage();
        const cpuUsagePercent = getCpuUsage();

        const rawPlatform = os.platform();
        let osPlatformName = 'Linux / Server';
        if (rawPlatform === 'darwin') osPlatformName = 'macOS';
        else if (rawPlatform === 'win32') osPlatformName = 'Windows';
        else if (rawPlatform === 'linux') osPlatformName = 'Ubuntu / Linux';

        let cacheStats: any = {};
        try {
            cacheStats = cacheService.getStats();
        } catch {
            cacheStats = { backend: 'memory', memcached: { enabled: false, connected: false }, redis: { enabled: false, connected: false }, memory: { size: 0 } };
        }

        const data = {
            status: 'ok',
            environment: config.env || 'development',
            cpuUsagePercent,
            systemMemoryUsagePercent: Math.round((usedMem / totalMem) * 100),
            heapUsagePercent: Math.round((processMem.heapUsed / processMem.heapTotal) * 100),
            totalMemoryGB: parseFloat((totalMem / (1024 * 1024 * 1024)).toFixed(2)),
            freeMemoryGB: parseFloat((freeMem / (1024 * 1024 * 1024)).toFixed(2)),
            usedMemoryGB: parseFloat((usedMem / (1024 * 1024 * 1024)).toFixed(2)),
            processRssMB: Math.round(processMem.rss / (1024 * 1024)),
            processHeapUsedMB: Math.round(processMem.heapUsed / (1024 * 1024)),
            processHeapTotalMB: Math.round(processMem.heapTotal / (1024 * 1024)),
            systemUptimeSeconds: Math.round(os.uptime()),
            processUptimeSeconds: Math.round(process.uptime()),
            loadAverage: (os.loadavg() || []).map(num => parseFloat(num.toFixed(2))),
            nodeVersion: process.version,
            mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            cache: {
                backend: cacheStats.backend || 'memory',
                memcached: cacheStats.memcached || { enabled: false, connected: false },
                redis: cacheStats.redis || { enabled: false, connected: false },
                memoryFallbackSize: cacheStats.memory?.size || 0,
            },
            platform: osPlatformName,
            rawPlatform,
            architecture: os.arch(),
            cpuCount: os.cpus().length,
            timestamp: new Date().toISOString()
        };

        cachedSystemHealth = {
            timestamp: now,
            data
        };

        return res.status(200).json({
            success: true,
            data,
            cached: false
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
