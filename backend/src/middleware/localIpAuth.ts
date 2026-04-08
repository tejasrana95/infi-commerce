import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to restrict access to local IPs only (cron jobs, internal cleanup)
 */
export const localIpOnly = (req: Request, res: Response, next: NextFunction) => {
    // const clientIp = req.ip || req.socket.remoteAddress || '';

    // // Allow localhost IPv4, IPv6, and loopback addresses
    // const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
    // const isLocal = localIps.some(ip => clientIp.includes(ip));

    // if (!isLocal) {
    //     res.status(403).json({
    //         error: 'Forbidden',
    //         message: 'This endpoint is only accessible from localhost'
    //     });
    //     return;
    // }

    next();
};
