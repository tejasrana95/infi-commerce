import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { isLogDbConfigured } from '../config/logDatabase';
import getActivityLogModel from '../models/logs/ActivityLog';
import getAuditLogModel from '../models/logs/AuditLog';
import getApiLogModel from '../models/logs/ApiLog';
import getSearchLogModel from '../models/logs/SearchLog';
import getSecurityLogModel from '../models/logs/SecurityLog';
import logArchiveService from '../services/log-archive.service';

/**
 * Build dynamic Mongoose filter from query parameters
 */
const buildLogFilter = (req: AuthRequest) => {
    const filter: any = {};
    const {
        startDate,
        endDate,
        storeId,
        currency,
        language,
        module,
        entity,
        entityId,
        activityType,
        action,
        status,
        channel,
        orderSource,
        userType,
        actorId,
        ipAddress,
        country,
        searchKeyword,
        orderId,
        productId,
        correlationId,
        requestId,
        sessionId,
    } = req.query;

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate as string);
        if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (storeId) filter.storeId = storeId;
    if (currency) filter.currency = currency;
    if (language) filter.language = language;
    if (module) filter.module = module;
    if (entity) filter.entity = entity;
    if (entityId) filter.entityId = entityId;
    if (activityType) filter.activityType = activityType;
    if (action) filter.action = { $regex: action as string, $options: 'i' };
    if (status) filter.status = status;
    if (channel) {
        const ch = (channel as string).toUpperCase();
        if (ch === 'STOREFRONT' || ch === 'WEB') {
            filter.channel = { $in: [/^STOREFRONT$/i, /^WEB$/i] };
        } else {
            filter.channel = { $regex: `^${ch}$`, $options: 'i' };
        }
    }
    if (orderSource) filter.orderSource = orderSource;
    if (userType) filter['actor.type'] = userType;
    if (actorId) filter['actor.id'] = actorId;
    if (ipAddress) filter.ipAddress = ipAddress;
    if (country) filter.country = country;
    if (correlationId) filter.correlationId = correlationId;
    if (requestId) filter.requestId = requestId;
    if (sessionId) filter.sessionId = sessionId;

    if (orderId) filter['details.orderId'] = orderId;
    if (productId) filter['details.productId'] = productId;

    if (searchKeyword) {
        filter.$or = [
            { action: { $regex: searchKeyword, $options: 'i' } },
            { 'actor.name': { $regex: searchKeyword, $options: 'i' } },
            { 'actor.email': { $regex: searchKeyword, $options: 'i' } },
            { activityType: { $regex: searchKeyword, $options: 'i' } },
        ];
    }

    return filter;
};

/**
 * Get Activity Logs (Paginated & Filtered)
 */
