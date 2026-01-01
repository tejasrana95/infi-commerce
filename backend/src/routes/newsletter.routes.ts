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

const router = Router();

// Public route
router.post('/subscribe', validate(subscribeValidation), subscribe);

// Admin routes
router.get('/', auth, checkRole('admin', 'super_admin'), getSubscribers);
router.get('/export', auth, checkRole('admin', 'super_admin'), exportSubscribers);
router.delete('/:id', auth, checkRole('admin', 'super_admin'), deleteSubscriber);
router.delete('/bulk/delete-all', auth, checkRole('admin', 'super_admin'), deleteAllSubscribers);

export default router;
