import { Request, Response } from 'express';
import Banner from '../models/Banner';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

// @desc    Get all banners
// @route   GET /api/banners
// @access  Private/Admin
export const getBanners = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    } else if (req.user?.role === 'super_admin') {
        // Super admin can see all
    } else if (req.user?.storeId) {
        filter.storeId = req.user.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    const banners = await Banner.find(filter)
        .populate('storeId', 'name')
        .sort({ createdAt: -1 });

    res.json({ success: true, count: banners.length, banners });
});

// @desc    Get single banner
// @route   GET /api/banners/:id
// @access  Private/Admin
export const getBannerById = asyncHandler(async (req: Request, res: Response) => {
    const banner = await Banner.findById(req.params.id).populate('storeId', 'name');

    if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
    }

    res.json({ success: true, banner });
});

// @desc    Create banner
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bannerData = req.body;

    if (!bannerData.storeId && req.user?.storeId) {
        bannerData.storeId = req.user.storeId;
    }

    const banner = await Banner.create(bannerData);
    res.status(201).json({ success: true, banner });
});

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await Banner.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
    }

    res.json({ success: true, banner });
});

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
    }

    res.json({ success: true, message: 'Banner deleted' });
});
