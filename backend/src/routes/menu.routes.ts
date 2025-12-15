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

router.use(authenticate);

router
    .route('/')
    .post(authorize('admin', 'super_admin'), validate(createMenuValidation), createMenu)
    .get(getMenus);

router
    .route('/:id')
    .get(getMenuById)
    .put(authorize('admin', 'super_admin'), validate(updateMenuValidation), updateMenu)
    .delete(authorize('admin', 'super_admin'), deleteMenu);

export default router;
