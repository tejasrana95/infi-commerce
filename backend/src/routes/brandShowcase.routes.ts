import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getBrandShowcases,
    getBrandShowcaseById,
    createBrandShowcase,
    updateBrandShowcase,
    deleteBrandShowcase,
} from '../controllers/brandShowcase.controller';

const router = express.Router();

/**
 * @swagger
 * /api/brand-showcases:
 *   get:
 *     summary: Get all brand showcases
 *     tags: [Brand Showcases]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of brand showcases
 *   post:
 *     summary: Create a new brand showcase
 *     tags: [Brand Showcases]
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
 *         description: Brand showcase created successfully
 */
router.get('/', getBrandShowcases);

/**
 * @swagger
 * /api/brand-showcases/{id}:
 *   get:
 *     summary: Get brand showcase by ID
 *     tags: [Brand Showcases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand showcase details
 *       404:
 *         description: Brand showcase not found
 *   put:
 *     summary: Update brand showcase by ID
 *     tags: [Brand Showcases]
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
 *         description: Brand showcase updated successfully
 *   delete:
 *     summary: Delete brand showcase by ID
 *     tags: [Brand Showcases]
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
 *         description: Brand showcase deleted successfully
 */
router.get('/:id', getBrandShowcaseById);

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'super_admin'), createBrandShowcase);

router
    .route('/:id')
    .put(authorize('admin', 'super_admin'), updateBrandShowcase)
    .delete(authorize('admin', 'super_admin'), deleteBrandShowcase);

export default router;
