import { randomBytes } from 'crypto';
import { queryLogs } from '../db/postgres/logsClient';

/**
 * Data access for the logs schema.
 *
 * Two responsibilities:
 *   1. Bulk insert of queued log payloads (Mongo-shaped in, columnar out).
 *   2. Read queries that MUST return the same JSON shape the MongoDB/Mongoose
 *      implementation returned, so no frontend or consumer change is needed.
 *      In particular rows are re-emitted with `_id` and `createdAt` keys.
 *
 * Keeping this mapping in one place is what makes the Postgres switch invisible
 * to API consumers.
 */

export type LogType = 'activity' | 'audit' | 'api' | 'search' | 'security' | 'system';

export const LOG_TABLES: Record<LogType, string> = {
    activity: 'log_activity',
    audit: 'log_audit',
    api: 'log_api',
    search: 'log_search',
    security: 'log_security',
    system: 'log_system',
};

// -----------------------------------------------------------------------------
// Coercion helpers. Log ingestion must never throw on unexpected input, so every
// value is coerced defensively rather than trusted.
// -----------------------------------------------------------------------------

const toText = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && typeof (value as { toString?: unknown }).toString === 'function') {
        const asString = String(value);
        // Guard against plain objects stringifying to "[object Object]".
        return asString.startsWith('[object ') ? null : asString;
    }
    return null;
};

const requiredText = (value: unknown, fallback: string): string => toText(value) ?? fallback;

const toInt = (value: unknown, fallback = 0): number => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? Math.trunc(num) : fallback;
};

const toBool = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return fallback;
};

/**
 * JSONB values are stringified explicitly and cast in SQL. Relying on driver
 * type inference for jsonb is fragile, and `undefined` must become SQL NULL
 * rather than the string "undefined".
 */
const toJsonParam = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    try {
        return JSON.stringify(value);
    } catch {
        return null;
    }
};

const toTimestamp = (value: unknown): Date => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) return date;
    }
    return new Date();
};

/** 24-char hex, matching the ObjectId shape the API already exposes. */
export const newLogId = (): string => randomBytes(12).toString('hex');

/** Escapes LIKE/ILIKE wildcards so user input cannot widen a search. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

// -----------------------------------------------------------------------------
// Column definitions per log type
// -----------------------------------------------------------------------------

const ACTIVITY_COLUMNS = [
    'request_id', 'trace_id', 'correlation_id', 'session_id', 'store_id',
    'currency', 'language', 'timezone', 'channel', 'order_source',
    'actor_type', 'actor_id', 'actor_name', 'actor_email', 'actor_api_key_id', 'actor_api_key_name',
    'module', 'activity_type', 'action', 'status', 'details',
    'ip_address', 'user_agent', 'browser', 'operating_system', 'device_type',
    'country', 'region', 'city',
] as const;

const API_COLUMNS = [
    'request_id', 'trace_id', 'correlation_id', 'session_id', 'store_id',
    'currency', 'language', 'timezone', 'channel', 'user_type',
    'user_id', 'api_key_id', 'api_key_name', 'method', 'url', 'route', 'controller', 'action',
    'http_status', 'response_time_ms', 'payload_size_bytes',
    'ip_address', 'forwarded_ip', 'user_agent', 'browser', 'operating_system', 'device_type', 'platform',
    'country', 'region', 'city', 'referer', 'origin',
    'request_headers', 'response_headers', 'request_body', 'query_params', 'response_status',
] as const;

const AUDIT_COLUMNS = [
    'request_id', 'store_id', 'channel',
    'actor_type', 'actor_id', 'actor_name', 'actor_email',
    'module', 'entity', 'entity_id', 'action', 'changes', 'reason', 'ip_address',
] as const;

const SECURITY_COLUMNS = [
    'request_id', 'store_id', 'event_type', 'severity',
    'actor_type', 'actor_id', 'actor_email',
    'ip_address', 'user_agent', 'endpoint', 'details',
] as const;

const SEARCH_COLUMNS = [
    'store_id', 'session_id', 'customer_id', 'user_type', 'channel',
    'keyword', 'normalized_keyword', 'result_count', 'filters', 'sort',
    'currency', 'language', 'clicked_product_id', 'purchased_after_search',
    'order_id', 'is_no_result', 'ip_address',
] as const;

const SYSTEM_COLUMNS = [
    'source', 'level', 'message', 'stack', 'details',
] as const;

const LOG_COLUMNS: Record<LogType, readonly string[]> = {
    activity: ACTIVITY_COLUMNS,
    api: API_COLUMNS,
    audit: AUDIT_COLUMNS,
    search: SEARCH_COLUMNS,
    security: SECURITY_COLUMNS,
    system: SYSTEM_COLUMNS,
};

/** Column indexes that hold JSONB and need an explicit ::jsonb cast. */
const JSONB_COLUMNS: Record<LogType, readonly string[]> = {
    activity: ['details'],
    api: ['request_headers', 'response_headers', 'request_body', 'query_params'],
    audit: ['changes'],
    search: ['filters'],
    security: ['details'],
    system: ['details'],
};

