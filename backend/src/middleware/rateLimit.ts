import rateLimit from 'express-rate-limit';

export const publicSubmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per `window`
    message: {
        message: 'Too many submissions from this IP, please try again after 15 minutes',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Global API Rate Limiter
 * 300 requests per 5 minutes per IP
 */
export const globalApiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 600,
    message: {
        error: 'Too many requests',
        message: 'Too many requests from this IP, please try again after 5 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
