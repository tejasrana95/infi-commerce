import { Request } from 'express';

/**
 * Get the real client IP, handling Cloudflare and other reverse proxies.
 * Priority: CF-Connecting-IP (Cloudflare) > True-Client-IP (Enterprise) > X-Forwarded-For > req.ip
 */
export function getClientIp(req: Request): string {
    const cfConnectingIp = req.headers['cf-connecting-ip'] as string | undefined;
    if (cfConnectingIp) return cfConnectingIp.trim();

    const trueClientIp = req.headers['true-client-ip'] as string | undefined;
    if (trueClientIp) return trueClientIp.trim();

    const xForwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    if (xForwardedFor) {
        // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
        // The leftmost IP is the original client
        return xForwardedFor.split(',')[0].trim();
    }

    return req.ip || req.socket.remoteAddress || '';
}

/**
 * Get effective store ID from multiple sources (for API key and regular requests)
 * Priority: x-store-id header > query param > body field
 */
export function getEffectiveStoreId(req: Request): string | undefined {
    const storeIdFromHeader = req.headers['x-store-id'] as string | undefined;
    const storeIdFromQuery = req.query.storeId as string | undefined;
    const storeIdFromBody = req.body?.storeId as string | undefined;

    return storeIdFromHeader || storeIdFromQuery || storeIdFromBody;
}
