// Utility to extract incoming client request headers during Next.js SSR
// and forward them to the backend API so real client IP, user-agent,
// and session are accurately tracked rather than the Next.js server's IP.

import { headers } from 'next/headers';

export async function getForwardedHeaders(): Promise<Record<string, string>> {
    const forwardedHeaders: Record<string, string> = {};

    try {
        const headersList = await headers();

        // 1. IP Addresses (Cloudflare, proxies, standard X-Forwarded-For)
        const cfConnectingIp = headersList.get('cf-connecting-ip');
        if (cfConnectingIp) forwardedHeaders['cf-connecting-ip'] = cfConnectingIp;

        const trueClientIp = headersList.get('true-client-ip');
        if (trueClientIp) forwardedHeaders['true-client-ip'] = trueClientIp;

        const xForwardedFor = headersList.get('x-forwarded-for');
        const xRealIp = headersList.get('x-real-ip');

        if (xForwardedFor) {
            forwardedHeaders['x-forwarded-for'] = xForwardedFor;
        } else if (xRealIp) {
            forwardedHeaders['x-forwarded-for'] = xRealIp;
        }

        if (xRealIp) {
            forwardedHeaders['x-real-ip'] = xRealIp;
        }

        // 2. User Agent
        const userAgent = headersList.get('user-agent');
        if (userAgent) {
            forwardedHeaders['user-agent'] = userAgent;
        }

        // 3. Session & Store Context
        const sessionId = headersList.get('x-session-id');
        if (sessionId) {
            forwardedHeaders['x-session-id'] = sessionId;
        }

        const storeId = headersList.get('x-store-id');
        if (storeId) {
            forwardedHeaders['x-store-id'] = storeId;
        }

        const channel = headersList.get('x-channel');
        if (channel) {
            forwardedHeaders['x-channel'] = channel;
        }
    } catch {
        // Ignored if called outside request context (e.g. build time static generation)
    }

    return forwardedHeaders;
}
