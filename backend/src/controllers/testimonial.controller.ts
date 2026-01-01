import { Request, Response } from 'express';
import Testimonial from '../models/Testimonial';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

// @desc    Get all testimonials
// @route   GET /api/testimonials
// @access  Private/Admin
export const getTestimonials = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search } = req.query;
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

    if (search) {
        filter.$or = [
            { customerName: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
        ];
    }

    const [testimonials, total] = await Promise.all([
        Testimonial.find(filter)
            .populate('storeId', 'name')
            .sort({ order: 1, createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        Testimonial.countDocuments(filter),
    ]);

    res.json({
        success: true,
        count: testimonials.length,
        testimonials,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Private/Admin
export const getTestimonialById = asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await Testimonial.findById(req.params.id).populate('storeId', 'name');

    if (!testimonial) {
        res.status(404).json({ success: false, message: 'Testimonial not found' });
        return;
    }

    res.json({ success: true, testimonial });
});

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private/Admin
export const createTestimonial = asyncHandler(async (req: AuthRequest, res: Response) => {
    const testimonialData = req.body;

    if (!testimonialData.storeId && req.user?.storeIds?.length) {
        testimonialData.storeId = req.user.storeIds[0];
    }

    // Auto-assign order if not provided
    if (testimonialData.order === undefined) {
        const count = await Testimonial.countDocuments({ storeId: testimonialData.storeId });
        testimonialData.order = count;
    }

    const testimonial = await Testimonial.create(testimonialData);
    res.status(201).json({ success: true, testimonial });
});

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private/Admin
export const updateTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await Testimonial.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!testimonial) {
        res.status(404).json({ success: false, message: 'Testimonial not found' });
        return;
    }

    res.json({ success: true, testimonial });
});

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
export const deleteTestimonial = asyncHandler(async (req: Request, res: Response) => {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
        res.status(404).json({ success: false, message: 'Testimonial not found' });
        return;
    }

    res.json({ success: true, message: 'Testimonial deleted' });
});

// @desc    Reorder testimonials
// @route   PUT /api/testimonials/reorder
// @access  Private/Admin
export const reorderTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body; // [{ id: 'xxx', order: 0 }, ...]

    if (!Array.isArray(items)) {
        res.status(400).json({ success: false, message: 'Items array required' });
        return;
    }

    // Update order for each testimonial
    for (const item of items) {
        await Testimonial.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({ success: true, message: 'Testimonials reordered' });
});

