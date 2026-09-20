import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { isLogDbConfigured } from '../config/logDatabase';
import {
    countLogs,
    findLogs,
    type LogQueryFilters,
    type LogType,
} from '../repositories/logRepository';
import { getActivityAnalytics as fetchActivityAnalytics, resolveTimeZone } from '../repositories/logAnalytics.repository';
import logArchiveService from '../services/log-archive.service';
import { ensureRollupCoverage } from '../services/log-rollup-coverage.service';

/**
 * Log read API.
 *
 * Response envelopes, pagination semantics and query parameter names are
 * unchanged from the MongoDB implementation; only the storage engine differs.
 * Filtering is delegated to logRepository.buildWhere(), which binds every value
 * as a SQL parameter.
 */

const PAGE_LIMIT_DEFAULT = 25;

/**
 * Translates the admin UI's coarse `dateRange` selector into explicit bounds.
 *
 * The selector is a UI-only concept; the repository speaks `startDate`/`endDate`.
 * Previously the value was silently dropped, so the "Date Range" dropdown had no
 * effect on either the rows or the per-tab totals.
 */
const resolveDateRangeBounds = (rangeType?: string): { startDate?: string; endDate?: string } => {
    if (!rangeType) return {};

    const now = new Date();
    const start = new Date(now);

    switch (rangeType) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'yesterday': {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - 1);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(now);
            dayEnd.setDate(now.getDate() - 1);
            dayEnd.setHours(23, 59, 59, 999);
            return { startDate: dayStart.toISOString(), endDate: dayEnd.toISOString() };
        }
        case 'last_24_hours':
            start.setTime(now.getTime() - 24 * 3600 * 1000);
            break;
        case 'last_7_days':
            start.setDate(now.getDate() - 7);
            break;
        case 'last_30_days':
            start.setDate(now.getDate() - 30);
            break;
        case 'last_90_days':
            start.setDate(now.getDate() - 90);
            break;
        case 'last_6_months':
            start.setMonth(now.getMonth() - 6);
            break;
        case 'last_year':
            start.setFullYear(now.getFullYear() - 1);
            break;
        case 'all_time':
        case 'all':
            return {};
        default:
            return {};
    }

    return { startDate: start.toISOString(), endDate: now.toISOString() };
};

/** Parses a date-ish query value, returning undefined rather than Invalid Date. */
const parseDateParam = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * Resolves the dashboard's reporting window.
 *
 * Defaults to the original rolling 24 hours when no range is supplied, so
 * existing callers keep their contract; the admin UI passes its selected
 * `dateRange` so the KPI cards and charts agree with the table underneath them.
 */
const resolveAnalyticsWindow = (req: AuthRequest): { since: Date; until: Date } => {
    const q = req.query as Record<string, string | undefined>;
    const bounds = resolveDateRangeBounds(q.dateRange);
    const allTime = q.dateRange === 'all_time' || q.dateRange === 'all';

    const now = new Date();
    const explicitStart = parseDateParam(q.startDate) ?? parseDateParam(bounds.startDate);
    const explicitEnd = parseDateParam(q.endDate) ?? parseDateParam(bounds.endDate);

    const since = explicitStart
        ?? (allTime ? new Date(0) : new Date(now.getTime() - 24 * 3600 * 1000));

    return { since, until: explicitEnd ?? now };
};

/** Translates the existing query-string contract into repository filters. */
const buildLogFilters = (req: AuthRequest): LogQueryFilters => {
    const q = req.query as Record<string, string | undefined>;
    const range = resolveDateRangeBounds(q.dateRange);
    const rawHttpStatus = q.httpStatus ?? q.responseCode;

    const filters: LogQueryFilters = {
        // Explicit bounds win over the coarse selector when both are present.
        startDate: q.startDate || range.startDate,
        endDate: q.endDate || range.endDate,
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
        // The UI names these differently from the API contract; accept both.
        method: q.method || q.httpMethod,
        severity: q.severity || q.riskSeverity,
        eventType: q.eventType,
    };

    if (rawHttpStatus !== undefined && rawHttpStatus !== '') {
        const parsed = Number.parseInt(rawHttpStatus, 10);
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
 * Exact record counts per tab, using the SAME filters as the listings.
 *
 * The tab badges used to be fed by the analytics endpoint, which reports a
 * rolling 24-hour window from the rollup tables. Those numbers had no
 * relationship to the rows the tab actually displayed (the listing honours the
 * selected filters), so the badges were effectively always wrong. Growing them
 * from the same predicate as the rows keeps the badge and the table in step.
 */
export const getLogCounts = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!isLogDbConfigured()) {
        res.status(200).json({
            success: true,
            message: 'Activity logging is disabled (LOG_DATABASE_URL not configured)',
            data: { activity: 0, audit: 0, api: 0, security: 0 },
        });
        return;
    }

    const filters = buildLogFilters(req);

    const [activity, audit, api, security] = await Promise.all([
        countLogs('activity', filters),
        countLogs('audit', filters),
        countLogs('api', filters),
        countLogs('security', filters),
    ]);

    res.status(200).json({
        success: true,
        data: { activity, audit, api, security },
    });
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
        const { since, until } = resolveAnalyticsWindow(req);

        // The dashboard is served from the 15-minute rollups, which only hold
        // the buckets some refresh run has computed. Without this the window
        // could legitimately be empty even though raw logs exist for it.
        await ensureRollupCoverage(since, until);

        const analytics = await fetchActivityAnalytics({ since, until, timeZone });

        res.status(200).json({
            success: true,
            data: {
                metrics: analytics.metrics,
                dashboards: analytics.dashboards,
                window: { since, until, timeZone },
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
