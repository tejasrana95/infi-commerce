import express from 'express';
import {
    getHeroSliders,
    getHeroSliderById,
    createHeroSlider,
    updateHeroSlider,
    deleteHeroSlider
} from '../controllers/heroSlider.controller';
import { authenticate, authorize } from '../middleware/auth';
import { optionalApiKeyAuth } from '../middleware/apiKeyAuth';

const router = express.Router();

/**
 * @swagger
 * /api/hero-sliders:
 *   get:
 *     summary: Get all hero sliders
 *     tags: [Hero Sliders]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of hero sliders
 */
router.get('/', optionalApiKeyAuth, getHeroSliders);

/**
 * @swagger
 * /api/hero-sliders/{id}:
 *   get:
 *     summary: Get hero slider by ID
 *     tags: [Hero Sliders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hero slider details
 *       404:
 *         description: Hero slider not found
 */
router.get('/:id', optionalApiKeyAuth, getHeroSliderById);

/**
 * @swagger
 * /api/hero-sliders:
 *   post:
 *     summary: Create a new hero slider
 *     tags: [Hero Sliders]
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
 *         description: Hero slider created successfully
 */
router.post('/', authenticate, authorize('admin', 'store_admin', 'super_admin'), createHeroSlider);

/**
 * @swagger
 * /api/hero-sliders/{id}:
 *   put:
 *     summary: Update hero slider by ID
 *     tags: [Hero Sliders]
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
 *         description: Hero slider updated successfully
 */
router.put('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), updateHeroSlider);

/**
 * @swagger
 * /api/hero-sliders/{id}:
 *   delete:
 *     summary: Delete hero slider by ID
 *     tags: [Hero Sliders]
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
 *         description: Hero slider deleted successfully
 */
router.delete('/:id', authenticate, authorize('admin', 'store_admin', 'super_admin'), deleteHeroSlider);

export default router;
