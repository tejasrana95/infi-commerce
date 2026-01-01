import { Request, Response, NextFunction } from 'express';

export const honeypot = (fieldName: string = '_honey_trap') => {
    return (req: Request, res: Response, next: NextFunction) => {
        const honeyValue = req.body[fieldName];

        if (honeyValue) {
            console.log('Bot detected via honeypot field:', fieldName);
            // Silently reject or return success to trick the bot
            return res.status(200).json({ message: 'Success' });
        }

        return next();
    };
};
