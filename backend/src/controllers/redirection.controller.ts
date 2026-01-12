import { Request, Response } from 'express';
import Redirection from '../models/Redirection';
import mongoose from 'mongoose';

/**
 * Get all redirections with filtering and pagination
 * @route GET /api/redirections
 * @access Super Admin only
 */
export const getRedirections = async (req: Request, res: Response) => {
    try {
        const { storeId, status, search, page = 1, limit = 20 } = req.query;

        const filter: any = {};

        if (storeId) {
            filter.storeId = new mongoose.Types.ObjectId(storeId as string);
        }

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { origin_url: { $regex: search, $options: 'i' } },
                { destination_url: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [redirections, total] = await Promise.all([
            Redirection.find(filter)
                .populate('storeId', 'name')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Redirection.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            data: redirections,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error: any) {
        console.error('Error fetching redirections:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get single redirection by ID
 * @route GET /api/redirections/:id
 * @access Super Admin only
 */
export const getRedirectionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const redirection = await Redirection.findById(id)
            .populate('storeId', 'name')
            .populate('createdBy', 'name email');

        if (!redirection) {
            return res.status(404).json({ success: false, message: 'Redirection not found' });
        }

        return res.json({ success: true, data: redirection });
    } catch (error: any) {
        console.error('Error fetching redirection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Create new redirection
 * @route POST /api/redirections
 * @access Super Admin only
 */
export const createRedirection = async (req: Request, res: Response) => {
    try {
        const { storeId, origin_url, destination_url, status } = req.body;

        // Validate required fields
        if (!storeId || !origin_url || !destination_url) {
            return res.status(400).json({
                success: false,
                message: 'storeId, origin_url, and destination_url are required'
            });
        }

        // Validate origin_url is relative
        if (!origin_url.startsWith('/')) {
            return res.status(400).json({
                success: false,
                message: 'origin_url must be a relative URL starting with /'
            });
        }

        // Check for existing redirection with same origin_url
        const existing = await Redirection.findOne({
            storeId: new mongoose.Types.ObjectId(storeId),
            origin_url: origin_url.toLowerCase().trim()
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'A redirection with this origin URL already exists for this store'
            });
        }

        const redirection = new Redirection({
            storeId,
            origin_url,
            destination_url,
            status: status || 'active',
            createdBy: (req as any).user?.userId
        });

        await redirection.save();

        return res.status(201).json({
            success: true,
            message: 'Redirection created successfully',
            data: redirection
        });
    } catch (error: any) {
        console.error('Error creating redirection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update existing redirection
 * @route PUT /api/redirections/:id
 * @access Super Admin only
 */
export const updateRedirection = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { storeId, origin_url, destination_url, status } = req.body;

        const redirection = await Redirection.findById(id);

        if (!redirection) {
            return res.status(404).json({ success: false, message: 'Redirection not found' });
        }

        // Validate origin_url if provided
        if (origin_url && !origin_url.startsWith('/')) {
            return res.status(400).json({
                success: false,
                message: 'origin_url must be a relative URL starting with /'
            });
        }

        // Check for duplicate if origin_url or storeId is being changed
        if (origin_url || storeId) {
            const checkOrigin = origin_url || redirection.origin_url;
            const checkStoreId = storeId || redirection.storeId;

            const existing = await Redirection.findOne({
                _id: { $ne: id },
                storeId: new mongoose.Types.ObjectId(checkStoreId),
                origin_url: checkOrigin.toLowerCase().trim()
            });

            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'A redirection with this origin URL already exists for this store'
                });
            }
        }

        // Update fields
        if (storeId) redirection.storeId = storeId;
        if (origin_url) redirection.origin_url = origin_url;
        if (destination_url) redirection.destination_url = destination_url;
        if (status) redirection.status = status;

        await redirection.save();

        return res.json({
            success: true,
            message: 'Redirection updated successfully',
            data: redirection
        });
    } catch (error: any) {
        console.error('Error updating redirection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete redirection
 * @route DELETE /api/redirections/:id
 * @access Super Admin only
 */
export const deleteRedirection = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const redirection = await Redirection.findByIdAndDelete(id);

        if (!redirection) {
            return res.status(404).json({ success: false, message: 'Redirection not found' });
        }

        return res.json({
            success: true,
            message: 'Redirection deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting redirection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Check if URL has an active redirection (public endpoint for frontend)
 * @route GET /api/redirections/check/:storeId/:url
 * @access Public
 */
export const checkRedirection = async (req: Request, res: Response) => {
    try {
        const { storeId, url } = req.params;

        // Normalize URL: ensure it starts with / and remove trailing slash
        let normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        normalizedUrl = normalizedUrl.endsWith('/') && normalizedUrl.length > 1
            ? normalizedUrl.slice(0, -1)
            : normalizedUrl;

        const redirection = await Redirection.findOne({
            storeId: new mongoose.Types.ObjectId(storeId),
            origin_url: normalizedUrl.toLowerCase(),
            status: 'active'
        });

        if (redirection) {
            return res.json({
                success: true,
                redirect: true,
                destination_url: redirection.destination_url
            });
        }

        return res.json({
            success: true,
            redirect: false
        });
    } catch (error: any) {
        console.error('Error checking redirection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
