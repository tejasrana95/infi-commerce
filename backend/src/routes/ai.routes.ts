import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/chat', optionalAuth, aiController.chat);
router.get('/history', optionalAuth, aiController.getHistory);

export default router;
