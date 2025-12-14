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
    .post(authorize('admin', 'superadmin'), createMenuValidation, validate, createMenu)
    .get(getMenus);

router
    .route('/:id')
    .get(getMenuById)
    .put(authorize('admin', 'superadmin'), updateMenuValidation, validate, updateMenu)
    .delete(authorize('admin', 'superadmin'), deleteMenu);

export default router;
