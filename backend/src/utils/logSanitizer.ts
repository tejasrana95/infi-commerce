import { Request } from 'express';

const SENSITIVE_KEYS = [
    'password',
    'pass',
    'confirmPassword',
    'newPassword',
    'oldPassword',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'secret',
    'apiSecret',
    'creditCard',
    'cardNumber',
    'cvv',
    'cvc',
    'expiry',
    'otp',
    'cookie',
    'twoFactorSecret',
    'signature',
];

/**
 * Recursively sanitize sensitive fields from objects
 */
export const sanitizePayload = (data: any, depth = 0): any => {
    if (depth > 8 || data === null || data === undefined) return data;

    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map((item) => sanitizePayload(item, depth + 1));
    }

    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(data)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive.toLowerCase()));

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof data[key] === 'object' && data[key] !== null) {
            sanitized[key] = sanitizePayload(data[key], depth + 1);
        } else {
            sanitized[key] = data[key];
        }
    }

    return sanitized;
};

/**
 * Parse browser and OS information from User-Agent string
 */
export const parseUserAgent = (userAgent: string = '') => {
    let browser = 'Unknown';
    let operatingSystem = 'Unknown';
    let deviceType = 'Desktop';
    let platform = 'Web';

    if (!userAgent) return { browser, operatingSystem, deviceType, platform };

    // Browser detection
    if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/')) browser = 'Safari';
    else if (userAgent.includes('PostmanRuntime')) browser = 'Postman';

    // OS detection
    if (userAgent.includes('Win')) operatingSystem = 'Windows';
    else if (userAgent.includes('Mac')) operatingSystem = 'macOS';
    else if (userAgent.includes('Linux')) operatingSystem = 'Linux';
    else if (userAgent.includes('Android')) operatingSystem = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) operatingSystem = 'iOS';

    // Device type
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        deviceType = 'Mobile';
    } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
        deviceType = 'Tablet';
    }

    return { browser, operatingSystem, deviceType, platform };
};

/**
 * Resolve Request Headers safely
 */
export const extractSafeHeaders = (headers: Request['headers']) => {
    const safe: Record<string, string> = {};
    const allowedHeaders = [
        'host',
        'user-agent',
        'accept',
        'accept-language',
        'content-type',
        'origin',
        'referer',
        'x-store-id',
        'x-channel',
        'x-currency',
        'x-timezone',
        'x-request-id',
        'x-correlation-id',
    ];

    for (const key of Object.keys(headers)) {
        if (allowedHeaders.includes(key.toLowerCase())) {
            safe[key] = String(headers[key]);
        }
    }

    return safe;
};

/**
 * Extract Client IP address
 */
export const getClientIpAddress = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
        return ip.trim().replace(/^::ffff:/, '');
    }
    const ip = req.socket?.remoteAddress || '127.0.0.1';
    return ip.replace(/^::ffff:/, '');
};
