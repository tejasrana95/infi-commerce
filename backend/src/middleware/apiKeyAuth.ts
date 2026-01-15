import { Request, Response, NextFunction } from 'express';
import ApiKey, { IApiKey } from '../models/ApiKey';
import Store from '../models/Store';
import redisService from '../services/redis.service';
import { CacheKeys, CACHE_TTL } from '../utils/cache-keys';

// Rate limit tracking (in-memory for simplicity, use Redis in production)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

// List of super_admin only route patterns that API keys cannot access
const SUPER_ADMIN_ROUTES = [
    '/api/users',
    '/api/api-keys',
    '/api/backup',
    '/api/settings',
];

export interface ApiKeyRequest extends Request {
    apiKey?: IApiKey;
    apiKeyAuth?: boolean;
}

/**
 * Middleware to authenticate requests using API key
 * Use this as an alternative to JWT authentication for external integrations
 */
export const authenticateApiKey = async (
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const apiKeyHeader = req.headers['x-api-key'] as string;

        if (!apiKeyHeader) {
            res.status(401).json({ error: 'API key is required' });
            return;
        }

        // Hash the provided key and look it up
        const keyHash = (ApiKey as any).hashKey(apiKeyHeader);
        const apiKey = await ApiKey.findOne({ keyHash });

        if (!apiKey) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }

        // Check if key is active and valid
        if (!apiKey.isActive) {
            res.status(401).json({ error: 'API key is inactive' });
            return;
        }

        // Check validity period
        const now = new Date();
        if (apiKey.validFrom > now) {
            res.status(401).json({ error: 'API key is not yet valid' });
            return;
        }
        if (apiKey.validUntil && apiKey.validUntil < now) {
            res.status(401).json({ error: 'API key has expired' });
            return;
        }

        // Check IP restriction
        const clientIp = req.ip || req.socket.remoteAddress || '';
        // Normalize IPv6 localhost to IPv4
        const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp.replace(/^::ffff:/, '');

        if (!apiKey.allowedIps.includes('0.0.0.0') && apiKey.allowedIps.length > 0) {
            if (!apiKey.allowedIps.includes(normalizedIp)) {
                res.status(403).json({ error: 'IP address not allowed' });
                return;
            }
        }

        // Check HTTP method permission
        const method = req.method.toUpperCase();
        if (!apiKey.permissions.includes(method as any)) {
            res.status(403).json({ error: `Method ${method} not allowed for this API key` });
            return;
        }

        // Block access to super_admin routes
        const path = req.path.toLowerCase();
        for (const pattern of SUPER_ADMIN_ROUTES) {
            if (path.startsWith(pattern.toLowerCase())) {
                res.status(403).json({ error: 'This endpoint is not accessible via API key' });
                return;
            }
        }

        // Check store scope
        if (apiKey.storeScope === 'single' && apiKey.storeId) {
            const storeIdHeader = req.headers['x-store-id'] as string;
            if (storeIdHeader && storeIdHeader !== apiKey.storeId.toString()) {
                res.status(403).json({ error: 'API key not authorized for this store' });
                return;
            }
            // Auto-set store ID header if not provided
            if (!storeIdHeader) {
                req.headers['x-store-id'] = apiKey.storeId.toString();
            }
        }

        // Check rate limit
        if (apiKey.rateLimit) {
            const keyId = apiKey._id.toString();
            const now = Date.now();
            const windowMs = 60 * 1000; // 1 minute window

            let rateData = rateLimitStore.get(keyId);

            if (!rateData || rateData.resetAt < now) {
                // New window
                rateData = { count: 1, resetAt: now + windowMs };
                rateLimitStore.set(keyId, rateData);
            } else {
                rateData.count++;
                if (rateData.count > apiKey.rateLimit) {
                    const retryAfter = Math.ceil((rateData.resetAt - now) / 1000);
                    res.setHeader('Retry-After', retryAfter.toString());
                    res.status(429).json({
                        error: 'Rate limit exceeded',
                        retryAfter,
                    });
                    return;
                }
            }
        }

        // Record usage (async, don't wait) - only if trackUsage is enabled
        if (apiKey.trackUsage !== false) {
            ApiKey.findByIdAndUpdate(apiKey._id, {
                lastUsedAt: new Date(),
                $inc: { usageCount: 1 },
            }).exec();
        }

        // Attach API key info to request
        req.apiKey = apiKey;
        req.apiKeyAuth = true;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware that accepts either JWT auth or API key auth
 */
export const authenticateAny = async (
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    // Check for API key first
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader) {
        return authenticateApiKey(req, res, next);
    }

    // Fall back to JWT auth
    const { authenticate } = await import('./auth');
    return authenticate(req, res, next);
};

/**
 * Optional API key auth - validates API key if provided
 * Allows requests from CORS domains (admin/frontend) without API key
 * Allows webhook endpoints for payment gateways
 * Requires API key for other external requests
 */
