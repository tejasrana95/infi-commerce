/**
 * End-to-end smoke test for the Postgres logging subsystem.
 *
 *   npm run logs:smoke-test
 *   npm run logs:smoke-test -- --force   # run even if the DB already has data
 *
 * Requires LOG_DATABASE_URL. SAFETY: this script writes rows, so it refuses to
 * run against a database that already contains log data. Point it at a
 * dedicated test database, never at production.
 *
 * It covers the paths most likely to break silently: column/value alignment on
 * bulk insert, response-shape compatibility with the previous Mongo API,
 * filter translation, SQL-injection safety, keyset pagination, rollup
 * aggregation, timezone bucketing for half-hour offsets, default-partition
 * routing and relocation, and partition-based retention.
 */
import { closeLogsPool, queryLogs } from '../../src/db/postgres/logsClient';
import logQueueService from '../../src/services/log-queue.service';
import {
    findLogs,
    countLogs,
    iterateLogsDescending,
} from '../../src/repositories/logRepository';
import { getActivityAnalytics, resolveTimeZone } from '../../src/repositories/logAnalytics.repository';
import {
    ensureLogPartitions,
    dropExpiredLogPartitions,
    refreshLogRollups,
} from '../../src/db/postgres/logsPartitions';

let failures = 0;

const check = (label: string, condition: boolean, detail?: unknown) => {
    if (condition) {
        console.log(`  ✓ ${label}`);
    } else {
        failures += 1;
        console.log(`  ✗ ${label}${detail === undefined ? '' : ` -> ${JSON.stringify(detail)}`}`);
    }
};

