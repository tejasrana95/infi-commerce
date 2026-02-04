import { Router } from 'express';
import { auth, checkRole } from '../middleware/auth';
import {
    subscribe,
    getSubscribers,
    deleteSubscriber,
    deleteAllSubscribers,
    exportSubscribers,
    subscribeValidation,
} from '../controllers/newsletter.controller';
import { validate } from '../middleware/validation';
import { publicSubmissionLimiter } from '../middleware/rateLimit';
import { honeypot } from '../middleware/honeypot';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Newsletter
 *   description: Newsletter subscription management
 */

// Public route

/**
 * @swagger
 * /api/newsletter/subscribe:
 *   post:
 *     summary: Subscribe to newsletter
 *     tags: [Newsletter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - storeId
 *             properties:
 *               email:
 *                 type: string
 *               storeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscribed successfully
 *       200:
 *         description: Already subscribed
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/subscribe', publicSubmissionLimiter, honeypot('_newsletter_trap'), validate(subscribeValidation), subscribe);

// Admin routes

/**
 * @swagger
 * /api/newsletter:
 *   get:
 *     summary: Get all subscribers (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
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
 *           default: 50
 *     responses:
 *       200:
 *         description: List of subscribers
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', auth, checkRole('admin', 'super_admin'), getSubscribers);

/**
 * @swagger
 * /api/newsletter/export:
 *   get:
 *     summary: Export subscribers to CSV (Admin only)
 *     tags: [Newsletter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/export', auth, checkRole('admin', 'super_admin'), exportSubscribers);

/**
 * @swagger
 * /api/newsletter/{id}:
 *   delete:
 *     summary: Delete a subscriber (Admin only)
 *     tags: [Newsletter]
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
 *         description: Subscriber deleted successfully
 *       404:
 *         description: Subscriber not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, checkRole('admin', 'super_admin'), deleteSubscriber);

/**
 * @swagger
 * /api/newsletter/bulk/delete-all:
 *   delete:
 *     summary: Delete all subscribers for a store (Admin only)
 *     tags: [Newsletter]
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
 *             properties:
 *               storeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: All subscribers deleted successfully
 *       400:
 *         description: Missing storeId
 *       500:
 *         description: Server error
 */
router.delete('/bulk/delete-all', auth, checkRole('admin', 'super_admin'), deleteAllSubscribers);

export default router;
