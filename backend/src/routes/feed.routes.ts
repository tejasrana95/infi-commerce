import { Router } from 'express';
import { getPinterestFeed } from '../controllers/feed.controller';

const router = Router();

// Public route to generate Pinterest product feed (No authorization headers required for Pinterest crawlers)
router.get('/pinterest/:storeId', getPinterestFeed);

export default router;
