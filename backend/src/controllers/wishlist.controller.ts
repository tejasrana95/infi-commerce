import { Response } from 'express';
import Customer from '../models/Customer';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get current user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await Customer.findById(req.user!.id)
        .populate({
            path: 'wishlist',
            select: 'name slug price salePrice images stock stockStatus isActive',
        });

    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Filter out any null products (deleted products)
    const wishlistItems = customer.wishlist.filter(item => item !== null);

    res.json({
        wishlist: wishlistItems,
        count: wishlistItems.length,
    });
});

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product added to wishlist
 */
export const addToWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Check if already in wishlist
    const isInWishlist = customer.wishlist.some(
        (id) => id.toString() === productId
    );

    if (isInWishlist) {
        res.json({ message: 'Product already in wishlist', inWishlist: true });
        return;
    }

    // Add to wishlist
    customer.wishlist.push(product._id);
    await customer.save();

    res.json({
        message: 'Product added to wishlist',
        inWishlist: true,
        wishlistCount: customer.wishlist.length,
    });
});

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 */
export const removeFromWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    // Remove from wishlist
    customer.wishlist = customer.wishlist.filter(
        (id) => id.toString() !== productId
    );
    await customer.save();

    res.json({
        message: 'Product removed from wishlist',
        inWishlist: false,
        wishlistCount: customer.wishlist.length,
    });
});

/**
 * @swagger
 * /api/wishlist/{productId}/check:
 *   get:
 *     summary: Check if product is in wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist status
 */
export const checkWishlistStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;

    const customer = await Customer.findById(req.user!.id);
    if (!customer) {
        throw new AppError('Customer not found', 404);
    }

    const inWishlist = customer.wishlist.some(
        (id) => id.toString() === productId
    );

    res.json({ inWishlist });
});
