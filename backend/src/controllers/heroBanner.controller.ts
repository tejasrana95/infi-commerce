import { Request, Response } from 'express';
import HeroBanner from '../models/HeroBanner';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

// @desc    Get all hero banners
// @route   GET /api/hero-banners
// @access  Public / Private Admin
export const getHeroBanners = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 100, search } = req.query;
    const filter: any = {};

    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    } else if (req.user?.role === 'super_admin') {
        // Super admin can see all
    } else if (req.user?.storeIds?.length) {
        filter.storeId = req.user.storeIds[0];
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'title.text': { $regex: search, $options: 'i' } },
        ];
    }

    const [heroBanners, total] = await Promise.all([
        HeroBanner.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .populate('storeId', 'name')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        HeroBanner.countDocuments(filter),
    ]);

    res.json({
        success: true,
        count: heroBanners.length,
        heroBanners,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

// @desc    Get single hero banner
// @route   GET /api/hero-banners/:id
// @access  Public / Private Admin
export const getHeroBannerById = asyncHandler(async (req: Request, res: Response) => {
    const heroBanner = await HeroBanner.findById(req.params.id);

    if (!heroBanner) {
        res.status(404).json({ success: false, message: 'Hero Banner not found' });
        return;
    }

    res.json({ success: true, heroBanner });
});

// @desc    Create hero banner
// @route   POST /api/hero-banners
// @access  Private/Admin
export const createHeroBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = req.body;

    if (!data.storeId && req.user?.storeIds?.length) {
        data.storeId = req.user.storeIds[0];
    }

    if (data.order === undefined) {
        const count = await HeroBanner.countDocuments({ storeId: data.storeId });
        data.order = count;
    }

    const heroBanner = await HeroBanner.create(data);
    res.status(201).json({ success: true, heroBanner });
});

// @desc    Update hero banner
// @route   PUT /api/hero-banners/:id
// @access  Private/Admin
export const updateHeroBanner = asyncHandler(async (req: Request, res: Response) => {
    const heroBanner = await HeroBanner.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!heroBanner) {
        res.status(404).json({ success: false, message: 'Hero Banner not found' });
        return;
    }

    res.json({ success: true, heroBanner });
});

// @desc    Delete hero banner
// @route   DELETE /api/hero-banners/:id
// @access  Private/Admin
export const deleteHeroBanner = asyncHandler(async (req: Request, res: Response) => {
    const heroBanner = await HeroBanner.findByIdAndDelete(req.params.id);

    if (!heroBanner) {
        res.status(404).json({ success: false, message: 'Hero Banner not found' });
        return;
    }

    res.json({ success: true, message: 'Hero Banner deleted' });
});

// @desc    Reorder hero banners
// @route   PUT /api/hero-banners/reorder
// @access  Private/Admin
export const reorderHeroBanners = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body;

    if (!Array.isArray(items)) {
        res.status(400).json({ success: false, message: 'Items array required' });
        return;
    }

    for (const item of items) {
        await HeroBanner.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({ success: true, message: 'Hero Banners reordered' });
});
