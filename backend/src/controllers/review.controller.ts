import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import Review from '../models/Review';
import Product from '../models/Product';
import Order from '../models/Order';
import Store from '../models/Store';

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isApproved
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 */
export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId,
        productId,
        customerId,
        isApproved,
        isGuestReview,
        rating,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (productId) filter.productId = productId;
    if (customerId) filter.customerId = customerId;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (isGuestReview !== undefined) filter.isGuestReview = isGuestReview === 'true';
    if (rating) filter.rating = parseInt(rating as string);

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
            { guestName: { $regex: search, $options: 'i' } },
            { guestEmail: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('storeId', 'name')
            .populate('productId', 'name sku images')
            .populate('customerId', 'firstName lastName email')
            .populate('adminReply.repliedBy', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit as string)),
        Review.countDocuments(filter),
    ]);

    res.json({
        success: true,
        reviews,
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review retrieved successfully
 *       404:
 *         description: Review not found
 */
export const getReviewById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const review = await Review.findById(id)
        .populate('storeId', 'name')
        .populate('productId', 'name sku images price')
        .populate('customerId', 'firstName lastName email phone')
        .populate('adminReply.repliedBy', 'name email');

    if (!review) {
        throw new AppError('Review not found', 404);
    }

    res.json({
        success: true,
        review,
    });
});

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - productId
 *               - rating
 *               - title
 *               - content
 *     responses:
 *       201:
 *         description: Review created successfully
 */
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId,
        productId,
        customerId,
        isGuestReview,
        guestName,
        guestEmail,
        guestEmailVerified,
        rating,
        title,
        content,
        images,
        isApproved,
        isVerifiedPurchase,
    } = req.body;

    // Validate store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Validate product exists and belongs to store
    const product = await Product.findOne({ _id: productId, storeId });
    if (!product) {
        throw new AppError('Product not found in this store', 404);
    }

    // Check store review settings
    const reviewSettings = store.settings?.reviewSettings || {};
    if (!reviewSettings.allowReviews) {
        throw new AppError('Reviews are disabled for this store', 400);
    }
    if (isGuestReview && !reviewSettings.allowGuestReviews) {
        throw new AppError('Guest reviews are not allowed for this store', 400);
    }

    // If customer review, check if already reviewed
    if (!isGuestReview && customerId) {
        const existingReview = await Review.findOne({ productId, customerId });
        if (existingReview) {
            throw new AppError('Customer has already reviewed this product', 400);
        }

        // Check if verified purchase
        if (isVerifiedPurchase === undefined) {
            const order = await Order.findOne({
                customerId,
                'items.productId': productId,
                status: { $in: ['delivered', 'completed'] },
            });
            req.body.isVerifiedPurchase = !!order;
        }
    }

    const review = await Review.create({
        storeId,
        productId,
        customerId: isGuestReview ? null : customerId,
        isGuestReview,
        guestName: isGuestReview ? guestName : undefined,
        guestEmail: isGuestReview ? guestEmail : undefined,
        guestEmailVerified: isGuestReview ? guestEmailVerified || false : false,
        rating,
        title,
        content,
        images: images || [],
        isApproved: isApproved || !reviewSettings.requireApproval,
        isVerifiedPurchase: req.body.isVerifiedPurchase || false,
    });

    const populatedReview = await Review.findById(review._id)
        .populate('storeId', 'name')
        .populate('productId', 'name sku images')
        .populate('customerId', 'firstName lastName email');

    res.status(201).json({
        success: true,
        message: 'Review created successfully',
        review: populatedReview,
    });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const {
        rating,
        title,
        content,
        images,
        isApproved,
        isVerifiedPurchase,
        guestEmailVerified,
    } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;
    if (images !== undefined) review.images = images;
    if (isApproved !== undefined) review.isApproved = isApproved;
    if (isVerifiedPurchase !== undefined) review.isVerifiedPurchase = isVerifiedPurchase;
    if (guestEmailVerified !== undefined && review.isGuestReview) {
        review.guestEmailVerified = guestEmailVerified;
    }

    await review.save();

    const updatedReview = await Review.findById(id)
        .populate('storeId', 'name')
        .populate('productId', 'name sku images')
        .populate('customerId', 'firstName lastName email');

    res.json({
        success: true,
        message: 'Review updated successfully',
        review: updatedReview,
    });
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 */
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    res.json({
        success: true,
        message: 'Review deleted successfully',
    });
});

