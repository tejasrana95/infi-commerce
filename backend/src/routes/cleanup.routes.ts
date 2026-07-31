import { Router } from 'express';
import { runCleanup } from '../controllers/cleanup.controller';
import { localIpOnly } from '../middleware/localIpAuth';

const router = Router();

/**
 * @swagger
 * /api/cleanup:
 *   get:
 *     summary: Trigger scheduled system cleanup (local IP / cron only)
 *     description: Cleans up expired carts, temporary upload files, and old notification logs. Restricted to local IP requests.
 *     tags: [Cleanup]
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 *       403:
 *         description: Forbidden (request not from allowed local IP)
 *       500:
 *         description: Server error
 */
router.get('/', localIpOnly, runCleanup);

export default router;