// -----------------------------------------------------------------------------
// Payload -> row normalizers
// -----------------------------------------------------------------------------

const actorOf = (payload: Record<string, any>): Record<string, any> =>
    (payload.actor && typeof payload.actor === 'object' ? payload.actor : {}) as Record<string, any>;

const toActivityRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    const actor = actorOf(p);
    return [
        requiredText(p.requestId, `req_${id}`), requiredText(p.traceId, `trc_${id}`),
        toText(p.correlationId), toText(p.sessionId), toText(p.storeId),
        toText(p.currency), toText(p.language), toText(p.timezone),
        requiredText(p.channel, 'UNKNOWN'), toText(p.orderSource),
        requiredText(actor.type, 'system'), toText(actor.id), toText(actor.name), toText(actor.email),
        toText(actor.apiKeyId), toText(actor.apiKeyName),
        requiredText(p.module, 'System'), requiredText(p.activityType, 'UNKNOWN'),
        requiredText(p.action, 'UNKNOWN'), requiredText(p.status, 'success'),
        toJsonParam(p.details),
        toText(p.ipAddress), toText(p.userAgent), toText(p.browser),
        toText(p.operatingSystem), toText(p.deviceType),
        toText(p.country), toText(p.region), toText(p.city),
        id, createdAt,
    ];
};

const toApiRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    return [
        requiredText(p.requestId, `req_${id}`), requiredText(p.traceId, `trc_${id}`),
        toText(p.correlationId), toText(p.sessionId), toText(p.storeId),
        toText(p.currency), toText(p.language), toText(p.timezone),
        requiredText(p.channel, 'UNKNOWN'), requiredText(p.userType, 'guest'),
        toText(p.userId), toText(p.apiKeyId), toText(p.apiKeyName),
        requiredText(p.method, 'GET'), requiredText(p.url, '/'),
        toText(p.route), toText(p.controller), toText(p.action),
        toInt(p.httpStatus, 0), toInt(p.responseTimeMs, 0), toInt(p.payloadSizeBytes, 0),
        toText(p.ipAddress), toText(p.forwardedIp), toText(p.userAgent), toText(p.browser),
        toText(p.operatingSystem), toText(p.deviceType), toText(p.platform),
        toText(p.country), toText(p.region), toText(p.city),
        toText(p.referer), toText(p.origin),
        toJsonParam(p.requestHeaders), toJsonParam(p.responseHeaders),
        toJsonParam(p.requestBody), toJsonParam(p.queryParams),
        toText(p.responseStatus),
        id, createdAt,
    ];
};

const toAuditRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    const actor = actorOf(p);
    return [
        requiredText(p.requestId, `req_${id}`), toText(p.storeId), toText(p.channel),
        requiredText(actor.type, 'system'), toText(actor.id), toText(actor.name), toText(actor.email),
        requiredText(p.module, 'System'), requiredText(p.entity, 'Resource'),
        requiredText(p.entityId, 'unknown_id'), requiredText(p.action, 'UPDATE'),
        toJsonParam(p.changes), toText(p.reason), toText(p.ipAddress),
        id, createdAt,
    ];
};

const toSecurityRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    const actor = actorOf(p);
    return [
        toText(p.requestId), toText(p.storeId),
        requiredText(p.eventType, 'UNKNOWN'), requiredText(p.severity, 'low'),
        toText(actor.type), toText(actor.id), toText(actor.email),
        toText(p.ipAddress), toText(p.userAgent), toText(p.endpoint),
        toJsonParam(p.details),
        id, createdAt,
    ];
};

const toSearchRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    const keyword = requiredText(p.keyword, '');
    return [
        toText(p.storeId), toText(p.sessionId), toText(p.customerId),
        requiredText(p.userType, 'guest'), requiredText(p.channel, 'STOREFRONT'),
        keyword, requiredText(p.normalizedKeyword, keyword.toLowerCase()),
        toInt(p.resultCount, 0), toJsonParam(p.filters), toText(p.sort),
        toText(p.currency), toText(p.language), toText(p.clickedProductId),
        toBool(p.purchasedAfterSearch, false), toText(p.orderId),
        toBool(p.isNoResult, toInt(p.resultCount, 0) === 0), toText(p.ipAddress),
        id, createdAt,
    ];
};

const toSystemRow = (p: Record<string, any>, id: string, createdAt: Date): unknown[] => {
    return [
        requiredText(p.source, 'system'), requiredText(p.level, 'info'),
        requiredText(p.message, ''), toText(p.stack), toJsonParam(p.details),
        id, createdAt,
    ];
};

const ROW_BUILDERS: Record<LogType, (p: Record<string, any>, id: string, createdAt: Date) => unknown[]> = {
    activity: toActivityRow,
    api: toApiRow,
    audit: toAuditRow,
    search: toSearchRow,
    security: toSecurityRow,
    system: toSystemRow,
};

// -----------------------------------------------------------------------------
// Bulk insert
// -----------------------------------------------------------------------------

/**
 * PostgreSQL allows at most 65535 bind parameters per statement, so wide tables
 * (log_api has 40 columns) must be chunked. Keeping the whole batch in one
 * INSERT keeps round trips low while respecting that hard limit.
 */
const MAX_BIND_PARAMS = 60_000;

export const bulkInsertLogs = async (
    type: LogType,
    payloads: Record<string, any>[]
): Promise<number> => {
    if (payloads.length === 0) return 0;

    const table = LOG_TABLES[type];
    const columns = LOG_COLUMNS[type];
    const jsonb = new Set(JSONB_COLUMNS[type]);

    // Row builders return [...columnValues, id, createdAt], so the column list
    // must use the SAME order. Keeping these two in lockstep is what prevents a
    // silent column/value misalignment on insert.
    const columnList = [...columns, 'id', 'created_at'];
    const columnSql = columnList.map((col) => `"${col}"`).join(', ');
    const chunkSize = Math.max(1, Math.floor(MAX_BIND_PARAMS / columnList.length));

    let inserted = 0;

    for (let offset = 0; offset < payloads.length; offset += chunkSize) {
        const chunk = payloads.slice(offset, offset + chunkSize);
        const params: unknown[] = [];
        const valueGroups: string[] = [];

        for (const payload of chunk) {
            const id = toText(payload.id ?? payload._id) ?? newLogId();
            const createdAt = toTimestamp(payload.createdAt ?? payload.created_at);
            const row = ROW_BUILDERS[type](payload, id, createdAt);

            const placeholders = row.map((value, index) => {
                params.push(value);
                const paramIndex = params.length;
                // Index maps 1:1 onto columnList (both are [columns..., id, created_at]).
                const columnName = columnList[index];
                return jsonb.has(columnName) ? `$${paramIndex}::jsonb` : `$${paramIndex}`;
            });

            valueGroups.push(`(${placeholders.join(', ')})`);
        }

        const sql = `INSERT INTO logs.${table} (${columnSql}) VALUES ${valueGroups.join(', ')} ON CONFLICT DO NOTHING`;
        await queryLogs(sql, params);
        inserted += chunk.length;
    }

    return inserted;
};

// -----------------------------------------------------------------------------
// Read queries
// -----------------------------------------------------------------------------

export interface LogQueryFilters {
    startDate?: string;
    endDate?: string;
    storeId?: string;
    currency?: string;
    language?: string;
    module?: string;
    entity?: string;
    entityId?: string;
    activityType?: string;
    action?: string;
    status?: string;
    channel?: string;
    orderSource?: string;
    userType?: string;
    actorId?: string;
    ipAddress?: string;
    country?: string;
    searchKeyword?: string;
    orderId?: string;
    productId?: string;
    correlationId?: string;
    requestId?: string;
    sessionId?: string;
    method?: string;
    httpStatus?: number;
    severity?: string;
    eventType?: string;
}

interface WhereClause {
    sql: string;
    params: unknown[];
}

/**
 * Builds a parameterised WHERE clause. Every caller value goes through a bind
 * parameter; nothing read from a query string is interpolated into SQL.
 */
