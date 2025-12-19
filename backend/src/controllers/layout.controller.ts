import { Response } from 'express';
import { body, param } from 'express-validator';
import Layout from '../models/Layout';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createLayoutValidation = [
    body('name').trim().notEmpty().withMessage('Layout name is required'),
    body('type').isIn(['homepage', 'category', 'product', 'search', 'blog-list', 'blog-post', 'page', 'cart', 'checkout', 'account']).withMessage('Invalid layout type'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
];

export const updateLayoutValidation = [
    param('id').isMongoId().withMessage('Invalid layout ID'),
    body('name').optional().trim().notEmpty(),
];

/**
 * @swagger
 * /api/layouts:
 *   post:
 *     summary: Create a new layout
 *     tags: [Layouts]
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
 *               - type
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Layout created successfully
 */
export const createLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, themeId, name, description, type, sections, settings, seo, isDefault, status } = req.body;

    const layout = await Layout.create({
        storeId,
        themeId,
        name,
        description,
        type,
        sections: sections || [],
        settings,
        seo,
        isDefault: isDefault || false,
        status: status || 'draft',
    });

    res.status(201).json({
        message: 'Layout created successfully',
        layout,
    });
});

/**
 * @swagger
 * /api/layouts:
 *   get:
 *     summary: Get all layouts
 *     tags: [Layouts]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layouts retrieved successfully
 */
export const getLayouts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    // For admin requests, storeId is optional
    // If storeId is provided, filter by it; otherwise return all layouts (for admins)
    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    // Support filtering by templates
    if (req.query.isTemplate) {
        filter.isTemplate = req.query.isTemplate === 'true';
    } else {
        filter.isTemplate = false; // Default to showing actual layouts, not templates
    }

    const layouts = await Layout.find(filter)
        .populate('storeId', 'name domain')
        .sort({ isDefault: -1, updatedAt: -1 });

    res.json({ data: layouts });
});

/**
 * @swagger
 * /api/layouts/{id}:
 *   get:
 *     summary: Get layout by ID
 *     tags: [Layouts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Layout retrieved successfully
 *       404:
 *         description: Layout not found
 */
export const getLayoutById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const layout = await Layout.findById(req.params.id);

    if (!layout) {
        throw new AppError('Layout not found', 404);
    }

    res.json({ layout });
});

/**
 * @swagger
 * /api/layouts/{id}:
 *   put:
 *     summary: Update layout
 *     tags: [Layouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Layout updated successfully
 */
export const updateLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const layout = await Layout.findById(id);
    if (!layout) {
        throw new AppError('Layout not found', 404);
    }

    // Prevent storeId and type change
    delete updates.storeId;
    delete updates.type;

    Object.assign(layout, updates);
    await layout.save();

    res.json({
        message: 'Layout updated successfully',
        layout,
    });
});

/**
 * @swagger
 * /api/layouts/{id}:
 *   delete:
 *     summary: Delete layout
 *     tags: [Layouts]
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
 *         description: Layout deleted successfully
 */
export const deleteLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const layout = await Layout.findById(req.params.id);

    if (!layout) {
        throw new AppError('Layout not found', 404);
    }

    if (layout.isDefault) {
        throw new AppError('Cannot delete the default layout. Set another layout as default first.', 400);
    }

    await layout.deleteOne();

    res.json({
        message: 'Layout deleted successfully',
    });
});

/**
 * @swagger
 * /api/layouts/{id}/duplicate:
 *   post:
 *     summary: Duplicate a layout
 *     tags: [Layouts]
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
 *         description: Layout duplicated successfully
 */
export const duplicateLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const layout = await Layout.findById(req.params.id);

    if (!layout) {
        throw new AppError('Layout not found', 404);
    }

    const newLayout = await Layout.create({
        ...layout.toObject(),
        _id: undefined,
        name: `${layout.name} (Copy)`,
        isDefault: false,
        createdAt: undefined,
        updatedAt: undefined,
    });

    res.status(201).json({
        message: 'Layout duplicated successfully',
        layout: newLayout,
    });
});
