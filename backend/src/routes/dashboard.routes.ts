import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import {
    getDashboardPreferences,
    updateDashboardPreferences,
    resetDashboardPreferences,
    getWidgetMetrics,
    getWidgetRevenueTrend,
    getWidgetStatusDistribution,
    getWidgetRecentOrders,
    getWidgetTopProducts,
    getWidgetLowStock,
    getWidgetLatestCustomers,
    getWidgetNotificationQueue,
    getWidgetSystemHealth
} from '../controllers/dashboard-widgets.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

const adminRoles = authorize('admin', 'store_admin', 'super_admin');
const superAdminOnly = authorize('super_admin');

// 1. Dashboard Legacy Stats
router.get('/stats', authenticate, adminRoles, getDashboardStats);

// 2. User Preferences Routes
router.get('/preferences', authenticate, getDashboardPreferences);
router.put('/preferences', authenticate, updateDashboardPreferences);
router.post('/preferences/reset', authenticate, resetDashboardPreferences);

// 3. Modular Widget Endpoints
router.get('/widgets/metrics', authenticate, adminRoles, getWidgetMetrics);
router.get('/widgets/revenue-trend', authenticate, adminRoles, getWidgetRevenueTrend);
router.get('/widgets/status-distribution', authenticate, adminRoles, getWidgetStatusDistribution);
router.get('/widgets/recent-orders', authenticate, adminRoles, getWidgetRecentOrders);
router.get('/widgets/top-products', authenticate, adminRoles, getWidgetTopProducts);
router.get('/widgets/low-stock', authenticate, adminRoles, getWidgetLowStock);
router.get('/widgets/latest-customers', authenticate, adminRoles, getWidgetLatestCustomers);
router.get('/widgets/notification-queue', authenticate, superAdminOnly, getWidgetNotificationQueue);
router.get('/widgets/system-health', authenticate, superAdminOnly, getWidgetSystemHealth);

export default router;
