import { Response } from 'express';
import { body, param } from 'express-validator';
import Menu from '../models/Menu';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import redisService from '../services/redis.service';
import { CacheKeys, CACHE_TTL } from '../utils/cache-keys';
import { invalidateMenuCache, invalidateStoreCache, invalidateStoreDomainCache } from '../utils/cache-invalidation';

// Helper function to invalidate store cache (for menu updates that affect store)
async function invalidateStoreCacheOnMenuChange(storeId: string) {
    try {
        const store = await Store.findById(storeId);
        if (store) {
            // Invalidate both store and menu caches
            await Promise.all([
                invalidateStoreCache(storeId),
                invalidateStoreDomainCache(store.domains),
                invalidateMenuCache(storeId),
            ]);
        }
    } catch (error) {
        console.error('Failed to invalidate store cache:', error);
    }
}

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

    // Invalidate store cache since menus are now embedded
    await invalidateStoreCacheOnMenuChange(storeId);

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
    const { page = 1, limit = 20, search, location } = req.query;
    const filter: any = {};

    // Get store ID from multiple sources (header takes priority for API key requests)
    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    // Store filter - optional for super_admin
    if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    } else if (req.user?.role === 'super_admin') {
        // Super admin can see all menus
    } else if (req.user?.storeIds?.length) {
        // Store admin sees only their store's menus
        filter.storeId = req.user.storeIds[0];
    }

    if (location) {
        filter.location = location;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const [menus, total] = await Promise.all([
        Menu.find(filter)
            .populate('storeId', 'name')
            .sort({ name: 1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        Menu.countDocuments(filter),
    ]);

    res.json({
        success: true,
        menus,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
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
    const { id } = req.params;
    const cacheKey = CacheKeys.menu(id);

    const cachedMenu = await redisService.get<any>(cacheKey);
    if (cachedMenu) {
        return res.json({ menu: cachedMenu });
    }

    const menu = await Menu.findById(id);

    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    await redisService.set(cacheKey, menu, CACHE_TTL.MENUS);

    return res.json({ menu });
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

    // Invalidate cache
    await redisService.delete(CacheKeys.menu(id));

    // Invalidate store cache since menus are now embedded
    await invalidateStoreCacheOnMenuChange(menu.storeId.toString());

    return res.json({
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
    const { id } = req.params;
    const menu = await Menu.findByIdAndDelete(id);

    if (!menu) {
        throw new AppError('Menu not found', 404);
    }

    // Invalidate cache
    await redisService.delete(CacheKeys.menu(id));

    // Invalidate store cache since menus are now embedded
    await invalidateStoreCacheOnMenuChange(menu.storeId.toString());

    return res.json({
        message: 'Menu deleted successfully',
    });
});
