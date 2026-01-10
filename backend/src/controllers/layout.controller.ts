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
    body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
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
    const { storeId, themeId, name, description, type, slug, sections, settings, seo, isDefault, status } = req.body;

    // If slug is provided, check for uniqueness (storeId + type + slug)
    if (slug) {
        const existingLayout = await Layout.findOne({ storeId, type, slug: slug.toLowerCase().trim() });
        if (existingLayout) {
            throw new AppError(`A layout for this type with slug "${slug}" already exists`, 400);
        }
    }

    const layout = await Layout.create({
        storeId,
        themeId,
        name,
        description,
        type,
        slug: slug ? slug.toLowerCase().trim() : undefined,
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Get store ID from multiple sources (header takes priority for API key requests)
    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    // For admin requests, storeId is optional
    // If storeId is provided, filter by it; otherwise return all layouts (for admins)
    if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    }

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    // Filter by slug if provided
    if (req.query.slug) {
        filter.slug = (req.query.slug as string).toLowerCase().trim();
    }

    // Support filtering by templates
    if (req.query.isTemplate) {
        filter.isTemplate = req.query.isTemplate === 'true';
    } else {
        filter.isTemplate = false; // Default to showing actual layouts, not templates
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.name = searchRegex;
    }

    const [layouts, total] = await Promise.all([
        Layout.find(filter)
            .populate('storeId', 'name domain')
            .sort({ isDefault: -1, updatedAt: -1 })
            .skip(skip)
            .limit(limit),
        Layout.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: layouts,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
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

    // Prevent type change
    delete updates.type;
    delete updates.__v;

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

    // Convert to plain object and remove fields that shouldn't be copied
    const layoutObj = layout.toObject();
    const { _id, slug, createdAt, updatedAt, ...layoutData } = layoutObj;

    const newLayout = await Layout.create({
        ...layoutData,
        name: `${layout.name} (Copy)`,
        isDefault: false,
        // slug is intentionally omitted (not set to undefined/null) to avoid unique index issues
    });

    res.status(201).json({
        message: 'Layout duplicated successfully',
        layout: newLayout,
    });
});

/**
 * @swagger
 * /api/layouts/resolve:
 *   get:
 *     summary: Resolve layout by type and optional slug (with fallback)
 *     tags: [Layouts]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: slug
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional page slug for slug-specific layout
 *     responses:
 *       200:
 *         description: Layout resolved successfully
 *       404:
 *         description: No layout found for this type
 */
export const resolveLayout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, type, slug } = req.query;

    if (!storeId || !type) {
        throw new AppError('storeId and type are required', 400);
    }

    let layout = null;

    // Step 1: If slug is provided, try to find slug-specific layout
    if (slug) {
        layout = await Layout.findOne({
            storeId,
            type,
            slug: (slug as string).toLowerCase().trim(),
            status: 'published',
            isTemplate: false,
        });
    }

    // Step 2: If no slug-specific layout found, fallback to default layout
    if (!layout) {
        layout = await Layout.findOne({
            storeId,
            type,
            isDefault: true,
            status: 'published',
            isTemplate: false,
        });
    }



    if (!layout) {
        res.json({ layout: null });
        return;
    }

    res.json({ layout });
});
