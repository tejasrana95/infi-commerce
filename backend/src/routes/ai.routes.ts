import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Assistant endpoints
 */

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a message to the AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - storeId
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message
 *               storeId:
 *                 type: string
 *                 description: Store ID
 *               sessionId:
 *                 type: string
 *                 description: Session ID (required if no auth token)
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [assistant]
 *                 content:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: AI not enabled for store
 *       404:
 *         description: Store not found
 */
router.post('/chat', optionalAuth, aiController.chat);

/**
 * @swagger
 * /api/ai/history:
 *   get:
 *     summary: Get chat history
 *     tags: [AI]
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
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       role:
 *                         type: string
 *                         enum: [user, assistant]
 *                       content:
 *                         type: string
 *       400:
 *         description: Missing required fields
 */
router.get('/history', optionalAuth, aiController.getHistory);

export default router;
