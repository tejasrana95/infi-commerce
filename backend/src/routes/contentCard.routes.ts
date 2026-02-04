import express from 'express';
import {
    getContentCards,
    getContentCardById,
    getContentCardBySlug,
    createContentCard,
    updateContentCard,
    deleteContentCard,
    cloneContentCard,
    getContentCardCategories,
    getContentCardCategoryById,
    createContentCardCategory,
    updateContentCardCategory,
    deleteContentCardCategory,
    cloneContentCardCategory
} from '../controllers/contentCard.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ContentCard
 *   description: Content cards and categories management (CMS)
 */

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

/**
 * @swagger
 * /api/content-card/cards/slug/{slug}:
 *   get:
 *     summary: Get content card by slug
 *     tags: [ContentCard]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content card details
 *       404:
 *         description: Content card not found
 */
router.get('/cards/slug/:slug', getContentCardBySlug);

/**
 * @swagger
 * /api/content-card/categories:
 *   get:
 *     summary: Get all content card categories
 *     tags: [ContentCard]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getContentCardCategories);

// ============================================
// MIXED ROUTES (work with or without auth)
// These routes check req.user internally to determine behavior
// ============================================

/**
 * @swagger
 * /api/content-card/cards:
 *   get:
 *     summary: Get all content cards
 *     tags: [ContentCard]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: publishedAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of content cards
 */
router.get('/cards', optionalAuth, getContentCards); // Public sees published, authenticated sees all

// ============================================
// AUTHENTICATED ROUTES
// ============================================
router.use(authenticate);

// Card management

/**
 * @swagger
 * /api/content-card/cards:
 *   post:
 *     summary: Create new content card (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - storeId
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               storeId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       201:
 *         description: Content card created successfully
 *       400:
 *         description: Validation error
 */
router.post('/cards', authorize('admin', 'super_admin'), createContentCard);

/**
 * @swagger
 * /api/content-card/cards/{id}:
 *   get:
 *     summary: Get content card by ID
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content card details
 *       404:
 *         description: Content card not found
 */
router.get('/cards/:id', getContentCardById);

/**
 * @swagger
 * /api/content-card/cards/{id}:
 *   put:
 *     summary: Update content card (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Content card updated successfully
 *       404:
 *         description: Content card not found
 */
router.put('/cards/:id', authorize('admin', 'super_admin'), updateContentCard);

/**
 * @swagger
 * /api/content-card/cards/{id}:
 *   delete:
 *     summary: Delete content card (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content card deleted successfully
 *       404:
 *         description: Content card not found
 */
router.delete('/cards/:id', authorize('admin', 'super_admin'), deleteContentCard);

/**
 * @swagger
 * /api/content-card/cards/{id}/clone:
 *   post:
 *     summary: Clone content card (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Content card cloned successfully
 *       404:
 *         description: Content card not found
 */
router.post('/cards/:id/clone', authorize('admin', 'super_admin'), cloneContentCard);

// Category management  

/**
 * @swagger
 * /api/content-card/categories:
 *   post:
 *     summary: Create content card category (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - storeId
 *             properties:
 *               name:
 *                 type: string
 *               storeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/categories', authorize('admin', 'super_admin'), createContentCardCategory);

/**
 * @swagger
 * /api/content-card/categories/{id}:
 *   get:
 *     summary: Get content card category by ID
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/categories/:id', getContentCardCategoryById);

/**
 * @swagger
 * /api/content-card/categories/{id}:
 *   put:
 *     summary: Update content card category (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/categories/:id', authorize('admin', 'super_admin'), updateContentCardCategory);

/**
 * @swagger
 * /api/content-card/categories/{id}:
 *   delete:
 *     summary: Delete content card category (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with cards
 *       404:
 *         description: Category not found
 */
router.delete('/categories/:id', authorize('admin', 'super_admin'), deleteContentCardCategory);

/**
 * @swagger
 * /api/content-card/categories/{id}/clone:
 *   post:
 *     summary: Clone content card category (Admin only)
 *     tags: [ContentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Category cloned successfully
 *       404:
 *         description: Category not found
 */
router.post('/categories/:id/clone', authorize('admin', 'super_admin'), cloneContentCardCategory);

export default router;
