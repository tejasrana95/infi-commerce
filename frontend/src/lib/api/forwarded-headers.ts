// Utility to extract incoming client request headers during Next.js SSR
// and forward them to the backend API so real client IP, user-agent,
// and session are accurately tracked rather than the Next.js server's IP.

import { headers } from 'next/headers';

export async function getForwardedHeaders(): Promise<Record<string, string>> {
    const forwardedHeaders: Record<string, string> = {};

    try {
        const headersList = await headers();

        // 1. IP Addresses
        // NOTE: Never send 'cf-connecting-ip' or 'true-client-ip' in outbound HTTP requests to Cloudflare-proxied
        // APIs, as Cloudflare blocks them with "Error 1000: DNS points to prohibited IP".
        // Instead, pass the client IP via standard 'x-forwarded-for', 'x-real-ip', and custom 'x-client-ip'.
        const clientIp = headersList.get('cf-connecting-ip')
            || headersList.get('true-client-ip')
            || headersList.get('x-real-ip')
            || headersList.get('x-forwarded-for')?.split(',')[0]?.trim();

        if (clientIp) {
            forwardedHeaders['x-client-ip'] = clientIp;
            forwardedHeaders['x-forwarded-for'] = clientIp;
            forwardedHeaders['x-real-ip'] = clientIp;
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
