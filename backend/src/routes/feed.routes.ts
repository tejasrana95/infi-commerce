import { Router } from 'express';
import { getPinterestFeed } from '../controllers/feed.controller';

const router = Router();

/**
 * @swagger
 * /api/feeds/pinterest/{storeId}:
 *   get:
 *     summary: Generate Pinterest Catalog RSS 2.0 / Google Product Feed XML
 *     description: Public endpoint for fetching product catalog feed XML for Pinterest integration.
 *     tags: [Feeds]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID to generate feed for
 *     responses:
 *       200:
 *         description: Product catalog RSS 2.0 XML feed
 *         content:
 *           application/xml:
 *             schema:
 *               type: string
 *       400:
 *         description: Store ID missing or invalid
 *       403:
 *         description: Pinterest feed is disabled for this store
 *       404:
 *         description: Store not found
 *       500:
 *         description: Server error
 */
router.get('/pinterest/:storeId', getPinterestFeed);

export default router;