const buildWhere = (filters: LogQueryFilters, type: LogType): WhereClause => {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (fragment: (index: number) => string, value: unknown) => {
        params.push(value);
        clauses.push(fragment(params.length));
    };

    if (filters.startDate) add((i) => `created_at >= $${i}`, toTimestamp(filters.startDate));
    if (filters.endDate) add((i) => `created_at <= $${i}`, toTimestamp(filters.endDate));

    if (filters.storeId) add((i) => `store_id = $${i}`, filters.storeId);
    if (filters.correlationId) add((i) => `correlation_id = $${i}`, filters.correlationId);
    if (filters.requestId) add((i) => `request_id = $${i}`, filters.requestId);
    if (filters.country) add((i) => `country = $${i}`, filters.country);
    if (filters.ipAddress) add((i) => `ip_address = $${i}`, filters.ipAddress);

    if (filters.sessionId && (type === 'activity' || type === 'api' || type === 'search')) {
        add((i) => `session_id = $${i}`, filters.sessionId);
    }

    if (filters.channel) {
        // Historical data contains both STOREFRONT and WEB for the same logical
        // channel, and case varies; mirror the Mongo `$in` with regex behaviour.
        const normalised = filters.channel.toUpperCase();
        if (normalised === 'STOREFRONT' || normalised === 'WEB') {
            clauses.push(`upper(channel) IN ('STOREFRONT', 'WEB')`);
        } else {
            add((i) => `upper(channel) = upper($${i})`, filters.channel);
        }
    }

    if (type === 'activity') {
        if (filters.currency) add((i) => `currency = $${i}`, filters.currency);
        if (filters.language) add((i) => `language = $${i}`, filters.language);
        if (filters.module) add((i) => `module = $${i}`, filters.module);
        if (filters.activityType) add((i) => `activity_type = $${i}`, filters.activityType);
        if (filters.status) add((i) => `status = $${i}`, filters.status);
        if (filters.orderSource) add((i) => `order_source = $${i}`, filters.orderSource);
        if (filters.userType) add((i) => `actor_type = $${i}`, filters.userType);
        if (filters.actorId) add((i) => `actor_id = $${i}`, filters.actorId);
        if (filters.action) {
            add((i) => `action ILIKE $${i} ESCAPE '\\'`, `%${escapeLike(filters.action)}%`);
        }
        if (filters.orderId) {
            add((i) => `details @> jsonb_build_object('orderId', $${i}::text)`, filters.orderId);
        }
        if (filters.productId) {
            add((i) => `details @> jsonb_build_object('productId', $${i}::text)`, filters.productId);
        }
    }

    if (type === 'audit') {
        if (filters.module) add((i) => `module = $${i}`, filters.module);
        if (filters.entity) add((i) => `entity = $${i}`, filters.entity);
        if (filters.entityId) add((i) => `entity_id = $${i}`, filters.entityId);
        if (filters.userType) add((i) => `actor_type = $${i}`, filters.userType);
        if (filters.actorId) add((i) => `actor_id = $${i}`, filters.actorId);
        if (filters.action) add((i) => `action = $${i}`, filters.action);
    }

    if (type === 'api') {
        if (filters.userType) add((i) => `user_type = $${i}`, filters.userType);
        if (filters.actorId) add((i) => `user_id = $${i}`, filters.actorId);
        if (filters.method) add((i) => `method = $${i}`, filters.method.toUpperCase());
        if (filters.httpStatus !== undefined) add((i) => `http_status = $${i}`, filters.httpStatus);
    }

    if (type === 'security') {
        if (filters.severity) add((i) => `severity = $${i}`, filters.severity);
        if (filters.eventType) add((i) => `event_type = $${i}`, filters.eventType);
        if (filters.userType) add((i) => `actor_type = $${i}`, filters.userType);
        if (filters.actorId) add((i) => `actor_id = $${i}`, filters.actorId);
    }

    if (filters.searchKeyword) {
        const term = `%${escapeLike(filters.searchKeyword)}%`;
        const keywordColumns: Record<LogType, string[]> = {
            activity: ['action', 'actor_name', 'actor_email', 'activity_type'],
            audit: ['entity_id', 'actor_name', 'actor_email', 'reason'],
            api: ['url', 'route', 'user_id'],
            search: ['keyword', 'normalized_keyword'],
            security: ['endpoint', 'actor_email'],
            system: ['message', 'source'],
        };

        const fragments = keywordColumns[type].map((column) => {
            params.push(term);
            return `coalesce(${column}, '') ILIKE $${params.length} ESCAPE '\\'`;
        });
        clauses.push(`(${fragments.join(' OR ')})`);
    }

    return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
};

