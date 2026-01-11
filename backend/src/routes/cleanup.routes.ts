import { Router } from 'express';
import { runCleanup } from '../controllers/cleanup.controller';
import { localIpOnly } from '../middleware/localIpAuth';

const router = Router();

// Public cron endpoint for cleanup (local IP only)
router.get('/', localIpOnly, runCleanup);

export default router;
