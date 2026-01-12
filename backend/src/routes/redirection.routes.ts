import express from 'express';
import * as redirectionController from '../controllers/redirection.controller';
import { isSuperAdmin } from '../middleware/auth';

const router = express.Router();

// Super admin routes for CRUD operations
router.get('/', isSuperAdmin, redirectionController.getRedirections);
router.get('/:id', isSuperAdmin, redirectionController.getRedirectionById);
router.post('/', isSuperAdmin, redirectionController.createRedirection);
router.put('/:id', isSuperAdmin, redirectionController.updateRedirection);
router.delete('/:id', isSuperAdmin, redirectionController.deleteRedirection);

// Public route for checking redirections (used by frontend)
router.get('/check/:storeId/:url(*)', redirectionController.checkRedirection);

export default router;
