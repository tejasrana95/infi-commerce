import { Request, Response } from 'express';
import BannerSlider from '../models/BannerSlider';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

// @desc    Get all banner sliders
// @route   GET /api/banner-sliders
// @access  Private/Admin
export const getBannerSliders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    } else if (req.user?.role === 'super_admin') {
        // Super admin can see all
    } else if (req.user?.storeIds?.length) {
        filter.storeId = req.user.storeIds[0];
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const [sliders, total] = await Promise.all([
        BannerSlider.find(filter)
            .populate('storeId', 'name slug')
            .populate('slides.bannerId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        BannerSlider.countDocuments(filter)
    ]);

    res.json({
        success: true,
        sliders,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Get single banner slider
// @route   GET /api/banner-sliders/:id
// @access  Private/Admin
export const getBannerSliderById = asyncHandler(async (req: Request, res: Response) => {
    const slider = await BannerSlider.findById(req.params.id)
        .populate('storeId', 'name')
        .populate('slides.bannerId');

    if (!slider) {
        res.status(404).json({ success: false, message: 'Banner slider not found' });
        return;
    }

    res.json({ success: true, slider });
});

// @desc    Create banner slider
// @route   POST /api/banner-sliders
// @access  Private/Admin
export const createBannerSlider = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sliderData = req.body;

    if (!sliderData.storeId && req.user?.storeIds?.length) {
        sliderData.storeId = req.user.storeIds[0];
    }

    const slider = await BannerSlider.create(sliderData);
    res.status(201).json({ success: true, slider });
});

// @desc    Update banner slider
// @route   PUT /api/banner-sliders/:id
// @access  Private/Admin
export const updateBannerSlider = asyncHandler(async (req: Request, res: Response) => {
    const slider = await BannerSlider.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!slider) {
        res.status(404).json({ success: false, message: 'Banner slider not found' });
        return;
    }

    res.json({ success: true, slider });
});

// @desc    Delete banner slider
// @route   DELETE /api/banner-sliders/:id
// @access  Private/Admin
export const deleteBannerSlider = asyncHandler(async (req: Request, res: Response) => {
    const slider = await BannerSlider.findByIdAndDelete(req.params.id);

    if (!slider) {
        res.status(404).json({ success: false, message: 'Banner slider not found' });
        return;
    }

    res.json({ success: true, message: 'Banner slider deleted' });
});
