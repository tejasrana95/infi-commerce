import express from 'express';
import {
    createMenu,
    getMenus,
    getMenuById,
    updateMenu,
    deleteMenu,
    createMenuValidation,
    updateMenuValidation
} from '../controllers/menu.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Public GET routes (no auth required for frontend rendering)
router
    .route('/')
    .get(getMenus)  // Public - for frontend SSR
    .post(authenticate, authorize('admin', 'super_admin'), validate(createMenuValidation), createMenu);

router
    .route('/:id')
    .get(getMenuById)  // Public - for frontend SSR
    .put(authenticate, authorize('admin', 'super_admin'), validate(updateMenuValidation), updateMenu)
    .delete(authenticate, authorize('admin', 'super_admin'), deleteMenu);

export default router;
