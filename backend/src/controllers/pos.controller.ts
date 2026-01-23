import { Request, Response } from 'express';

import mongoose from 'mongoose';
import Category from '../models/Category';
import posService from '../services/pos.service';

// Helper to get store ID from header or query
const getStoreIdFromRequest = (req: Request): mongoose.Types.ObjectId | null => {
    let storeId: string | undefined;

    // Check query first (explicit override)
    if (req.query.storeId) {
        storeId = req.query.storeId as string;
    }

    // If not in query, check header
    if (!storeId && req.headers['x-store-id']) {
        storeId = req.headers['x-store-id'] as string;
    }

    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        return null;
    }
    return new mongoose.Types.ObjectId(storeId);
};

class POSController {
    /**
     * POST /api/pos/session/start
     * Start a new POS session
     */
    async startSession(req: Request, res: Response) {
        try {
            const { openingCash } = req.body;
            const userId = new mongoose.Types.ObjectId((req as any).user.id);
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header or query param',
                });
            }

            if (openingCash === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Opening cash is required',
                });
            }

            const session = await posService.startSession(storeId, userId, openingCash);

            res.status(201).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('Start session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to start session',
            });
        }
    }

    /**
     * POST /api/pos/session/end
     * End POS session with cash count
     */
    async endSession(req: Request, res: Response) {
        try {
            const { sessionId, closingCash, notes } = req.body;

            if (!sessionId || closingCash === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Session ID and closing cash are required',
                });
            }

            const session = await posService.endSession(
                new mongoose.Types.ObjectId(sessionId),
                closingCash,
                notes
            );

            res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('End session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to end session',
            });
        }
    }

    /**
     * GET /api/pos/session/current
     * Get current active session
     */
    async getCurrentSession(req: Request, res: Response) {
        try {
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header or query param',
                });
            }

            const session = await posService.getCurrentSession(storeId);

            res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('Get current session error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get current session',
            });
        }
    }

    /**
     * GET /api/pos/session/history
     * Get session history for store
     */
    async getSessionHistory(req: Request, res: Response) {
        try {
            const { limit = '20', skip = '0' } = req.query;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header or query param',
                });
            }

            const result = await posService.getSessionHistory(
                storeId,
                parseInt(limit as string),
                parseInt(skip as string)
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Get session history error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get session history',
            });
        }
    }



    /**
     * GET /api/pos/dashboard
     * POS dashboard data (today's sales, orders)
     */
    async getDashboard(req: Request, res: Response) {
        try {
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header or query param',
                });
            }

            const dashboardData = await posService.getDashboardData(storeId);

            res.status(200).json({
                success: true,
                data: dashboardData,
            });
        } catch (error: any) {
            console.error('Get dashboard error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get dashboard data',
            });
        }
    }

    /**
     * POST /api/pos/receipt/:orderId
     * Generate receipt data
     */
    async getReceiptData(req: Request, res: Response) {
        try {
            const { orderId } = req.params;

            const receiptData = await posService.generateReceiptData(
                new mongoose.Types.ObjectId(orderId)
            );

            res.status(200).json({
                success: true,
                data: receiptData,
            });
        } catch (error: any) {
            console.error('Get receipt data error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate receipt data',
            });
        }
    }

    /**
     * POST /api/pos/verify-password
     * Verify user password for sensitive actions
     */
    async verifyPassword(req: Request, res: Response) {
        try {
            const { password } = req.body;
            const userId = new mongoose.Types.ObjectId((req as any).user.id);

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required',
                });
            }

            const isValid = await posService.verifyPassword(userId, password);

            res.status(200).json({
                success: true,
                data: { isValid },
            });
        } catch (error: any) {
            console.error('Verify password error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to verify password',
            });
        }
    }
}

export default new POSController();