/**
 * @swagger
 * /api/reviews/{id}/status:
 *   put:
 *     summary: Approve or reject a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review status updated successfully
 */
export const updateReviewStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findById(id);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    review.isApproved = isApproved;
    await review.save();

    res.json({
        success: true,
        message: `Review ${isApproved ? 'approved' : 'rejected'} successfully`,
        review,
    });
});

/**
 * @swagger
 * /api/reviews/{id}/reply:
 *   post:
 *     summary: Add admin reply
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply added successfully
 */
export const addAdminReply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
        throw new AppError('Reply content is required', 400);
    }

    const review = await Review.findById(id);
    if (!review) {
        throw new AppError('Review not found', 404);
    }

    review.adminReply = {
        content: content.trim(),
        repliedAt: new Date(),
        repliedBy: mongoose.Types.ObjectId.createFromHexString(req.user!.id),
    };
    await review.save();

    const updatedReview = await Review.findById(id)
        .populate('storeId', 'name')
        .populate('productId', 'name sku images')
        .populate('customerId', 'firstName lastName email')
        .populate('adminReply.repliedBy', 'name email');

    res.json({
        success: true,
        message: 'Reply added successfully',
        review: updatedReview,
    });
});

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get reviews for a product (Public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 */
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = {
        productId,
        isApproved: true,
    };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
        Review.find(filter)
            .populate('customerId', 'firstName lastName')
            .select('-guestEmail -adminReply.repliedBy')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit as string)),
        Review.countDocuments(filter),
    ]);

    // Calculate average rating
    const ratingAgg = await Review.aggregate([
        { $match: { productId: require('mongoose').Types.ObjectId.createFromHexString(productId), isApproved: true } },
        {
            $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                count: { $sum: 1 },
                ratings: {
                    $push: '$rating',
                },
            },
        },
    ]);

    const stats = ratingAgg[0] || { avgRating: 0, count: 0 };

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (stats.ratings) {
        stats.ratings.forEach((r: number) => {
            ratingDistribution[r as keyof typeof ratingDistribution]++;
        });
    }

    res.json({
        success: true,
        reviews,
        stats: {
            averageRating: parseFloat((stats.avgRating || 0).toFixed(1)),
            totalReviews: stats.count,
            ratingDistribution,
        },
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
        },
    });
});

/**
 * @swagger
 * /api/reviews/stats/{storeId}:
 *   get:
 *     summary: Get review statistics for a store
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review statistics retrieved successfully
 */
export const getReviewStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;

    const stats = await Review.aggregate([
        { $match: { storeId: require('mongoose').Types.ObjectId.createFromHexString(storeId) } },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' },
                approvedCount: {
                    $sum: { $cond: ['$isApproved', 1, 0] },
                },
                pendingCount: {
                    $sum: { $cond: ['$isApproved', 0, 1] },
                },
                guestCount: {
                    $sum: { $cond: ['$isGuestReview', 1, 0] },
                },
                verifiedPurchaseCount: {
                    $sum: { $cond: ['$isVerifiedPurchase', 1, 0] },
                },
            },
        },
    ]);

    res.json({
        success: true,
        stats: stats[0] || {
            totalReviews: 0,
            avgRating: 0,
            approvedCount: 0,
            pendingCount: 0,
            guestCount: 0,
            verifiedPurchaseCount: 0,
        },
    });
});
