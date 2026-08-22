import { Request, Response, NextFunction } from 'express';
import { logQueueService } from '../services/log-queue.service';
import { sanitizePayload, parseUserAgent, extractSafeHeaders, getClientIpAddress } from '../utils/logSanitizer';
import { config } from '../config';
import { isLogDbConfigured } from '../config/logDatabase';

/**
 * Express Middleware to track all API requests and automatically log HTTP & business activity
 */
export const activityLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // If LOG_MONGODB_URI is not configured, skip logging completely to prevent errors or performance overhead
    if (!isLogDbConfigured()) {
        next();
        return;
    }

    // Intercept finish event to ensure response code, size, and duration are captured
    res.on('finish', () => {
        try {
            const responseTimeMs = req.startTime ? Date.now() - req.startTime : 0;
            const ipAddress = getClientIpAddress(req);
            const userAgentStr = (req.headers['user-agent'] as string) || '';
            const { browser, operatingSystem, deviceType, platform } = parseUserAgent(userAgentStr);
            const reqPathLower = (req.originalUrl || req.path).toLowerCase();
            const isAuthRoute = reqPathLower.includes('/auth/');

            // Determine Channel
            let channel = req.channel || (req.headers['x-channel'] as string)?.toUpperCase();
            if (!channel) {
                const origin = (req.headers.origin || req.headers.referer || '').toLowerCase();

                if (reqPathLower.startsWith('/api/pos') || origin.includes(config.cors.posUrl.toLowerCase())) {
                    channel = 'POS';
                } else if (reqPathLower.startsWith('/api/admin') || origin.includes(config.cors.adminUrl.toLowerCase())) {
                    channel = 'ADMIN';
                } else if (req.headers['x-api-key']) {
                    channel = 'API';
                } else if (reqPathLower.startsWith('/webhooks') || reqPathLower.startsWith('/webhook')) {
                    channel = 'WEBHOOK';
                } else {
                    channel = 'STOREFRONT';
                }
            }

            // Determine Actor Type & Info
            let userType: 'super_admin' | 'admin' | 'store_admin' | 'pos_user' | 'customer' | 'guest' | 'api_key' | 'system' = 'guest';
            let userId: string | undefined = undefined;
            let userEmail: string | undefined = undefined;
            let apiKeyId: string | undefined = undefined;
            let apiKeyName: string | undefined = undefined;

            const user = (req as any).user || (res.locals as any)?.user;
            const apiKey = (req as any).apiKey;

            if (user) {
                userId = user.id || user._id?.toString();
                userEmail = user.email;
                if (user.role === 'super_admin') userType = 'super_admin';
                else if (user.role === 'admin') userType = 'admin';
                else if (user.role === 'store_admin') userType = 'store_admin';
                else if (user.role === 'pos_user') userType = 'pos_user';
                else userType = 'customer';
            } else if (apiKey) {
                userType = 'api_key';
                apiKeyId = apiKey._id?.toString();
                apiKeyName = apiKey.name;
            } else if (reqPathLower.includes('/admin')) {
                userType = 'admin';
            } else if (reqPathLower.includes('/pos')) {
                userType = 'pos_user';
            } else if (reqPathLower.includes('/auth') || reqPathLower.includes('/login')) {
                userType = reqPathLower.includes('/admin') ? 'admin' : 'customer';
            } else {
                userType = 'guest';
            }

            const contentLengthHeader = res.getHeader('content-length');
            const payloadSizeBytes = contentLengthHeader ? parseInt(String(contentLengthHeader), 10) : 0;

            const sanitizedReqBody = sanitizePayload(req.body);
            const sanitizedQueryParams = sanitizePayload(req.query);
            const attemptedEmail = req.body?.email || req.body?.username || userEmail;

            // 1. Enqueue Raw API Log
            logQueueService.enqueueApi({
                requestId: req.requestId || 'req_unknown',
                traceId: req.traceId || 'trc_unknown',
                correlationId: req.correlationId,
                sessionId: req.headers['x-session-id'] as string,
                storeId: req.storeId || req.headers['x-store-id'],
                currency: (req.headers['x-currency'] as string) || (req.query.currency as string),
                language: (req.headers['accept-language'] as string)?.split(',')[0],
                timezone: req.headers['x-timezone'] as string,
                channel,
                userType,
                userId,
                apiKeyId,
                apiKeyName,
                method: req.method,
                url: req.originalUrl || req.url,
                route: req.route?.path || req.path,
                httpStatus: res.statusCode,
                responseTimeMs,
                payloadSizeBytes,
                ipAddress,
                forwardedIp: (req.headers['x-forwarded-for'] as string)?.split(',')[0],
                userAgent: userAgentStr,
                browser,
                operatingSystem,
                deviceType,
                platform,
                referer: req.headers.referer as string,
                origin: req.headers.origin as string,
                requestHeaders: extractSafeHeaders(req.headers),
                requestBody: Object.keys(sanitizedReqBody || {}).length > 0 ? sanitizedReqBody : undefined,
                queryParams: Object.keys(sanitizedQueryParams || {}).length > 0 ? sanitizedQueryParams : undefined,
                responseStatus: res.statusCode < 400 ? 'SUCCESS' : 'ERROR',
            });

            // 2. Enqueue Authentication & Security Log
            const isAuthEndpoint = isAuthRoute || reqPathLower.includes('/login') || reqPathLower.includes('/logout');

            if (isAuthEndpoint) {
                const targetActorType = userType !== 'guest' ? userType : (reqPathLower.includes('/admin') ? 'admin' : 'customer');

                if (res.statusCode < 400) {
                    // Successful Login / Logout / Auth Event
                    const isLogout = reqPathLower.includes('/logout');
                    const activityType = isLogout ? 'LOGOUT' : 'LOGIN_SUCCESS';
                    const actionTitle = isLogout ? 'User Logout' : 'User Login';

                    logQueueService.enqueueActivity({
                        requestId: req.requestId || 'req_unknown',
                        traceId: req.traceId || 'trc_unknown',
                        correlationId: req.correlationId,
                        sessionId: req.headers['x-session-id'] as string,
                        storeId: req.storeId || req.headers['x-store-id'],
                        channel,
                        actor: {
                            type: targetActorType,
                            id: userId,
                            email: attemptedEmail || userEmail,
                            name: user?.name || attemptedEmail || userEmail,
                        },
                        module: 'Authentication',
                        activityType,
                        action: `${actionTitle} (${attemptedEmail || userEmail || 'User'})`,
                        status: 'success',
                        details: {
                            httpStatus: res.statusCode,
                            attemptedEmail: attemptedEmail || userEmail,
                        },
                        ipAddress,
                        userAgent: userAgentStr,
                        browser,
                        operatingSystem,
                        deviceType,
                    });
                } else {
                    // Failed Login / Auth Error (400, 401, 403, 429)
                    logQueueService.enqueueSecurity({
                        requestId: req.requestId,
                        storeId: req.storeId || req.headers['x-store-id'],
                        eventType: res.statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : res.statusCode === 403 ? 'UNAUTHORIZED_ACCESS' : 'FAILED_LOGIN',
                        severity: res.statusCode === 429 ? 'medium' : 'high',
                        actor: {
                            type: targetActorType,
                            id: userId,
                            email: attemptedEmail,
                        },
                        ipAddress,
                        userAgent: userAgentStr,
                        endpoint: req.originalUrl || req.url,
                        details: {
                            httpStatus: res.statusCode,
                            method: req.method,
                            attemptedEmail,
                            route: req.path,
                        },
                    });

                    logQueueService.enqueueActivity({
                        requestId: req.requestId || 'req_unknown',
                        traceId: req.traceId || 'trc_unknown',
                        correlationId: req.correlationId,
                        sessionId: req.headers['x-session-id'] as string,
                        storeId: req.storeId || req.headers['x-store-id'],
                        channel,
                        actor: {
                            type: targetActorType,
                            id: userId,
                            email: attemptedEmail,
                        },
                        module: 'Authentication',
                        activityType: 'LOGIN_FAILED',
                        action: `Failed Login (${attemptedEmail || 'Unknown User'})`,
                        status: 'failed',
                        details: {
                            httpStatus: res.statusCode,
                            attemptedEmail,
                        },
                        ipAddress,
                        userAgent: userAgentStr,
                        browser,
                        operatingSystem,
                        deviceType,
                    });
                }
            }

            // 3. Automatic Audit & Activity Ingestion for State Mutations (excluding Auth, Activity Log, & non-mutating calculation routes)
            const isNonMutatingRoute =
                reqPathLower.includes('/calculate-smart') ||
                reqPathLower.includes('/calculate') ||
                reqPathLower.includes('/estimate') ||
                reqPathLower.includes('/health') ||
                reqPathLower.includes('/metrics');

            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode < 400 && !isAuthEndpoint && !reqPathLower.includes('/activity-logs') && !isNonMutatingRoute) {
                let action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLE_CHANGE' | 'PERMISSION_CHANGE' = 'UPDATE';
                if (req.method === 'POST') action = 'CREATE';
                else if (req.method === 'DELETE') action = 'DELETE';

                if (reqPathLower.includes('publish')) action = 'PUBLISH';
                else if (reqPathLower.includes('role')) action = 'ROLE_CHANGE';

                // Precise Module & Entity Extraction from URL
                let module = 'System';
                let entity = 'Resource';

                if (reqPathLower.includes('/products') || reqPathLower.includes('/product')) {
                    module = 'Products';
                    entity = 'Product';
                } else if (reqPathLower.includes('/categories') || reqPathLower.includes('/category')) {
                    module = 'Categories';
                    entity = 'Category';
                } else if (reqPathLower.includes('/blogs') || reqPathLower.includes('/blog') || reqPathLower.includes('/posts') || reqPathLower.includes('/post')) {
                    module = 'Blog';
                    entity = 'BlogPost';
                } else if (reqPathLower.includes('/pages') || reqPathLower.includes('/page') || reqPathLower.includes('/cms')) {
                    module = 'CMS Pages';
                    entity = 'CMSPage';
                } else if (reqPathLower.includes('/checkout') || reqPathLower.includes('/orders') || reqPathLower.includes('/order')) {
                    module = 'Orders';
                    entity = 'Order';
                } else if (reqPathLower.includes('/payments') || reqPathLower.includes('/pay')) {
                    module = 'Payments';
                    entity = 'PaymentTransaction';
                } else if (reqPathLower.includes('/returns') || reqPathLower.includes('/return') || reqPathLower.includes('/refund')) {
                    module = 'Returns & Refunds';
                    entity = 'Return';
                } else if (reqPathLower.includes('/accounting') || reqPathLower.includes('/expense') || reqPathLower.includes('/invoice')) {
                    module = 'Accounting';
                    entity = 'Transaction';
                } else if (reqPathLower.includes('/coupons') || reqPathLower.includes('/discounts') || reqPathLower.includes('/marketing') || reqPathLower.includes('/promotions')) {
                    module = 'Coupons & Marketing';
                    entity = 'Coupon';
                } else if (reqPathLower.includes('/reviews') || reqPathLower.includes('/review')) {
                    module = 'Reviews';
                    entity = 'ProductReview';
                } else if (reqPathLower.includes('/newsletter') || reqPathLower.includes('/subscriber')) {
                    module = 'Coupons & Marketing';
                    entity = 'Subscriber';
                } else if (reqPathLower.includes('/inventory') || reqPathLower.includes('/stock')) {
                    module = 'Inventory';
                    entity = 'StockItem';
                } else if (reqPathLower.includes('/profile') || reqPathLower.includes('/account')) {
                    module = 'Customer Account';
                    entity = 'Profile';
                } else if (reqPathLower.includes('/settings') || reqPathLower.includes('/store')) {
                    module = 'Store Settings';
                    entity = 'Setting';
                } else if (reqPathLower.includes('/users') || reqPathLower.includes('/roles') || reqPathLower.includes('/staff')) {
                    module = 'Users & Roles';
                    entity = 'User/Role';
                } else if (reqPathLower.includes('/pos')) {
                    module = 'POS';
                    entity = 'POS Session';
                } else if (reqPathLower.includes('/wishlist') || reqPathLower.includes('/wishlists')) {
                    module = 'Wishlist';
                    entity = 'Wishlist';
                } else if (reqPathLower.includes('/cart')) {
                    module = 'Cart';
                    entity = 'Cart';
                } else {
                    // Extract segment from URL
                    const segments = req.path.split('/').filter(Boolean);
                    if (segments.length > 0) {
                        const seg = segments[0] === 'api' ? (segments[1] || 'General') : segments[0];
                        module = seg.charAt(0).toUpperCase() + seg.slice(1);
                        entity = module;
                    }
                }

                const entityId = req.params?.id || req.body?.orderId || req.body?.productId || req.body?.id || req.body?._id || req.query?.id || 'unknown_id';
                const productName = req.body?.productName || req.body?.name || req.body?.title || req.body?.slug || req.path;

                let customActivityType = `${action}_${entity.toUpperCase()}`;
                let customActionTitle = `${action} ${entity}: ${productName}`;

                if (module === 'Wishlist') {
                    if (req.method === 'POST' || req.method === 'PUT') {
                        customActivityType = 'ADD_TO_WISHLIST';
                        customActionTitle = `Added Product to Wishlist (${productName})`;
                    } else if (req.method === 'DELETE') {
                        customActivityType = 'REMOVE_FROM_WISHLIST';
                        customActionTitle = `Removed Product from Wishlist`;
                    }
                } else if (module === 'Cart') {
                    if (req.method === 'POST' || req.method === 'PUT') {
                        customActivityType = 'ADD_TO_CART';
                        customActionTitle = `Added Product to Cart (${productName})`;
                    } else if (req.method === 'DELETE') {
                        customActivityType = 'REMOVE_FROM_CART';
                        customActionTitle = `Removed Item from Cart`;
                    }
                } else if (module === 'Orders' && (reqPathLower.includes('checkout') || req.method === 'POST')) {
                    customActivityType = 'PLACE_ORDER';
                    customActionTitle = `Placed New Order (${entityId !== 'unknown_id' ? entityId : 'Order'})`;
                } else if (module === 'Payments') {
                    customActivityType = 'PAYMENT_PROCESSED';
                    customActionTitle = `Processed Payment (${req.body?.amount ? req.body.amount + ' USD' : 'Transaction'})`;
                } else if (module === 'Reviews') {
                    customActivityType = 'SUBMIT_REVIEW';
                    customActionTitle = `Submitted Product Review`;
                }

                // Automatic Enqueue to AuditLog Queue
                logQueueService.enqueueAudit({
                    requestId: req.requestId || `req_${Date.now()}`,
                    storeId: req.storeId || req.headers['x-store-id'],
                    channel,
                    actor: {
                        type: userType,
                        id: userId,
                        email: userEmail || attemptedEmail,
                        name: user?.name || userEmail || attemptedEmail,
                    },
                    module,
                    entity,
                    entityId: String(entityId),
                    action,
                    changes: {
                        before: req.method !== 'POST' ? { status: 'prior_state' } : undefined,
                        after: sanitizedReqBody && Object.keys(sanitizedReqBody).length > 0 ? sanitizedReqBody : { status: 'updated' },
                    },
                    reason: `${customActionTitle} via ${req.method} ${req.path}`,
                    ipAddress,
                });

                // Automatic Enqueue to Business Activity Log Queue
                logQueueService.enqueueActivity({
                    requestId: req.requestId || `req_${Date.now()}`,
                    traceId: req.traceId || `trc_${Date.now()}`,
                    correlationId: req.correlationId,
                    sessionId: req.headers['x-session-id'] as string,
                    storeId: req.storeId || req.headers['x-store-id'],
                    channel,
                    actor: {
                        type: userType,
                        id: userId,
                        email: userEmail || attemptedEmail,
                        name: user?.name || userEmail || attemptedEmail,
                    },
                    module,
                    activityType: customActivityType,
                    action: customActionTitle,
                    status: 'success',
                    details: {
                        httpMethod: req.method,
                        route: req.path,
                        entityId,
                        payload: sanitizedReqBody,
                    },
                    ipAddress,
                    userAgent: userAgentStr,
                    browser,
                    operatingSystem,
                    deviceType,
                });
            }

            // 4. Automatic Customer Search Query Tracking
            const searchQueryParam = (req.query.search || req.query.q || req.query.keyword || req.query.query || req.body?.search || req.body?.q || req.body?.keyword) as string;

            if (searchQueryParam && typeof searchQueryParam === 'string' && searchQueryParam.trim().length > 0 && res.statusCode < 400) {
                const cleanKeyword = searchQueryParam.trim();

                // Enqueue Search Analytics Log
                logQueueService.enqueueSearch({
                    storeId: req.storeId || req.headers['x-store-id'],
                    sessionId: req.headers['x-session-id'] as string,
                    customerId: userId,
                    userType: userType === 'guest' ? 'guest' : (userType as any),
                    channel,
                    keyword: cleanKeyword,
                    normalizedKeyword: cleanKeyword.toLowerCase(),
                    resultCount: 1,
                    isNoResult: false,
                    ipAddress,
                });

                // Enqueue Business Activity Log for Search Query
                logQueueService.enqueueActivity({
                    requestId: req.requestId || `req_${Date.now()}`,
                    traceId: req.traceId || `trc_${Date.now()}`,
                    correlationId: req.correlationId,
                    sessionId: req.headers['x-session-id'] as string,
                    storeId: req.storeId || req.headers['x-store-id'],
                    channel,
                    actor: {
                        type: userType,
                        id: userId,
                        email: userEmail || attemptedEmail,
                        name: user?.name || userEmail || attemptedEmail,
                    },
                    module: 'Storefront',
                    activityType: 'CUSTOMER_SEARCH',
                    action: `Searched for "${cleanKeyword}"`,
                    status: 'success',
                    details: {
                        keyword: cleanKeyword,
                        route: req.path,
                    },
                    ipAddress,
                    userAgent: userAgentStr,
                    browser,
                    operatingSystem,
                    deviceType,
                });
            }
        } catch (error) {
            console.error('Error in activityLoggerMiddleware finish listener:', error);
        }
    });

    next();
};

export default activityLoggerMiddleware;
