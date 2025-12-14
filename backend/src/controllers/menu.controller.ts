import { Response } from 'express';
import { body, param } from 'express-validator';
import Menu from '../models/Menu';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createMenuValidation = [
    body('name').trim().notEmpty().withMessage('Menu name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('items').optional().isArray(),
    body('settings').optional().isObject(),
];

export const updateMenuValidation = [
    param('id').isMongoId().withMessage('Invalid menu ID'),
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
];

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Create a new menu
 *     tags: [Menus]
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
 *               - storeId
 *             properties:
 *               storeId:
 *                 type: string
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               location:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Menu created successfully
 */
export const createMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, slug, location, description, items, settings, isActive } = req.body;

    // Check slug uniqueness
    const existingMenu = await Menu.findOne({ storeId, slug });
    if (existingMenu) {
        throw new AppError('Menu with this slug already exists in this store', 400);
    }

    const menu = await Menu.create({
        storeId,
        name,
        slug,
        location,
        description,
        items: items || [],
        settings,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        message: 'Menu created successfully',
        menu,
    });
});

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Get all menus
 *     tags: [Menus]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menus retrieved successfully
 */
export const getMenus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    } else {
        throw new AppError('Store ID is required', 400);
    }

    if (req.query.location) {
        filter.location = req.query.location;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    const menus = await Menu.find(filter).sort({ name: 1 });

    res.json({ menus });
});

/**
 * @swagger
 * /api/menus/{id}:
 *   get:
 *     summary: Get menu by ID
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *       404:
 *         description: Menu not found
 */
export const getMenuById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    res.json({ menu });
});

/**
 * @swagger
 * /api/menus/{id}:
 *   put:
 *     summary: Update menu
 *     tags: [Menus]
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
 *         description: Menu updated successfully
 */
export const updateMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const menu = await Menu.findById(id);
    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    // Check slug uniqueness
    if (updates.slug && updates.slug !== menu.slug) {
        const existingMenu = await Menu.findOne({
            storeId: menu.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingMenu) {
            throw new AppError('Menu with this slug already exists in this store', 400);
        }
    }

    // Prevent storeId change
    delete updates.storeId;

    Object.assign(menu, updates);
    await menu.save();

    res.json({
        message: 'Menu updated successfully',
        menu,
    });
});

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     summary: Delete menu
 *     tags: [Menus]
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
 *         description: Menu deleted successfully
 */
export const deleteMenu = asyncHandler(async (req: AuthRequest, res: Response) => {
    const menu = await Menu.findByIdAndDelete(req.params.id);

    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    res.json({
        message: 'Menu deleted successfully',
    });
});
