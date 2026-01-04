import { Router } from 'express';
import { generateContent, calculateSeoScore } from '../controllers/admin-ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication to all AI routes
router.use(authenticate);

// Generate content (admin only - or specific roles)
router.post('/generate', authorize('super_admin', 'admin', 'editor'), generateContent);

// Calculate SEO score
router.post('/seo-score', authorize('super_admin', 'admin', 'editor'), calculateSeoScore);

export default router;
