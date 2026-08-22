import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getActivityLogs,
    getAuditLogs,
    getApiLogs,
    getSecurityLogs,
    getActivityAnalytics,
    createLogArchive,
    getArchiveHistory,
    downloadArchive,
    purgeLogRecords,
} from '../controllers/activityLog.controller';

const router = Router();

// Protect all log routes with authentication (Admin, Store Admin, Super Admin)
router.use(authenticate);
router.use(authorize('super_admin', 'admin', 'store_admin'));

/**
 * @route   GET /api/activity-logs
 * @desc    Get paginated & filtered activity logs
 */
router.get('/', getActivityLogs);

/**
 * @route   GET /api/activity-logs/audit
 * @desc    Get audit logs
 */
router.get('/audit', getAuditLogs);

/**
 * @route   GET /api/activity-logs/api
 * @desc    Get API request logs
 */
router.get('/api', getApiLogs);

/**
 * @route   GET /api/activity-logs/security
 * @desc    Get security logs
 */
router.get('/security', getSecurityLogs);

/**
 * @route   GET /api/activity-logs/analytics
 * @desc    Get activity intelligence analytics and dashboards
 */
router.get('/analytics', getActivityAnalytics);

/**
 * @route   POST /api/activity-logs/archive
 * @desc    Generate a log export archive
 */
router.post('/archive', createLogArchive);

/**
 * @route   GET /api/activity-logs/archive/history
 * @desc    Get list of generated log archives
 */
router.get('/archive/history', getArchiveHistory);

/**
 * @route   GET /api/activity-logs/archive/download/:id
 * @desc    Download generated archive file
 */
router.get('/archive/download/:id', downloadArchive);

/**
 * @route   POST /api/activity-logs/purge
 * @desc    Purge log records by date range (Super Admin Only)
 */
router.post('/purge', authorize('super_admin'), purgeLogRecords);

export default router;
