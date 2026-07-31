import express from 'express';
import {
    getHeroBanners,
    getHeroBannerById,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    reorderHeroBanners
} from '../controllers/heroBanner.controller';
import { authenticate, authorize } from '../middleware/auth';
import { optionalApiKeyAuth } from '../middleware/apiKeyAuth';

const router = express.Router();

/**
 * @swagger
 * /api/hero-banners:
 *   get:
 *     summary: Get all hero banners
 *     tags: [Hero Banners]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of hero banners
 */
router.get('/', optionalApiKeyAuth, getHeroBanners);

/**
 * @swagger
 * /api/hero-banners/{id}:
 *   get:
 *     summary: Get hero banner by ID
 *     tags: [Hero Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hero banner details
 *       404:
 *         description: Hero banner not found
 */
router.get('/:id', optionalApiKeyAuth, getHeroBannerById);

/**
 * @swagger
 * /api/hero-banners:
 *   post:
 *     summary: Create a new hero banner
 *     tags: [Hero Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Hero banner created successfully
 */
router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), createHeroBanner);

/**
 * @swagger
 * /api/hero-banners/reorder:
 *   put:
 *     summary: Reorder hero banners
 *     tags: [Hero Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Hero banners reordered successfully
 */
router.put('/reorder', authenticate, authorize('admin', 'store_admin', 'super_admin'), reorderHeroBanners);

/**
 * @swagger
 * /api/hero-banners/{id}:
 *   put:
 *     summary: Update hero banner by ID
 *     tags: [Hero Banners]
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
 *         description: Hero banner updated successfully
 */
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateHeroBanner);

/**
 * @swagger
 * /api/hero-banners/{id}:
 *   delete:
 *     summary: Delete hero banner by ID
 *     tags: [Hero Banners]
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
 *         description: Hero banner deleted successfully
 */
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteHeroBanner);

export default router;