export const getActivityLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        res.status(200).json({
            success: true,
            message: 'Activity logging is disabled (LOG_MONGODB_URI not configured)',
            data: [],
            pagination: { page: 1, limit: 25, total: 0, pages: 0 },
        });
        return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const filter = buildLogFilter(req);
    const ActivityLog = getActivityLogModel();

    const [logs, total] = await Promise.all([
        ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ActivityLog.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * Get Audit Logs
 */
export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        res.status(200).json({
            success: true,
            message: 'Audit logging is disabled (LOG_MONGODB_URI not configured)',
            data: [],
            pagination: { page: 1, limit: 25, total: 0, pages: 0 },
        });
        return;
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const filter = buildLogFilter(req);
    const AuditLog = getAuditLogModel();

    const [logs, total] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

/**
 * Get API Logs
 */
export const getApiLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const filter = buildLogFilter(req);

    if (req.query.httpStatus) {
        filter.httpStatus = parseInt(req.query.httpStatus as string, 10);
    }
    if (req.query.method) {
        filter.method = (req.query.method as string).toUpperCase();
    }

    const ApiLog = getApiLogModel();

    const [logs, total] = await Promise.all([
        ApiLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ApiLog.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

/**
 * Get Security Logs
 */
export const getSecurityLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 25;
    const skip = (page - 1) * limit;

    const filter = buildLogFilter(req);
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.eventType) filter.eventType = req.query.eventType;

    const SecurityLog = getSecurityLogModel();

    const [logs, total] = await Promise.all([
        SecurityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SecurityLog.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

/**
 * Get Activity Intelligence Analytics Dashboards
 */
export const getActivityAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const ActivityLog = getActivityLogModel();
    const ApiLog = getApiLogModel();
    const SearchLog = getSearchLogModel();
    const SecurityLog = getSecurityLogModel();

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 3600 * 1000);

    const AuditLog = getAuditLogModel();

    const userTimezone = (req.query.timezone as string) || (req.headers['x-timezone'] as string) || 'UTC';

    const [
        totalActivities,
        authEvents,
        ordersCount,
        paymentsCount,
        failedActions,
        securityAlertsCount,
        auditCount,
        topApis,
        slowApis,
        searchesNoResult,
        topKeywords,
        activeCustomers,
        activeAdmins,
        activityTrends,
        auditTrends,
        apiLatencyTrends,
        securityTrends,
    ] = await Promise.all([
        ActivityLog.countDocuments({ createdAt: { $gte: last24h } }),
        ActivityLog.countDocuments({ module: { $in: ['Auth', 'Authentication'] }, createdAt: { $gte: last24h } }),
        ActivityLog.countDocuments({ module: 'Orders', createdAt: { $gte: last24h } }),
        ActivityLog.countDocuments({ $or: [{ module: 'Payment' }, { activityType: { $regex: 'PAYMENT', $options: 'i' } }], createdAt: { $gte: last24h } }),
        ActivityLog.countDocuments({ status: 'failed', createdAt: { $gte: last24h } }),
        SecurityLog.countDocuments({ createdAt: { $gte: last24h } }),
        AuditLog.countDocuments({ createdAt: { $gte: last24h } }),
        
        // Top APIs by Volume
        ApiLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            { $group: { _id: { route: '$route', method: '$method' }, count: { $sum: 1 }, avgDuration: { $avg: '$responseTimeMs' } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),

        // Slowest APIs
        ApiLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            { $group: { _id: '$route', avgDuration: { $avg: '$responseTimeMs' }, maxDuration: { $max: '$responseTimeMs' } } },
            { $sort: { avgDuration: -1 } },
            { $limit: 5 },
        ]),

        // Zero Result Searches
        SearchLog.aggregate([
            { $match: { isNoResult: true, createdAt: { $gte: last24h } } },
            { $group: { _id: '$normalizedKeyword', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),

        // Most Searched Keywords
        SearchLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            { $group: { _id: '$normalizedKeyword', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),

        // Most Active Customers
        ActivityLog.aggregate([
            { $match: { 'actor.type': 'customer', createdAt: { $gte: last24h } } },
            { $group: { _id: { id: '$actor.id', email: '$actor.email', name: '$actor.name' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),

        // Most Active Admins
        ActivityLog.aggregate([
            { $match: { 'actor.type': { $in: ['admin', 'super_admin', 'store_admin'] }, createdAt: { $gte: last24h } } },
            { $group: { _id: { id: '$actor.id', email: '$actor.email', name: '$actor.name' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),

        // Activity Hourly Trend
        ActivityLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%H:00', date: '$createdAt', timezone: userTimezone } },
                    total: { $sum: 1 },
                    success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]),

        // Audit Hourly Trend
        AuditLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%H:00', date: '$createdAt', timezone: userTimezone } },
                    total: { $sum: 1 },
                    create: { $sum: { $cond: [{ $eq: ['$action', 'CREATE'] }, 1, 0] } },
                    update: { $sum: { $cond: [{ $eq: ['$action', 'UPDATE'] }, 1, 0] } },
                    delete: { $sum: { $cond: [{ $eq: ['$action', 'DELETE'] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]),

        // API Latency & Call Trends
        ApiLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%H:00', date: '$createdAt', timezone: userTimezone } },
                    avgLatency: { $avg: '$responseTimeMs' },
                    totalCalls: { $sum: 1 },
                    errorCalls: { $sum: { $cond: [{ $gte: ['$httpStatus', 400] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]),

        // Security Hourly Trend
        SecurityLog.aggregate([
            { $match: { createdAt: { $gte: last24h } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%H:00', date: '$createdAt', timezone: userTimezone } },
                    critical: { $sum: { $cond: [{ $in: ['$severity', ['critical', 'high']] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] } },
                    low: { $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] } },
                    total: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    res.status(200).json({
        success: true,
        data: {
            metrics: {
                totalActivities,
                authEvents,
                ordersCount,
                paymentsCount,
                failedActions,
                securityAlertsCount,
                auditCount,
            },
            dashboards: {
                topApis,
                slowApis,
                searchesNoResult,
                topKeywords,
                activeCustomers,
                activeAdmins,
                trends: {
                    activityTrends,
                    auditTrends,
                    apiLatencyTrends,
                    securityTrends,
                },
            },
        },
    });
});

/**
 * Generate Log Archive
 */
export const createLogArchive = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { rangeType, startDate, endDate, format, collections, purgeAfterArchive } = req.body;

    if (!req.user) {
        throw new AppError('Unauthorized', 401);
    }

    const archive = await logArchiveService.generateArchive({
        rangeType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        format: format || 'csv',
        collections,
        purgeAfterArchive: !!purgeAfterArchive,
        createdBy: {
            id: req.user.id,
            name: req.user.email,
            email: req.user.email,
        },
    });

    res.status(201).json({
        success: true,
        message: 'Log archive generated successfully',
        data: archive,
    });
});

/**
 * Get Archive History
 */
export const getArchiveHistory = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const history = await logArchiveService.getArchiveHistory();
    res.status(200).json({
        success: true,
        data: history,
    });
});

/**
 * Download Archive File
 */
export const downloadArchive = asyncHandler(async (req: AuthRequest, res: Response) => {
    const archiveId = req.params.id;
    const result = await logArchiveService.getArchiveFilePath(archiveId);

    if (!result) {
        throw new AppError('Archive file not found', 404);
    }

    res.download(result.filePath, result.fileName);
});

/**
 * Purge Log Records
 */
export const purgeLogRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { rangeType, startDate, endDate, collections } = req.body;

    const result = await logArchiveService.purgeLogs(
        rangeType,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
        collections
    );

    res.status(200).json({
        success: true,
        message: `Successfully purged ${result.deletedRecords} log records`,
        data: result,
    });
});
