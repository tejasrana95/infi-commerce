import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

declare global {
    namespace Express {
        interface Request {
            channel?: string;
        }
    }
}

export const channelMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const channelCode = req.headers['x-channel'] as string;
    if (channelCode) {
        req.channel = channelCode.toUpperCase();
    }

    next();
};

