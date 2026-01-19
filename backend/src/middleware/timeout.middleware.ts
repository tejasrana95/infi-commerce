import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely and causing 522 errors
 */
export const requestTimeout = (timeoutMs: number = 60000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Set timeout for this request
        const timeout = setTimeout(() => {
            if (!res.headersSent) {
                console.error(`Request timeout: ${req.method} ${req.path} exceeded ${timeoutMs}ms`);
                res.status(408).json({
                    error: 'Request Timeout',
                    message: 'The server took too long to respond. Please try again.',
                });
            }
        }, timeoutMs);

        // Clear timeout when response finishes
        res.on('finish', () => clearTimeout(timeout));
        res.on('close', () => clearTimeout(timeout));

        next();
    };
};

export default requestTimeout;
