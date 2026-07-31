import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getBannerSliders,
    getBannerSliderById,
    createBannerSlider,
    updateBannerSlider,
    deleteBannerSlider,
} from '../controllers/bannerSlider.controller';

const router = express.Router();

/**
 * @swagger
 * /api/banner-sliders:
 *   get:
 *     summary: Get all banner sliders
 *     tags: [Banner Sliders]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of banner sliders
 *   post:
 *     summary: Create a new banner slider
 *     tags: [Banner Sliders]
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
 *         description: Banner slider created successfully
 */
router.get('/', getBannerSliders);

/**
 * @swagger
 * /api/banner-sliders/{id}:
 *   get:
 *     summary: Get banner slider by ID
 *     tags: [Banner Sliders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner slider details
 *       404:
 *         description: Banner slider not found
 *   put:
 *     summary: Update banner slider by ID
 *     tags: [Banner Sliders]
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
 *         description: Banner slider updated successfully
 *   delete:
 *     summary: Delete banner slider by ID
 *     tags: [Banner Sliders]
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
 *         description: Banner slider deleted successfully
 */
router.get('/:id', getBannerSliderById);

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'super_admin'), createBannerSlider);

router
    .route('/:id')
    .put(authorize('admin', 'super_admin'), updateBannerSlider)
    .delete(authorize('admin', 'super_admin'), deleteBannerSlider);

export default router;
