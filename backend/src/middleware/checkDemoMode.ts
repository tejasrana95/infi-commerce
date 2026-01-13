
import { Request, Response, NextFunction } from 'express';
import { AppError } from './validation';

export const checkDemoMode = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.DEMO === 'true') {
        return next(new AppError('This action is restricted in demo mode', 403));
    }
    next();
};
