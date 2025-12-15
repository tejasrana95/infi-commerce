import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getTestimonials,
    getTestimonialById,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    reorderTestimonials,
} from '../controllers/testimonial.controller';

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .get(getTestimonials)
    .post(authorize('admin', 'super_admin'), createTestimonial);

router
    .route('/reorder')
    .put(authorize('admin', 'super_admin'), reorderTestimonials);

router
    .route('/:id')
    .get(getTestimonialById)
    .put(authorize('admin', 'super_admin'), updateTestimonial)
    .delete(authorize('admin', 'super_admin'), deleteTestimonial);

export default router;