// -----------------------------------------------------------------------------
// Row -> API shaped mapping
// -----------------------------------------------------------------------------

type Row = Record<string, any>;

/** Drops null/undefined keys, matching the sparse shape `.lean()` produced. */
export const pruneShallow = (obj: Row): Row => {
    const out: Row = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) out[key] = value;
    }
    return out;
};

const mapActivity = (row: Row): Row => pruneShallow({
    _id: row.id,
    requestId: row.request_id,
    traceId: row.trace_id,
    correlationId: row.correlation_id,
    sessionId: row.session_id,
    storeId: row.store_id,
    currency: row.currency,
    language: row.language,
    timezone: row.timezone,
    channel: row.channel,
    orderSource: row.order_source,
    actor: pruneShallow({
        type: row.actor_type,
        id: row.actor_id,
        name: row.actor_name,
        email: row.actor_email,
        apiKeyId: row.actor_api_key_id,
        apiKeyName: row.actor_api_key_name,
    }),
    module: row.module,
    activityType: row.activity_type,
    action: row.action,
    status: row.status,
    details: row.details,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    browser: row.browser,
    operatingSystem: row.operating_system,
    deviceType: row.device_type,
    country: row.country,
    region: row.region,
    city: row.city,
    createdAt: row.created_at,
});

const mapApi = (row: Row): Row => pruneShallow({
    _id: row.id,
    requestId: row.request_id,
    traceId: row.trace_id,
    correlationId: row.correlation_id,
    sessionId: row.session_id,
    storeId: row.store_id,
    currency: row.currency,
    language: row.language,
    timezone: row.timezone,
    channel: row.channel,
    userType: row.user_type,
    userId: row.user_id,
    apiKeyId: row.api_key_id,
    apiKeyName: row.api_key_name,
    method: row.method,
    url: row.url,
    route: row.route,
    controller: row.controller,
    action: row.action,
    httpStatus: row.http_status,
    responseTimeMs: row.response_time_ms,
    payloadSizeBytes: row.payload_size_bytes,
    ipAddress: row.ip_address,
    forwardedIp: row.forwarded_ip,
    userAgent: row.user_agent,
    browser: row.browser,
    operatingSystem: row.operating_system,
    deviceType: row.device_type,
    platform: row.platform,
    country: row.country,
    region: row.region,
    city: row.city,
    referer: row.referer,
    origin: row.origin,
    requestHeaders: row.request_headers,
    responseHeaders: row.response_headers,
    requestBody: row.request_body,
    queryParams: row.query_params,
    responseStatus: row.response_status,
    createdAt: row.created_at,
});

const mapAudit = (row: Row): Row => pruneShallow({
    _id: row.id,
    requestId: row.request_id,
    storeId: row.store_id,
    channel: row.channel,
    actor: pruneShallow({
        type: row.actor_type,
        id: row.actor_id,
        name: row.actor_name,
        email: row.actor_email,
    }),
    module: row.module,
    entity: row.entity,
    entityId: row.entity_id,
    action: row.action,
    changes: row.changes,
    reason: row.reason,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
});

const mapSecurity = (row: Row): Row => pruneShallow({
    _id: row.id,
    requestId: row.request_id,
    storeId: row.store_id,
    eventType: row.event_type,
    severity: row.severity,
    actor: pruneShallow({
        type: row.actor_type,
        id: row.actor_id,
        email: row.actor_email,
    }),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    endpoint: row.endpoint,
    details: row.details,
    createdAt: row.created_at,
});

const mapSearch = (row: Row): Row => pruneShallow({
    _id: row.id,
    storeId: row.store_id,
    sessionId: row.session_id,
    customerId: row.customer_id,
    userType: row.user_type,
    channel: row.channel,
    keyword: row.keyword,
    normalizedKeyword: row.normalized_keyword,
    resultCount: row.result_count,
    filters: row.filters,
    sort: row.sort,
    currency: row.currency,
    language: row.language,
    clickedProductId: row.clicked_product_id,
    purchasedAfterSearch: row.purchased_after_search,
    orderId: row.order_id,
    isNoResult: row.is_no_result,
    ipAddress: row.ip_address,
    createdAt: row.created_at,
});

