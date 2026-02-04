
import express from 'express';
import * as redirectionController from '../controllers/redirection.controller';
import { isSuperAdmin } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Redirection
 *   description: URL Redirection management (Super Admin only)
 */

// Super admin routes for CRUD operations

/**
 * @swagger
 * /api/redirections:
 *   get:
 *     summary: Get all redirections
 *     tags: [Redirection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
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
 *     responses:
 *       200:
 *         description: List of redirections
 *       500:
 *         description: Server error
 */
router.get('/', isSuperAdmin, redirectionController.getRedirections);

/**
 * @swagger
 * /api/redirections/{id}:
 *   get:
 *     summary: Get redirection by ID
 *     tags: [Redirection]
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
 *         description: Redirection details
 *       404:
 *         description: Redirection not found
 *       500:
 *         description: Server error
 */
router.get('/:id', isSuperAdmin, redirectionController.getRedirectionById);

/**
 * @swagger
 * /api/redirections:
 *   post:
 *     summary: Create new redirection
 *     tags: [Redirection]
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
 *               - origin_url
 *               - destination_url
 *             properties:
 *               storeId:
 *                 type: string
 *               origin_url:
 *                 type: string
 *               destination_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: Redirection created
 *       400:
 *         description: Validation error or duplicate
 *       500:
 *         description: Server error
 */
router.post('/', isSuperAdmin, redirectionController.createRedirection);

/**
 * @swagger
 * /api/redirections/{id}:
 *   put:
 *     summary: Update redirection
 *     tags: [Redirection]
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
 *               storeId:
 *                 type: string
 *               origin_url:
 *                 type: string
 *               destination_url:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Redirection updated
 *       404:
 *         description: Redirection not found
 *       500:
 *         description: Server error
 */
router.put('/:id', isSuperAdmin, redirectionController.updateRedirection);

/**
 * @swagger
 * /api/redirections/{id}:
 *   delete:
 *     summary: Delete redirection
 *     tags: [Redirection]
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
 *         description: Redirection deleted
 *       404:
 *         description: Redirection not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', isSuperAdmin, redirectionController.deleteRedirection);

// Public route for checking redirections (used by frontend)

/**
 * @swagger
 * /api/redirections/check/{storeId}/{url}:
 *   get:
 *     summary: Check if URL has active redirection
 *     tags: [Redirection]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Redirection status
 *       500:
 *         description: Server error
 */
router.get('/check/:storeId/:url(*)', redirectionController.checkRedirection);

export default router;
