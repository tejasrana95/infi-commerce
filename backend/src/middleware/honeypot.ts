import { Request, Response, NextFunction } from 'express';

export const honeypot = (fieldName: string = '_honey_trap') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const honeyValue = req.body[fieldName];

        if (honeyValue) {

            // Silently reject or return success to trick the bot
            return res.status(200).json({ message: 'Success' });
        }

        return next();
    };
};
