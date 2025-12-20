import { Response } from 'express';
import { body, param } from 'express-validator';
import Theme from '../models/Theme';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createThemeValidation = [
    body('name').trim().notEmpty().withMessage('Theme name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').optional().isMongoId().withMessage('Valid store ID is required'),
    body('author').optional().trim().notEmpty(),
    body('version').optional().trim().matches(/^\d+\.\d+\.\d+$/).withMessage('Version must be in x.y.z format'),
];

export const updateThemeValidation = [
    param('id').isMongoId().withMessage('Invalid theme ID'),
    body('name').optional().trim().notEmpty(),
    body('settings').optional().isObject(),
    body('isActive').optional().isBoolean(),
];

/**
 * @swagger
 * /api/themes:
 *   post:
 *     summary: Create a new theme
 *     tags: [Themes]
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
 *               - slug
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               version:
 *                 type: string
 *               author:
 *                 type: string
 *               description:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Theme created successfully
 */
export const createTheme = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, slug, version, author, description, settings, isSystemTheme } = req.body;

    // Check slug uniqueness
    const existingTheme = await Theme.findOne({
        storeId: storeId || null,
        slug
    });

    if (existingTheme) {
        throw new AppError('Theme with this slug already exists for this store', 400);
    }

    const theme = await Theme.create({
        storeId: storeId || null,
        name,
        slug,
        version,
        author,
        description,
        settings,
        isSystemTheme: isSystemTheme || false,
    });

    res.status(201).json({
        message: 'Theme created successfully',
        theme,
    });
});

/**
 * @swagger
 * /api/themes:
 *   get:
 *     summary: Get all themes (with filtering)
 *     tags: [Themes]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isSystemTheme
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Themes retrieved successfully
 */
export const getThemes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        // Include system themes + store-specific themes
        filter.$or = [
            { storeId: req.query.storeId },
            { isSystemTheme: true }
        ];
    } else if (req.query.storeId === 'null' || (req.user?.role === 'superadmin' && !req.query.storeId)) {
        // Superadmin viewing system themes or specifically requested null storeId
        if (req.query.storeId === 'null') filter.storeId = null;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.isSystemTheme !== undefined) {
        filter.isSystemTheme = req.query.isSystemTheme === 'true';
    }

    const themes = await Theme.find(filter).sort({ isSystemTheme: -1, name: 1 });

    res.json({ themes });
});

/**
 * @swagger
 * /api/themes/{id}:
 *   get:
 *     summary: Get theme by ID
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Theme retrieved successfully
 *       404:
 *         description: Theme not found
 */
export const getThemeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const theme = await Theme.findById(req.params.id);

    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    res.json({ theme });
});

/**
 * @swagger
 * /api/themes/{id}:
 *   put:
 *     summary: Update theme
 *     tags: [Themes]
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
 *         description: Theme updated successfully
 */
export const updateTheme = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const theme = await Theme.findById(id);
    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    // Check slug uniqueness
    if (updates.slug && updates.slug !== theme.slug) {
        const existingTheme = await Theme.findOne({
            storeId: theme.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingTheme) {
            throw new AppError('Theme with this slug already exists for this store', 400);
        }
    }

    // Prevent storeId change
    delete updates.storeId;

    Object.assign(theme, updates);
    await theme.save();

    res.json({
        message: 'Theme updated successfully',
        theme,
    });
});

/**
 * @swagger
 * /api/themes/{id}:
 *   delete:
 *     summary: Delete theme (System themes cannot be deleted)
 *     tags: [Themes]
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
 *         description: Theme deleted successfully
 */
export const deleteTheme = asyncHandler(async (req: AuthRequest, res: Response) => {
    const theme = await Theme.findById(req.params.id);

    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    if (theme.isSystemTheme && req.user?.role !== 'superadmin') {
        throw new AppError('System themes cannot be deleted', 403);
    }

    if (theme.isActive) {
        throw new AppError('Cannot delete the active theme', 400);
    }

    await theme.deleteOne();

    res.json({
        message: 'Theme deleted successfully',
    });
});

/**
 * @swagger
 * /api/themes/{id}/activate:
 *   post:
 *     summary: Activate theme for a store
 *     tags: [Themes]
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
 *         description: Theme activated successfully
 */
export const activateTheme = asyncHandler(async (req: AuthRequest, res: Response) => {
    const theme = await Theme.findById(req.params.id);

    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    // If it's a system theme, we might want to clone it for the store first?
    // For now, let's assume we can just activate it if it belongs to the store,
    // or if the logic is handled elsewhere. 
    // Actually, proper logic: Only store-owned themes can be "active". 
    // If activating a system theme, we should probably clone it to the store first.
    // BUT for simplicity in MVP:
    // 1. If storeId matches, activate it.
    // 2. If it's a system theme (storeId=null), we can't "activate" it directly 
    //    because multiple stores share it. We need to create a copy for this store.

    if (!theme.storeId) {
        // It's a system theme. Create a copy for this store.
        if (!req.body.storeId) {
            throw new AppError('storeId is required to activate a system theme', 400);
        }

        const newTheme = await Theme.create({
            ...theme.toObject(),
            _id: undefined,
            storeId: req.body.storeId,
            isSystemTheme: false,
            isActive: true, // Will trigger pre-save middleware to deactivate others
            createdAt: undefined,
            updatedAt: undefined
        });

        return res.json({
            message: 'System theme cloned and activated successfully',
            theme: newTheme
        });
    }

    // It's a store theme
    theme.isActive = true;
    await theme.save(); // Middleware handles deactivating others

    return res.json({
        message: 'Theme activated successfully',
        theme,
    });
});
