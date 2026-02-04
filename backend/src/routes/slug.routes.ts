
import express from 'express';
import * as slugController from '../controllers/slug.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Slug
 *   description: Slug resolution (URL handling)
 */

// Public routes (no auth required for resolution)

/**
 * @swagger
 * /api/slug/resolve/{storeId}/{slug}:
 *   get:
 *     summary: Resolve a slug to an entity (product, category, etc.)
 *     tags: [Slug]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resolved entity data or redirect
 *       404:
 *         description: Slug not found
 *       500:
 *         description: Server error
 */
router.get('/resolve/:storeId/:slug', slugController.resolveSlug);

// Check availability (useful for admin UI)

/**
 * @swagger
 * /api/slug/check/{storeId}/{slug}:
 *   get:
 *     summary: Check if a slug is available
 *     tags: [Slug]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, category, page]
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *           description: Current entity ID (to ignore self)
 *     responses:
 *       200:
 *         description: Slug availability status
 *       400:
 *         description: Invalid type or missing data
 *       500:
 *         description: Server error
 */
router.get('/check/:storeId/:slug', slugController.checkSlugAvailability);

export default router;
