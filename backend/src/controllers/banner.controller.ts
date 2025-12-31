import { Request, Response } from 'express';
import Banner from '../models/Banner';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/validation';

/**
 * @swagger
 * /api/banners:
 *   get:
 *     summary: Get all banners
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 */
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

/**
 * @swagger
 * /api/banners/{id}:
 *   get:
 *     summary: Get single banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner retrieved successfully
 *       404:
 *         description: Banner not found
 */
export const getBannerById = asyncHandler(async (req: Request, res: Response) => {
    const banner = await Banner.findById(req.params.id).populate('storeId', 'name');

    if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
    }

    res.json({ success: true, banner });
});

/**
 * @swagger
 * /api/banners:
 *   post:
 *     summary: Create banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, image]
 *             properties:
 *               title: { type: string }
 *               image: { type: string }
 *               link: { type: string }
 *               storeId: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Banner created successfully
 */
export const createBanner = asyncHandler(async (req: AuthRequest, res: Response) => {
    const bannerData = req.body;

    if (!bannerData.storeId && req.user?.storeId) {
        bannerData.storeId = req.user.storeId;
    }

    const banner = await Banner.create(bannerData);
    res.status(201).json({ success: true, banner });
});

/**
 * @swagger
 * /api/banners/{id}:
 *   put:
 *     summary: Update banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
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

/**
 * @swagger
 * /api/banners/{id}:
 *   delete:
 *     summary: Delete banner
 *     tags: [Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
        res.status(404).json({ success: false, message: 'Banner not found' });
        return;
    }

    res.json({ success: true, message: 'Banner deleted' });
});
