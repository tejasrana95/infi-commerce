

import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getTestimonials,
    getTestimonialById,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    reorderTestimonials,
} from '../controllers/testimonial.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Testimonial
 *   description: Testimonial management
 */

// Public routes

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all testimonials
 *     tags: [Testimonial]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of testimonials
 *       500:
 *         description: Server error
 */
router.get('/', getTestimonials);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   get:
 *     summary: Get testimonial by ID
 *     tags: [Testimonial]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonial details
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getTestimonialById);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create new testimonial (Admin)
 *     tags: [Testimonial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - content
 *               - rating
 *               - storeId
 *             properties:
 *               customerName:
 *                 type: string
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *               storeId:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Testimonial created
 *       500:
 *         description: Server error
 */
router.post('/', authorize('admin', 'super_admin'), createTestimonial);

/**
 * @swagger
 * /api/testimonials/reorder:
 *   put:
 *     summary: Reorder testimonials (Admin)
 *     tags: [Testimonial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Testimonials reordered
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.put('/reorder', authorize('admin', 'super_admin'), reorderTestimonials);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update testimonial (Admin)
 *     tags: [Testimonial]
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
 *             properties:
 *               customerName:
 *                 type: string
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Testimonial updated
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authorize('admin', 'super_admin'), updateTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete testimonial (Admin)
 *     tags: [Testimonial]
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
 *         description: Testimonial deleted
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authorize('admin', 'super_admin'), deleteTestimonial);

export default router;