const mapSystem = (row: Row): Row => pruneShallow({
    _id: row.id,
    source: row.source,
    level: row.level,
    message: row.message,
    stack: row.stack,
    details: row.details,
    createdAt: row.created_at,
});

const ROW_MAPPERS: Record<LogType, (row: Row) => Row> = {
    activity: mapActivity,
    api: mapApi,
    audit: mapAudit,
    search: mapSearch,
    security: mapSecurity,
    system: mapSystem,
};

/**
 * Explicit projection per table.
 *
 * log_api deliberately keeps the JSONB payload columns: the MongoDB
 * implementation returned the full document from `getApiLogs`, and the admin UI
 * renders request details, so omitting them here would be a silent contract
 * regression.
 */
const SELECT_LISTS: Record<LogType, string> = {
    activity: 'id, created_at, request_id, trace_id, correlation_id, session_id, store_id, currency, '
        + 'language, timezone, channel, order_source, actor_type, actor_id, actor_name, actor_email, '
        + 'actor_api_key_id, actor_api_key_name, module, activity_type, action, status, details, '
        + 'ip_address, user_agent, browser, operating_system, device_type, country, region, city',
    api: 'id, created_at, request_id, trace_id, correlation_id, session_id, store_id, currency, '
        + 'language, timezone, channel, user_type, user_id, api_key_id, api_key_name, method, url, '
        + 'route, controller, action, http_status, response_time_ms, payload_size_bytes, ip_address, '
        + 'forwarded_ip, user_agent, browser, operating_system, device_type, platform, country, region, '
        + 'city, referer, origin, request_headers, response_headers, request_body, query_params, '
        + 'response_status',
    audit: 'id, created_at, request_id, store_id, channel, actor_type, actor_id, actor_name, '
        + 'actor_email, module, entity, entity_id, action, changes, reason, ip_address',
    search: 'id, created_at, store_id, session_id, customer_id, user_type, channel, keyword, '
        + 'normalized_keyword, result_count, filters, sort, currency, language, clicked_product_id, '
        + 'purchased_after_search, order_id, is_no_result, ip_address',
    security: 'id, created_at, request_id, store_id, event_type, severity, actor_type, actor_id, '
        + 'actor_email, ip_address, user_agent, endpoint, details',
    system: 'id, created_at, source, level, message, stack, details',
};

// -----------------------------------------------------------------------------
// Public query API
// -----------------------------------------------------------------------------

export interface PaginatedLogs {
    data: Row[];
    total: number;
}

export const countLogs = async (type: LogType, filters: LogQueryFilters = {}): Promise<number> => {
    const where = buildWhere(filters, type);
    const result = await queryLogs<{ total: string }>(
        `SELECT count(*)::bigint AS total FROM logs.${LOG_TABLES[type]} ${where.sql}`,
        where.params
    );
    return Number(result.rows[0]?.total ?? 0);
};

