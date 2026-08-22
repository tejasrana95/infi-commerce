import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            traceId?: string;
            correlationId?: string;
            startTime?: number;
        }
    }
}

export const requestCorrelation = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
    const correlationId = (req.headers['x-correlation-id'] as string) || requestId;

    req.requestId = requestId;
    req.traceId = traceId;
    req.correlationId = correlationId;
    req.startTime = Date.now();

    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Correlation-ID', correlationId);

    next();
};

export default requestCorrelation;
