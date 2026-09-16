import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { isLogDbConfigured } from '../config/logDatabase';
import {
    findLogs,
    type LogQueryFilters,
    type LogType,
} from '../repositories/logRepository';
import { getActivityAnalytics as fetchActivityAnalytics, resolveTimeZone } from '../repositories/logAnalytics.repository';
import logArchiveService from '../services/log-archive.service';

/**
 * Log read API.
 *
 * Response envelopes, pagination semantics and query parameter names are
 * unchanged from the MongoDB implementation; only the storage engine differs.
 * Filtering is delegated to logRepository.buildWhere(), which binds every value
 * as a SQL parameter.
 */

const PAGE_LIMIT_DEFAULT = 25;

/** Translates the existing query-string contract into repository filters. */
const buildLogFilters = (req: AuthRequest): LogQueryFilters => {
    const q = req.query as Record<string, string | undefined>;

    const filters: LogQueryFilters = {
        startDate: q.startDate,
        endDate: q.endDate,
        storeId: q.storeId,
        currency: q.currency,
        language: q.language,
        module: q.module,
        entity: q.entity,
        entityId: q.entityId,
        activityType: q.activityType,
        action: q.action,
        status: q.status,
        channel: q.channel,
        orderSource: q.orderSource,
        userType: q.userType,
        actorId: q.actorId,
        ipAddress: q.ipAddress,
        country: q.country,
        searchKeyword: q.searchKeyword,
        orderId: q.orderId,
        productId: q.productId,
        correlationId: q.correlationId,
        requestId: q.requestId,
        sessionId: q.sessionId,
        method: q.method,
        severity: q.severity,
        eventType: q.eventType,
    };

    if (q.httpStatus !== undefined && q.httpStatus !== '') {
        const parsed = Number.parseInt(q.httpStatus, 10);
        if (Number.isFinite(parsed)) filters.httpStatus = parsed;
    }

    return filters;
};

const parsePagination = (req: AuthRequest): { page: number; limit: number } => {
    const page = Math.max(1, Number.parseInt(req.query.page as string, 10) || 1);
    const rawLimit = Number.parseInt(req.query.limit as string, 10) || PAGE_LIMIT_DEFAULT;
    // Clamp so a caller cannot request an unbounded page.
    const limit = Math.min(Math.max(1, rawLimit), 200);
    return { page, limit };
};

/** Shared handler body for the four paginated log listings. */
const listLogs = async (req: AuthRequest, res: Response, type: LogType, extraFilters?: LogQueryFilters) => {
    if (!isLogDbConfigured()) {
        res.status(200).json({
            success: true,
            message: 'Activity logging is disabled (LOG_DATABASE_URL not configured)',
            data: [],
            pagination: { page: 1, limit: PAGE_LIMIT_DEFAULT, total: 0, pages: 0 },
        });
        return;
    }

    const { page, limit } = parsePagination(req);
    const filters: LogQueryFilters = { ...buildLogFilters(req), ...extraFilters };

    const { data, total } = await findLogs(type, filters, page, limit);

    res.status(200).json({
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
};

export const getActivityLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    await listLogs(req, res, 'activity');
});

export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    await listLogs(req, res, 'audit');
});

export const getApiLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    await listLogs(req, res, 'api');
});

export const getSecurityLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    await listLogs(req, res, 'security');
});

/**
 * Activity Intelligence dashboards.
 *
 * Served from 15-minute rollup tables, so this is an index scan over a small
 * table rather than the 17 aggregations against raw logs it used to run.
 */
export const getActivityAnalytics = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        if (!isLogDbConfigured()) {
            res.status(200).json({
                success: true,
                message: 'Activity logging is disabled (LOG_DATABASE_URL not configured)',
                data: null,
            });
            return;
        }

        const timeZone = resolveTimeZone(
            (req.query.timezone as string) || (req.headers['x-timezone'] as string) || undefined
        );
        const since = new Date(Date.now() - 24 * 3600 * 1000);

        const analytics = await fetchActivityAnalytics({ since, timeZone });

        res.status(200).json({
            success: true,
            data: {
                metrics: analytics.metrics,
                dashboards: analytics.dashboards,
            },
        });
    }
);

export const createLogArchive = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        throw new AppError('Activity logging is disabled (LOG_DATABASE_URL not configured)', 503);
    }

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

export const getArchiveHistory = asyncHandler(async (_req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        res.status(200).json({ success: true, data: [] });
        return;
    }

    const history = await logArchiveService.getArchiveHistory();
    res.status(200).json({
        success: true,
        data: history,
    });
});

export const downloadArchive = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await logArchiveService.getArchiveFilePath(req.params.id);

    if (!result) {
        throw new AppError('Archive file not found', 404);
    }

    res.download(result.filePath, result.fileName);
});

export const purgeLogRecords = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        throw new AppError('Activity logging is disabled (LOG_DATABASE_URL not configured)', 503);
    }

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
