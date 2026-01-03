import express from 'express';
import { optionalAuth } from '../middleware/auth';
import {
    trackInterest,
    getRecommendations,
    syncInterests,
    clearInterests,
} from '../controllers/interest.controller';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Interests
 *   description: User interest tracking for personalized recommendations
 */

/**
 * @swagger
 * /api/interests/track:
 *   post:
 *     summary: Track user interest event (view, search, purchase)
 *     tags: [Interests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storeId
 *               - eventType
 *               - data
 *             properties:
 *               storeId:
 *                 type: string
 *               sessionId:
 *                 type: string
 *                 description: Required for guest users
 *               eventType:
 *                 type: string
 *                 enum: [view, search, purchase]
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Event tracked successfully
 */
router.post('/track', optionalAuth, trackInterest);

/**
 * @swagger
 * /api/interests/recommendations:
 *   get:
 *     summary: Get personalized product recommendations
 *     tags: [Interests]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: exclusionScope
 *         schema:
 *           type: string
 *           enum: [product, category]
 *           default: category
 *       - in: query
 *         name: exclusionDays
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: retentionDays
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: fallback
 *         schema:
 *           type: string
 *           enum: [trending, featured, latest, sale]
 *           default: featured
 *     responses:
 *       200:
 *         description: Personalized product recommendations
 */
router.get('/recommendations', optionalAuth, getRecommendations);

/**
 * @swagger
 * /api/interests/sync:
 *   post:
 *     summary: Sync localStorage data to database (on login)
 *     tags: [Interests]
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
 *               - localData
 *             properties:
 *               storeId:
 *                 type: string
 *               localData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Data synced successfully
 */
router.post('/sync', optionalAuth, syncInterests);

/**
 * @swagger
 * /api/interests:
 *   delete:
 *     summary: Clear user interest data
 *     tags: [Interests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data cleared successfully
 */
router.delete('/', optionalAuth, clearInterests);

export default router;
