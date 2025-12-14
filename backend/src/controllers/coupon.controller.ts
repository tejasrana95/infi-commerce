import { Response } from 'express';
import { body, param } from 'express-validator';
import Coupon from '../models/Coupon';
import Cart from '../models/Cart';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

/**
 * Validation rules
 */
export const createCouponValidation = [
    body('code').trim().notEmpty().withMessage('Coupon code is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('discountType').isIn(['flat', 'percentage']).withMessage('Discount type must be flat or percentage'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
    body('applyTo').isIn(['store', 'categories']).withMessage('Apply to must be store or categories'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
];

export const updateCouponValidation = [
    param('id').isMongoId().withMessage('Valid coupon ID is required'),
    body('discountType').optional().isIn(['flat', 'percentage']),
    body('discountValue').optional().isFloat({ min: 0 }),
    body('applyTo').optional().isIn(['store', 'categories']),
];

export const validateCouponValidation = [
    body('code').trim().notEmpty().withMessage('Coupon code is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
];

/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon (Admin/Store Admin only)
 * @access  Private
 */
export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        code,
        storeId,
        description,
        discountType,
        discountValue,
        applyTo,
        categoryIds,
        minCartValue,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        startDate,
        endDate,
        isActive,
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
        throw new AppError('Coupon code already exists', 400);
    }

    // Validate date range
    if (new Date(startDate) >= new Date(endDate)) {
        throw new AppError('End date must be after start date', 400);
    }

    // Validate category IDs if applyTo is 'categories'
    if (applyTo === 'categories' && (!categoryIds || categoryIds.length === 0)) {
        throw new AppError('Category IDs are required when applying to specific categories', 400);
    }

    // Create coupon
    const coupon = await Coupon.create({
        code: code.toUpperCase(),
        storeId,
        description,
        discountType,
        discountValue,
        applyTo,
        categoryIds: applyTo === 'categories' ? categoryIds : undefined,
        minCartValue,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        startDate,
        endDate,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon,
    });
});

/**
 * @route   GET /api/coupons
 * @desc    Get all coupons for a store (Admin/Store Admin only)
 * @access  Private
 */
export const getCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, isActive, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [coupons, total] = await Promise.all([
        Coupon.find(filter)
            .populate('categoryIds', 'title slug')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Coupon.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: coupons,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/coupons/:id
 * @desc    Get coupon by ID
 * @access  Private
 */
export const getCouponById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const coupon = await Coupon.findById(id).populate('categoryIds', 'title slug');

    if (!coupon) {
        throw new AppError('Coupon not found', 404);
    }

    res.json({
        success: true,
        data: coupon,
    });
});

/**
 * @route   PUT /api/coupons/:id
 * @desc    Update coupon
 * @access  Private (Admin/Store Admin)
 */
export const updateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating code or storeId
    delete updateData.code;
    delete updateData.storeId;
    delete updateData.usageCount;
    delete updateData.customerUsage;

    // Validate date range if both dates are provided
    if (updateData.startDate && updateData.endDate) {
        if (new Date(updateData.startDate) >= new Date(updateData.endDate)) {
            throw new AppError('End date must be after start date', 400);
        }
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).populate('categoryIds', 'title slug');

    if (!coupon) {
        throw new AppError('Coupon not found', 404);
    }

    res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon,
    });
});

/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete coupon
 * @access  Private (Admin/Store Admin)
 */
export const deleteCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
        throw new AppError('Coupon not found', 404);
    }

    res.json({
        success: true,
        message: 'Coupon deleted successfully',
    });
});

/**
 * @route   POST /api/coupons/validate
 * @desc    Validate a coupon code and calculate discount (Public)
 * @access  Public
 */
export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code, storeId, cartId } = req.body;
    const userId = req.user?.id;

    // Find coupon
    const coupon = await Coupon.findOne({
        code: code.toUpperCase(),
        storeId,
    }).populate('categoryIds', 'title slug');

    if (!coupon) {
        throw new AppError('Invalid coupon code', 404);
    }

    // Check if coupon is currently valid
    if (!coupon.isCurrentlyValid()) {
        throw new AppError('This coupon is no longer valid or has expired', 400);
    }

    // Check if customer can use coupon
    if (userId && !coupon.canCustomerUse(userId)) {
        throw new AppError('You have reached the usage limit for this coupon', 400);
    }

    // Get cart to calculate discount
    let cart;
    if (cartId) {
        cart = await Cart.findById(cartId).populate('items.productId');
    } else if (userId) {
        cart = await Cart.findOne({ userId, storeId }).populate('items.productId');
    }

    if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', 400);
    }

    // Check minimum cart value
    if (coupon.minCartValue && cart.subtotal < coupon.minCartValue) {
        throw new AppError(
            `Minimum cart value of ${coupon.minCartValue} required to use this coupon`,
            400
        );
    }

    // Calculate applicable amount based on coupon type
    let applicableAmount = 0;

    if (coupon.applyTo === 'store') {
        // Apply to entire cart
        applicableAmount = cart.subtotal;
    } else if (coupon.applyTo === 'categories') {
        // Apply only to products in specified categories
        for (const item of cart.items) {
            const product = item.productId as any;
            if (product && product.categoryIds) {
                const hasMatchingCategory = product.categoryIds.some((catId: any) =>
                    coupon.categoryIds?.some((couponCatId) => couponCatId.equals(catId))
                );
                if (hasMatchingCategory) {
                    applicableAmount += item.price * item.quantity;
                }
            }
        }
    }

    if (applicableAmount === 0) {
        throw new AppError('No items in cart are eligible for this coupon', 400);
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cart.subtotal, applicableAmount);

    res.json({
        success: true,
        message: 'Coupon is valid',
        data: {
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
            },
            applicableAmount,
            discountAmount,
            finalAmount: cart.subtotal - discountAmount,
        },
    });
});

/**
 * @route   POST /api/coupons/:id/apply
 * @desc    Apply coupon to cart (increments usage)
 * @access  Private
 */
export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
        throw new AppError('Coupon not found', 404);
    }

    // Check if coupon is valid
    if (!coupon.isCurrentlyValid()) {
        throw new AppError('This coupon is no longer valid or has expired', 400);
    }

    // Check if customer can use coupon
    if (userId && !coupon.canCustomerUse(userId)) {
        throw new AppError('You have reached the usage limit for this coupon', 400);
    }

    // Increment usage
    await coupon.incrementUsage(userId);

    res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: {
            usageCount: coupon.usageCount,
        },
    });
});

/**
 * @route   GET /api/coupons/store/:storeId/active
 * @desc    Get all active coupons for a store (Public - for display)
 * @access  Public
 */
export const getActiveCoupons = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;

    const now = new Date();

    const coupons = await Coupon.find({
        storeId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    })
        .select('code description discountType discountValue minCartValue startDate endDate')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: coupons,
    });
});