export const optionalApiKeyAuth = async (
    req: ApiKeyRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const apiKeyHeader = req.headers['x-api-key'] as string;
        const origin = req.headers.origin || req.headers.referer || '';
        const requestPath = req.path.toLowerCase();

        // Exempt routes that don't need API key (webhooks for payment gateways)
        const exemptRoutes = [
            '/webhooks',
            '/webhook',
        ];
        const isExemptRoute = exemptRoutes.some(route => requestPath.startsWith(route));
        if (isExemptRoute && !apiKeyHeader) {
            next();
            return;
        }

        // Get allowed CORS domains from config
        const { config } = await import('../config');
        const allowedOrigins = [
            config.cors.frontendUrl,
            config.cors.adminUrl,
        ].filter(Boolean);

        // Check if request is from an allowed CORS domain
        const isFromAllowedOrigin = allowedOrigins.some(allowed =>
            origin.startsWith(allowed)
        );

        // If API key is provided, always validate it (even from allowed origins)
        if (apiKeyHeader) {
            // Continue to validation below
        }
        // If no API key and request is from allowed origin, allow it
        else if (isFromAllowedOrigin || !origin) {
            next();
            return;
        }
        // New: Check if request is from a registered store domain
        else {
            try {
                // Extract hostname from origin/referer
                let hostname = origin;
                try {
                    const url = new URL(origin);
                    hostname = url.hostname;
                } catch (e) {
                    // Fallback if origin is just a hostname
                    hostname = origin.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
                }

                if (hostname) {
                    const cacheKey = CacheKeys.domainAllowed(hostname);
                    let isAllowed = await redisService.get<boolean>(cacheKey);

                    if (isAllowed === null || isAllowed === undefined) {
                        const store = await Store.findOne({ domains: hostname, isActive: true });
                        isAllowed = !!store;
                        await redisService.set(cacheKey, isAllowed, CACHE_TTL.DOMAIN_CHECK);
                    }

                    if (isAllowed) {
                        next();
                        return;
                    }
                }
            } catch (err) {
                console.error('Error in dynamic domain check:', err);
            }

            res.status(401).json({ error: 'API key is required for external requests' });
            return;
        }

        // Hash the provided key and look it up
        const keyHash = (ApiKey as any).hashKey(apiKeyHeader);
        const apiKey = await ApiKey.findOne({ keyHash });

        if (!apiKey) {
            res.status(401).json({ error: 'Invalid API key' });
            return;
        }

        // Check if key is active
        if (!apiKey.isActive) {
            res.status(401).json({ error: 'API key is inactive' });
            return;
        }

        // Check validity period
        const now = new Date();
        if (apiKey.validFrom > now) {
            res.status(401).json({ error: 'API key is not yet valid' });
            return;
        }
        if (apiKey.validUntil && apiKey.validUntil < now) {
            res.status(401).json({ error: 'API key has expired' });
            return;
        }

        // Check IP restriction
        const clientIp = req.ip || req.socket.remoteAddress || '';
        const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp.replace(/^::ffff:/, '');

        if (!apiKey.allowedIps.includes('0.0.0.0') && apiKey.allowedIps.length > 0) {
            if (!apiKey.allowedIps.includes(normalizedIp)) {
                res.status(403).json({ error: 'IP address not allowed' });
                return;
            }
        }

        // Check HTTP method permission
        const method = req.method.toUpperCase();
        if (!apiKey.permissions.includes(method as any)) {
            res.status(403).json({ error: `Method ${method} not allowed for this API key` });
            return;
        }

        // Block access to super_admin routes
        const path = req.path.toLowerCase();
        for (const pattern of SUPER_ADMIN_ROUTES) {
            if (path.startsWith(pattern.toLowerCase())) {
                res.status(403).json({ error: 'This endpoint is not accessible via API key' });
                return;
            }
        }

        // Check store scope
        if (apiKey.storeScope === 'single' && apiKey.storeId) {
            const storeIdHeader = req.headers['x-store-id'] as string;
            if (storeIdHeader && storeIdHeader !== apiKey.storeId.toString()) {
                res.status(403).json({ error: 'API key not authorized for this store' });
                return;
            }
            if (!storeIdHeader) {
                req.headers['x-store-id'] = apiKey.storeId.toString();
            }
        }

        // Check rate limit
        if (apiKey.rateLimit) {
            const keyId = apiKey._id.toString();
            const nowMs = Date.now();
            const windowMs = 60 * 1000;

            let rateData = rateLimitStore.get(keyId);

            if (!rateData || rateData.resetAt < nowMs) {
                rateData = { count: 1, resetAt: nowMs + windowMs };
                rateLimitStore.set(keyId, rateData);
            } else {
                rateData.count++;
                if (rateData.count > apiKey.rateLimit) {
                    const retryAfter = Math.ceil((rateData.resetAt - nowMs) / 1000);
                    res.setHeader('Retry-After', retryAfter.toString());
                    res.status(429).json({
                        error: 'Rate limit exceeded',
                        retryAfter,
                    });
                    return;
                }
            }
        }

        // Record usage (async, don't wait) - only if trackUsage is enabled
        if (apiKey.trackUsage !== false) {
            ApiKey.findByIdAndUpdate(apiKey._id, {
                lastUsedAt: new Date(),
                $inc: { usageCount: 1 },
            }).exec();
        }

        // Attach API key info to request
        req.apiKey = apiKey;
        req.apiKeyAuth = true;

        next();
    } catch (error) {
        next(error);
    }
};