const main = async () => {
    const force = process.argv.includes('--force');
    const existingApi = await countLogs('api');
    const existingActivity = await countLogs('activity');
    if ((existingApi > 0 || existingActivity > 0) && !force) {
        console.error(
            `\n✖ Refusing to run: this database already contains log data ` +
            `(log_api=${existingApi}, log_activity=${existingActivity}).\n` +
            `  Point LOG_DATABASE_URL at a dedicated test database, or pass --force.\n`
        );
        await closeLogsPool();
        process.exit(1);
    }

    console.log('\n== 1. enqueue all six log types through the queue ==');
    const base = {
        requestId: 'req_smoke_1',
        traceId: 'trc_smoke_1',
        correlationId: 'corr_smoke_1',
        sessionId: 'sess_smoke_1',
        storeId: '68f1a2b3c4d5e6f7a8b9c0d1',
        channel: 'STOREFRONT',
        actor: { type: 'customer', id: 'cust_1', email: 'shopper@example.com', name: 'Shopper' },
        ipAddress: '203.0.113.9',
        userAgent: 'Mozilla/5.0 Chrome/120',
        country: 'IN',
    };

    logQueueService.enqueueActivity({
        ...base,
        module: 'Orders',
        activityType: 'PLACE_ORDER',
        action: 'Placed New Order (ORD-1001)',
        status: 'success',
        details: { orderId: 'ORD-1001', productId: 'PRD-7', payload: { total: 4999 } },
    });

    logQueueService.enqueueActivity({
        ...base,
        module: 'Payment',
        activityType: 'PAYMENT_PROCESSED',
        action: 'Processed Payment (USD 120)',
        status: 'failed',
        actor: { type: 'admin', id: 'adm_1', email: 'admin@example.com' },
    });

    logQueueService.enqueueApi({
        ...base,
        userType: 'customer',
        userId: 'cust_1',
        method: 'POST',
        url: '/api/v1/orders?foo=bar',
        route: '/api/v1/orders',
        httpStatus: 201,
        responseTimeMs: 187,
        payloadSizeBytes: 1024,
        requestHeaders: { 'content-type': 'application/json' },
        requestBody: { total: 4999, card: '[REDACTED]' },
        queryParams: { foo: 'bar' },
        responseStatus: 'SUCCESS',
    });

    logQueueService.enqueueApi({
        ...base,
        userType: 'guest',
        method: 'GET',
        url: '/api/v1/products',
        route: '/api/v1/products',
        httpStatus: 500,
        responseTimeMs: 2450,
        requestBody: undefined,
        responseStatus: 'ERROR',
    });

    logQueueService.enqueueAudit({
        ...base,
        channel: 'ADMIN',
        module: 'Products',
        entity: 'Product',
        entityId: 'PRD-7',
        action: 'UPDATE',
        changes: { before: { price: 100 }, after: { price: 120 } },
        reason: 'Price correction',
    });

    logQueueService.enqueueSecurity({
        ...base,
        eventType: 'FAILED_LOGIN',
        severity: 'high',
        actor: { type: 'admin', email: 'admin@example.com' },
        endpoint: '/api/v1/auth/login',
        details: { httpStatus: 401, attemptedEmail: 'admin@example.com' },
    });

    logQueueService.enqueueSearch({
        ...base,
        userType: 'customer',
        keyword: 'Cotton Kurta',
        normalizedKeyword: 'cotton kurta',
        resultCount: 0,
        isNoResult: true,
        filters: { priceMin: 100, priceMax: 5000 },
    });

    logQueueService.enqueueSystem({
        source: 'cron',
        level: 'error',
        message: 'Backup job failed',
        stack: 'Error: timeout\n  at backup()',
        details: { attempt: 3 },
    });

    await logQueueService.shutdown();

    const stats = logQueueService.getQueueStats();
    check('queue fully drained', stats.queueLength === 0, stats);
    check('all 8 rows written', stats.writtenCount === 8, stats);
    check('no failed flushes', stats.failedFlushCount === 0, stats);
    check('no dropped entries', stats.droppedCount === 0, stats);

    console.log('\n== 2. counts per table ==');
    for (const [type, expected] of [
        ['activity', 2],
        ['api', 2],
        ['audit', 1],
        ['security', 1],
        ['search', 1],
        ['system', 1],
    ] as const) {
        const total = await countLogs(type);
        check(`${type} = ${expected}`, total === expected, total);
    }

    console.log('\n== 3. API response shape matches the Mongo contract ==');
    const activity = await findLogs('activity', {}, 1, 25);
    check('list returns both activity rows', activity.data.length === 2, activity.data.length);
    // Both rows share a created_at, so ordering falls back to `id DESC`. Select by
    // content rather than assuming position.
    const first = activity.data.find(
        (row) => (row as Record<string, any>).details?.orderId === 'ORD-1001'
    ) as Record<string, any>;
    check('has _id (24 hex)', typeof first._id === 'string' && /^[0-9a-f]{24}$/.test(first._id), first._id);
    check('has createdAt as Date', first.createdAt instanceof Date, typeof first.createdAt);
    check('createdAt is not snake_case', first.created_at === undefined);
    check('actor is nested object', first.actor?.type === 'customer', first.actor);
    check('actor id/email preserved', first.actor?.id === 'cust_1' && first.actor?.email === 'shopper@example.com', first.actor);
    check('details preserved as object', first.details?.orderId === 'ORD-1001', first.details);
    check('no null-valued keys leaked', Object.values(first).every((v) => v !== null), Object.keys(first));
    check('no snake_case column names leaked (except _id)',
        !Object.keys(first).some((k) => k !== '_id' && k.includes('_')), Object.keys(first));

    const apiLogs = await findLogs('api', {}, 1, 25);
    const apiRow = apiLogs.data.find((row) => (row as any).method === 'POST') as Record<string, any>;
    check('API requestBody is JSON object', apiRow.requestBody?.total === 4999, apiRow.requestBody);
    check('API queryParams preserved', apiRow.queryParams?.foo === 'bar');
    check('API list still includes payload columns (contract preserved)',
        'requestBody' in apiRow && 'queryParams' in apiRow && 'requestHeaders' in apiRow,
        Object.keys(apiRow));

    console.log('\n== 4. filtering ==');
    const failedActivity = await findLogs('activity', { status: 'failed' }, 1, 25);
    check('status=failed filter', failedActivity.total === 1 && failedActivity.data.length === 1);

    const paymentModule = await findLogs('activity', { module: 'Payment' }, 1, 25);
    check('module filter', paymentModule.total === 1);

    const byOrderId = await findLogs('activity', { orderId: 'ORD-1001' }, 1, 25);
    check('details.orderId containment filter', byOrderId.total === 1, byOrderId.total);

    const byProduct = await findLogs('activity', { productId: 'PRD-7' }, 1, 25);
    check('details.productId containment filter', byProduct.total === 1, byProduct.total);

    const keyword = await findLogs('activity', { searchKeyword: 'Placed' }, 1, 25);
    check('searchKeyword ILIKE across columns', keyword.total === 1, keyword.total);

    const actionPartial = await findLogs('activity', { action: 'payment' }, 1, 25);
    check('action partial match is case-insensitive', actionPartial.total === 1, actionPartial.total);

    const channelStorefront = await findLogs('activity', { channel: 'storefront' }, 1, 25);
    check('channel STOREFRONT matches case-insensitively', channelStorefront.total === 2, channelStorefront.total);

    const postOnly = await findLogs('api', { method: 'post' }, 1, 25);
    check('api method filter is case-insensitive', postOnly.total === 1, postOnly.total);

    const errors = await findLogs('api', { httpStatus: 500 }, 1, 25);
    check('api httpStatus filter', errors.total === 1, errors.total);

    const byCorrelation = await findLogs('api', { correlationId: 'corr_smoke_1' }, 1, 25);
    check('correlationId filter', byCorrelation.total === 2, byCorrelation.total);

    const noMatch = await findLogs('activity', { module: 'Nonexistent' }, 1, 25);
    check('non-matching filter returns empty', noMatch.total === 0);

    console.log('\n== 5. SQL injection attempt is treated as data ==');
    const injected = await findLogs('activity', { module: "' OR 1=1 --" }, 1, 25);
    check('injection string binds as a value', injected.total === 0, injected.total);
    const injectedSearch = await findLogs('activity', { searchKeyword: "%' OR '1'='1" }, 1, 25);
    check('wildcard in searchKeyword is escaped', injectedSearch.total === 0, injectedSearch.total);
    const rowsAfter = await countLogs('activity');
    check('no rows deleted by injection attempt', rowsAfter === 2, rowsAfter);

    console.log('\n== 6. keyset iteration (used by archive export) ==');
    const collected: Record<string, any>[] = [];
    const processed = await iterateLogsDescending('activity', {}, 1, async (rows) => {
        collected.push(...rows);
    });
    check('iterated every row in small pages', processed === 2 && collected.length === 2, processed);
    check('no duplicate rows across pages', new Set(collected.map((r) => r._id)).size === 2);

    console.log('\n== 7. rollups and dashboard ==');
    const since = new Date(Date.now() - 3 * 3600 * 1000);
    await refreshLogRollups(since, new Date());

    const rollupApi = await queryLogs<{ c: string }>('SELECT count(*)::text AS c FROM logs.api_metrics_15m');
    check('api rollup rows created', Number(rollupApi.rows[0]?.c) > 0, rollupApi.rows[0]);

    const analytics = await getActivityAnalytics({ since, timeZone: 'Asia/Kolkata' });
    check('totalActivities = 2', analytics.metrics.totalActivities === 2, analytics.metrics);
    check('ordersCount = 1', analytics.metrics.ordersCount === 1, analytics.metrics);
    check('paymentsCount counts Payment module', analytics.metrics.paymentsCount === 1, analytics.metrics);
    check('paymentsCount includes PAYMENT activityType', analytics.metrics.paymentsCount === 1);
    check('failedActions = 1', analytics.metrics.failedActions === 1, analytics.metrics);
    check('securityAlertsCount = 1', analytics.metrics.securityAlertsCount === 1, analytics.metrics);
    check('auditCount = 1', analytics.metrics.auditCount === 1, analytics.metrics);
    check('topApis populated', analytics.dashboards.topApis.length === 2, analytics.dashboards.topApis);
    check('topApis has _id.route/method',
        analytics.dashboards.topApis.every((row) => row._id?.route && row._id?.method));
    check('avgDuration computed as number',
        analytics.dashboards.topApis.every((row) => typeof row.avgDuration === 'number'));
    check('topKeywords has _id', analytics.dashboards.topKeywords[0]?._id === 'cotton kurta',
        analytics.dashboards.topKeywords);
    check('searchesNoResult populated', analytics.dashboards.searchesNoResult.length === 1,
        analytics.dashboards.searchesNoResult);
    check('activeCustomers has _id.id/email/name',
        analytics.dashboards.activeCustomers[0]?._id?.id === 'cust_1',
        analytics.dashboards.activeCustomers);
    check('activeAdmins picks up admin actor',
        analytics.dashboards.activeAdmins[0]?._id?.id === 'adm_1',
        analytics.dashboards.activeAdmins);
    check('securityTrends has critical bucket',
        analytics.dashboards.trends.securityTrends[0]?.critical === 1,
        analytics.dashboards.trends.securityTrends);
    check('activityTrends hour format HH:00',
        /^\d{2}:00$/.test(analytics.dashboards.trends.activityTrends[0]?._id ?? ''),
        analytics.dashboards.trends.activityTrends);
    check('apiLatencyTrends errorCalls = 1',
        analytics.dashboards.trends.apiLatencyTrends[0]?.errorCalls === 1,
        analytics.dashboards.trends.apiLatencyTrends);

    console.log('\n== 8. timezone bucketing for a half-hour offset (Asia/Kolkata) ==');
    const kolkata = await getActivityAnalytics({ since, timeZone: 'Asia/Kolkata' });
    const utc = await getActivityAnalytics({ since, timeZone: 'UTC' });
    const sum = (rows: Record<string, any>[], key: string) =>
        rows.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);
    check('kolkata trend total equals row count',
        sum(kolkata.dashboards.trends.activityTrends, 'total') === 2,
        kolkata.dashboards.trends.activityTrends);
    check('utc trend total equals row count',
        sum(utc.dashboards.trends.activityTrends, 'total') === 2,
        utc.dashboards.trends.activityTrends);
    check('invalid timezone falls back to UTC (repository defends itself)',
        (await getActivityAnalytics({ since, timeZone: 'Not/AZone' })).metrics.totalActivities === 2);
    check('resolveTimeZone maps an unknown zone to UTC', resolveTimeZone('Not/AZone') === 'UTC');
    check('resolveTimeZone preserves a valid zone', resolveTimeZone('Asia/Kolkata') === 'Asia/Kolkata');
    check('resolveTimeZone defaults to UTC when unset', resolveTimeZone(undefined) === 'UTC');

    console.log('\n== 9. routing to the default partition, then relocating it ==');
    await queryLogs(
        `INSERT INTO logs.log_activity (id, created_at, request_id, trace_id, channel, actor_type, module, activity_type, action, status)
         VALUES ('aaaaaaaaaaaaaaaaaaaaaaaa', '2027-06-15T10:00:00Z', 'req_future', 'trc_future', 'API', 'system', 'System', 'FUTURE_EVENT', 'Far future row', 'success')`
    );
    const inDefault = await queryLogs<{ c: string }>(
        "SELECT count(*)::text AS c FROM logs.log_activity_default WHERE request_id = 'req_future'"
    );
    check('out-of-range row landed in default partition', Number(inDefault.rows[0]?.c) === 1, inDefault.rows[0]);

    await ensureLogPartitions(12);
    const relocated = await queryLogs<{ c: string }>(
        "SELECT count(*)::text AS c FROM logs.log_activity WHERE request_id = 'req_future' AND created_at >= '2027-06-01'"
    );
    const defaultAfter = await queryLogs<{ c: string }>(
        "SELECT count(*)::text AS c FROM logs.log_activity_default WHERE request_id = 'req_future'"
    );
    check('partition 2027_06 created by relocation path',
        Number(relocated.rows[0]?.c) === 1, relocated.rows[0]);
    check('row moved out of the default partition',
        Number(defaultAfter.rows[0]?.c) === 0, defaultAfter.rows[0]);
    check('total row count unchanged after relocation',
        (await countLogs('activity')) === 3, await countLogs('activity'));

    console.log('\n== 10. retention drops whole partitions ==');
    await queryLogs("SELECT logs.ensure_month_partition('log_activity', '2024-01-01'::date)");
    const beforeDrop = await queryLogs<{ c: string }>(
        "SELECT count(*)::text AS c FROM pg_class WHERE relname = 'log_activity_2024_01' AND relkind = 'r'"
    );
    check('old partition exists before retention', Number(beforeDrop.rows[0]?.c) === 1);

    process.env.LOG_RETENTION_ENABLED = 'true';
    process.env.LOG_RETENTION_ACTIVITY_DAYS = '90';
    const results = await dropExpiredLogPartitions();
    const activityResult = results.find((row) => row.table === 'log_activity');
    check('retention dropped the expired partition',
        (activityResult?.partitionsDropped ?? 0) === 1, activityResult);

    const afterDrop = await queryLogs<{ c: string }>(
        "SELECT count(*)::text AS c FROM pg_class WHERE relname = 'log_activity_2024_01' AND relkind = 'r'"
    );
    check('expired partition is gone', Number(afterDrop.rows[0]?.c) === 0);
    check('current-month partition survived retention',
        (await countLogs('activity')) === 3, await countLogs('activity'));

    console.log(`\n${failures === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
    await closeLogsPool();
    process.exit(failures === 0 ? 0 : 1);
};

main().catch(async (error) => {
    console.error('\nSmoke test threw:', error);
    await closeLogsPool().catch(() => undefined);
    process.exit(1);
});
