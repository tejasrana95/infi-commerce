import { Router } from 'express';
import {
    handleRazorpayWebhook,
    handleStripeWebhook,
    handlePayPalWebhook,
} from '../controllers/webhook.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Payment gateway webhook endpoints
 */

/**
 * @swagger
 * /api/webhooks/razorpay:
 *   post:
 *     summary: Razorpay webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/razorpay', handleRazorpayWebhook);

/**
 * @swagger
 * /api/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/stripe', handleStripeWebhook);

/**
 * @swagger
 * /api/webhooks/paypal:
 *   post:
 *     summary: PayPal webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/paypal', handlePayPalWebhook);

export default router;
