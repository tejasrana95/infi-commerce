import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    createApiKey,
    createApiKeyValidation,
    getApiKeys,
    getApiKeyById,
    updateApiKey,
    updateApiKeyValidation,
    deleteApiKey,
    regenerateApiKey,
    toggleApiKeyStatus,
} from '../controllers/apiKey.controller';

const router = Router();

// All routes require super_admin authentication
router.use(authenticate, authorize('super_admin'));

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Get all API keys
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getApiKeys);

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createApiKeyValidation, createApiKey);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   get:
 *     summary: Get API key by ID
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getApiKeyById);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   put:
 *     summary: Update an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', updateApiKeyValidation, updateApiKey);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Delete an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', deleteApiKey);

/**
 * @swagger
 * /api/api-keys/{id}/regenerate:
 *   post:
 *     summary: Regenerate an API key
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/regenerate', regenerateApiKey);

/**
 * @swagger
 * /api/api-keys/{id}/toggle:
 *   patch:
 *     summary: Toggle API key active status
 *     tags: [API Keys]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id/toggle', toggleApiKeyStatus);

export default router;
