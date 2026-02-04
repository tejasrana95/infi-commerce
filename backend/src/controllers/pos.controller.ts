import { Request, Response } from 'express';

import mongoose from 'mongoose';

import posService from '../services/pos.service';
import POSHeldOrder from '../models/POSHeldOrder';
import User from '../models/User';
import Order from '../models/Order';

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

            return res.status(201).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('Start session error:', error);
            return res.status(500).json({
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

            return res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('End session error:', error);
            return res.status(500).json({
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

            return res.status(200).json({
                success: true,
                data: session,
            });
        } catch (error: any) {
            console.error('Get current session error:', error);
            return res.status(500).json({
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
            const { limit = '20', skip = '0', search = '', status = 'all', startDate = '', endDate = '' } = req.query;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header or query param',
                });
            }

            const result = await posService.getSessionHistory(
                storeId,
                search as string,
                status as string,
                parseInt(limit as string),
                parseInt(skip as string),
                startDate as string,
                endDate as string
            );

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Get session history error:', error);
            return res.status(500).json({
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

            return res.status(200).json({
                success: true,
                data: dashboardData,
            });
        } catch (error: any) {
            console.error('Get dashboard error:', error);
            return res.status(500).json({
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

            return res.status(200).json({
                success: true,
                data: { isValid },
            });
        } catch (error: any) {
            console.error('Verify password error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to verify password',
            });
        }
    }

    /**
     * POST /api/pos/held-orders
     * Create a held order
     */
    async createHeldOrder(req: Request, res: Response) {
        try {
            const { customerIdentifier, customerId, items, subtotal, tax, total, notes } = req.body;
            const userId = new mongoose.Types.ObjectId((req as any).user.id);
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            // Get current session
            const currentSession = await posService.getCurrentSession(storeId);
            if (!currentSession) {
                return res.status(400).json({
                    success: false,
                    message: 'No active POS session found. Please start a session first.',
                });
            }

            const heldOrder = await POSHeldOrder.create({
                storeId,
                sessionId: currentSession._id,
                assignedToUserId: userId,
                customerIdentifier,
                customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
                items,
                subtotal,
                tax,
                total,
                notes,
                status: 'held',
            });

            await heldOrder.populate('assignedToUserId', 'name email');

            return res.status(201).json({
                success: true,
                data: heldOrder,
            });
        } catch (error: any) {
            console.error('Create held order error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create held order',
            });
        }
    }

    /**
     * GET /api/pos/held-orders
     * Get all held orders for current store (optionally filter by user)
     */
    async getHeldOrders(req: Request, res: Response) {
        try {
            const userId = new mongoose.Types.ObjectId((req as any).user.id);
            const storeId = getStoreIdFromRequest(req);
            const { assignedToMe } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            const query: any = {
                storeId,
                status: 'held',
            };

            // Filter by assigned user if requested
            if (assignedToMe === 'true') {
                query.assignedToUserId = userId;
            }

            const heldOrders = await POSHeldOrder.find(query)
                .populate('assignedToUserId', 'firstName lastName email')
                .populate('customerId', 'firstName lastName phone email')
                .sort({ heldAt: -1 });

            return res.status(200).json({
                success: true,
                data: heldOrders,
            });
        } catch (error: any) {
            console.error('Get held orders error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get held orders',
            });
        }
    }

    /**
     * PUT /api/pos/held-orders/:id/transfer
     * Transfer held order to another user
     */
    async transferHeldOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { targetUserId } = req.body;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            if (!targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Target user ID is required',
                });
            }

            // Verify target user exists and has POS access
            const targetUser = await User.findById(targetUserId);
            if (!targetUser || !['pos_user', 'store_admin', 'super_admin'].includes(targetUser.role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid target user or user does not have POS access',
                });
            }

            const heldOrder = await POSHeldOrder.findOneAndUpdate(
                { _id: id, storeId, status: 'held' },
                { assignedToUserId: new mongoose.Types.ObjectId(targetUserId) },
                { new: true }
            ).populate('assignedToUserId', 'name email');

            if (!heldOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Held order not found',
                });
            }

            return res.status(200).json({
                success: true,
                data: heldOrder,
            });
        } catch (error: any) {
            console.error('Transfer held order error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to transfer held order',
            });
        }
    }

    /**
     * PUT /api/pos/held-orders/:id/resume
     * Mark held order as resumed
     */
    async resumeHeldOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = new mongoose.Types.ObjectId((req as any).user.id);
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            const heldOrder = await POSHeldOrder.findOneAndUpdate(
                { _id: id, storeId, status: 'held' },
                {
                    status: 'resumed',
                    resumedAt: new Date(),
                    resumedByUserId: userId,
                },
                { new: true }
            );

            if (!heldOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Held order not found',
                });
            }

            return res.status(200).json({
                success: true,
                data: heldOrder,
            });
        } catch (error: any) {
            console.error('Resume held order error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to resume held order',
            });
        }
    }

    /**
     * DELETE /api/pos/held-orders/:id
     * Delete held order (marks as cancelled)
     */
    async deleteHeldOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            const heldOrder = await POSHeldOrder.findOneAndUpdate(
                { _id: id, storeId, status: 'held' },
                { status: 'cancelled' },
                { new: true }
            );

            if (!heldOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Held order not found',
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Held order deleted successfully',
            });
        } catch (error: any) {
            console.error('Delete held order error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete held order',
            });
        }
    }

    /**
     * GET /api/pos/users
     * Get all POS users for current store (for transfer functionality)
     */
    async getPOSUsers(req: Request, res: Response) {
        try {
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            const users = await User.find({
                storeIds: { $in: [storeId] },
                role: { $in: ['pos_user', 'store_admin', 'super_admin'] },
                isActive: true,
            }).select('_id firstName lastName email role');
            return res.status(200).json({
                success: true,
                data: users,
            });
        } catch (error: any) {
            console.error('Get POS users error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get POS users',
            });
        }
    }

    /**
     * GET /api/pos/orders/search
     * Search orders for return
     */
    async searchOrders(req: Request, res: Response) {
        try {
            const { query } = req.query;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            if (!query || typeof query !== 'string' || query.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query must be at least 3 characters',
                });
            }

            // Search by order number, customer phone, email, or name
            const orders = await Order.find({
                storeId,
                $or: [
                    { orderNumber: { $regex: query, $options: 'i' } },
                    { 'shippingAddress.phone': { $regex: query, $options: 'i' } },
                    { 'shippingAddress.email': { $regex: query, $options: 'i' } },
                    { 'shippingAddress.firstName': { $regex: query, $options: 'i' } },
                    { 'shippingAddress.lastName': { $regex: query, $options: 'i' } },
                    { guestEmail: { $regex: query, $options: 'i' } },
                ],
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('customerId', 'firstName lastName email phone');

            return res.status(200).json({
                success: true,
                data: orders,
            });
        } catch (error: any) {
            console.error('Search orders error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to search orders',
            });
        }
    }

    /**
     * POST /api/pos/orders/calculate-refund
     * Calculate refund amount for return items
     */
    async calculateRefund(req: Request, res: Response) {
        try {
            const { orderId, items } = req.body;
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID and items are required',
                });
            }

            const result = await posService.calculateRefund(
                new mongoose.Types.ObjectId(orderId),
                storeId,
                items
            );

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to calculate refund',
            });
        }
    }

    /**
     * POST /api/pos/orders/return
     * Process order return
     */
    async processReturn(req: Request, res: Response) {
        try {
            const { orderId, items, refundAmount, refundMethod, reason, notes } = req.body;
            const userId = new mongoose.Types.ObjectId((req as any).user.id);
            const storeId = getStoreIdFromRequest(req);

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required',
                });
            }

            if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID and items are required',
                });
            }

            // Get current session for tracking refund
            const currentSession = await posService.getCurrentSession(storeId);
            if (!currentSession) {
                return res.status(400).json({
                    success: false,
                    message: 'No active POS session found. Please start a session to process returns.',
                });
            }

            const result = await posService.processReturn(
                new mongoose.Types.ObjectId(orderId),
                storeId,
                userId,
                currentSession._id,
                items,
                refundAmount,
                refundMethod,
                reason,
                notes
            );

            return res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Process return error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to process return',
            });
        }
    }
}
export default new POSController();