export const findLogs = async (
    type: LogType,
    filters: LogQueryFilters,
    page: number,
    limit: number
): Promise<PaginatedLogs> => {
    const where = buildWhere(filters, type);
    const offset = (page - 1) * limit;
    const params = [...where.params, limit, offset];

    const listSql =
        `SELECT ${SELECT_LISTS[type]} FROM logs.${LOG_TABLES[type]} ${where.sql} ` +
        `ORDER BY created_at DESC, id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const [rows, total] = await Promise.all([
        queryLogs<Row>(listSql, params),
        countLogs(type, filters),
    ]);

    return { data: rows.rows.map(ROW_MAPPERS[type]), total };
};

/**
 * Keyset-paginated iteration in descending time order.
 *
 * Replaces the previous `find(filter).lean()` in the archive exporter, which
 * materialised the entire date range in memory and would exhaust the heap well
 * before reaching millions of rows.
 */
export const iterateLogsDescending = async (
    type: LogType,
    filters: LogQueryFilters,
    batchSize: number,
    onBatch: (rows: Row[]) => Promise<void>
): Promise<number> => {
    let cursorCreatedAt: Date | null = null;
    let cursorId: string | null = null;
    let processed = 0;

    for (;;) {
        const where = buildWhere(filters, type);
        const params = [...where.params];
        let whereSql = where.sql;

        if (cursorCreatedAt && cursorId) {
            params.push(cursorCreatedAt, cursorId);
            const tupleClause = `(created_at, id) < ($${params.length - 1}, $${params.length})`;
            whereSql = where.sql ? `${where.sql} AND ${tupleClause}` : `WHERE ${tupleClause}`;
        }

        params.push(batchSize);

        const sql =
            `SELECT ${SELECT_LISTS[type]} FROM logs.${LOG_TABLES[type]} ${whereSql} ` +
            `ORDER BY created_at DESC, id DESC LIMIT $${params.length}`;

        const result = await queryLogs<Row>(sql, params);
        const rows = result.rows;
        if (rows.length === 0) break;

        await onBatch(rows.map(ROW_MAPPERS[type]));
        processed += rows.length;

        const last = rows[rows.length - 1];
        cursorCreatedAt = last.created_at as Date;
        cursorId = last.id as string;

        if (rows.length < batchSize) break;
    }

    return processed;
};

// -----------------------------------------------------------------------------
// Archive records (plain table, not partitioned)
// -----------------------------------------------------------------------------

export interface ArchiveRecord {
    archiveName: string;
    rangeType: string;
    startDate: Date;
    endDate: Date;
    format: string;
    collections: string[];
    recordCount: number;
    fileSizeBytes: number;
    checksumSha256: string;
    storagePath: string;
    purgedAfterArchive: boolean;
    createdBy: { id: string; name: string; email: string };
}

export const mapArchiveRow = (row: Row): Row => pruneShallow({
    _id: row.id,
    archiveName: row.archive_name,
    rangeType: row.range_type,
    startDate: row.start_date,
    endDate: row.end_date,
    format: row.format,
    collections: row.collections,
    recordCount: row.record_count === null || row.record_count === undefined ? 0 : Number(row.record_count),
    fileSizeBytes: row.file_size_bytes === null || row.file_size_bytes === undefined ? 0 : Number(row.file_size_bytes),
    checksumSha256: row.checksum_sha256,
    downloadCount: row.download_count,
    storagePath: row.storage_path,
    purgedAfterArchive: row.purged_after_archive,
    createdBy: {
        id: row.created_by_id,
        name: row.created_by_name,
        email: row.created_by_email,
    },
    createdAt: row.created_at,
});

export const insertArchiveRecord = async (record: ArchiveRecord): Promise<Row> => {
    const result = await queryLogs<Row>(
        `INSERT INTO logs.log_archive (
            id, archive_name, range_type, start_date, end_date, format, collections,
            record_count, file_size_bytes, checksum_sha256, download_count, storage_path,
            purged_after_archive, created_by_id, created_by_name, created_by_email
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,$11,$12,$13,$14,$15)
        RETURNING *`,
        [
            newLogId(), record.archiveName, record.rangeType, record.startDate, record.endDate,
            record.format, record.collections, record.recordCount, record.fileSizeBytes,
            record.checksumSha256, record.storagePath, record.purgedAfterArchive,
            record.createdBy.id, record.createdBy.name, record.createdBy.email,
        ]
    );
    return result.rows[0];
};

export const listArchiveRecords = async (): Promise<Row[]> => {
    const result = await queryLogs<Row>('SELECT * FROM logs.log_archive ORDER BY created_at DESC');
    return result.rows.map(mapArchiveRow);
};

export const getArchiveRecord = async (id: string): Promise<Row | null> => {
    const result = await queryLogs<Row>('SELECT * FROM logs.log_archive WHERE id = $1', [id]);
    return result.rows[0] ? mapArchiveRow(result.rows[0]) : null;
};

export const incrementArchiveDownloadCount = async (id: string): Promise<void> => {
    await queryLogs(
        'UPDATE logs.log_archive SET download_count = download_count + 1 WHERE id = $1',
        [id]
    );
};

/**
 * Deletes rows in a date range for the given log types.
 *
 * On partitioned tables this is deliberately slower than DROP PARTITION, which
 * is the recommended bulk-retention path. This exists for the ad-hoc
 * "purge a custom range" admin action, where the range rarely aligns to
 * partition boundaries.
 */
export const deleteLogsInRange = async (
    types: LogType[],
    start: Date,
    end: Date
): Promise<number> => {
    let deleted = 0;
    for (const type of types) {
        const result = await queryLogs(
            `DELETE FROM logs.${LOG_TABLES[type]} WHERE created_at >= $1 AND created_at <= $2`,
            [start, end]
        );
        deleted += result.rowCount ?? 0;
    }
    return deleted;
};
