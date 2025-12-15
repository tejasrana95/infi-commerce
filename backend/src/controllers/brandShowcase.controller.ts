import { Request, Response } from 'express';
import BrandShowcase from '../models/BrandShowcase';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

// @desc    Get all brand showcases
// @route   GET /api/brand-showcases
// @access  Private/Admin
export const getBrandShowcases = asyncHandler(async (req: AuthRequest, res: Response) => {
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

    const showcases = await BrandShowcase.find(filter)
        .populate('storeId', 'name')
        .sort({ createdAt: -1 });

    res.json({ success: true, count: showcases.length, showcases });
});

// @desc    Get single brand showcase
// @route   GET /api/brand-showcases/:id
// @access  Private/Admin
export const getBrandShowcaseById = asyncHandler(async (req: Request, res: Response) => {
    const showcase = await BrandShowcase.findById(req.params.id).populate('storeId', 'name');

    if (!showcase) {
        res.status(404).json({ success: false, message: 'Brand showcase not found' });
        return;
    }

    res.json({ success: true, showcase });
});

// @desc    Create brand showcase
// @route   POST /api/brand-showcases
// @access  Private/Admin
export const createBrandShowcase = asyncHandler(async (req: AuthRequest, res: Response) => {
    const showcaseData = req.body;

    if (!showcaseData.storeId && req.user?.storeId) {
        showcaseData.storeId = req.user.storeId;
    }

    const showcase = await BrandShowcase.create(showcaseData);
    res.status(201).json({ success: true, showcase });
});

// @desc    Update brand showcase
// @route   PUT /api/brand-showcases/:id
// @access  Private/Admin
export const updateBrandShowcase = asyncHandler(async (req: Request, res: Response) => {
    const showcase = await BrandShowcase.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!showcase) {
        res.status(404).json({ success: false, message: 'Brand showcase not found' });
        return;
    }

    res.json({ success: true, showcase });
});

// @desc    Delete brand showcase
// @route   DELETE /api/brand-showcases/:id
// @access  Private/Admin
export const deleteBrandShowcase = asyncHandler(async (req: Request, res: Response) => {
    const showcase = await BrandShowcase.findByIdAndDelete(req.params.id);

    if (!showcase) {
        res.status(404).json({ success: false, message: 'Brand showcase not found' });
        return;
    }

    res.json({ success: true, message: 'Brand showcase deleted' });
});
