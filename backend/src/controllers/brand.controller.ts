import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Brand from '../models/Brand';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { invalidateBrandCache } from '../utils/cache-invalidation';
import SlugRegistry from '../models/SlugRegistry';

// Validation rules
export const createBrandValidation = [
    body('name').trim().notEmpty().withMessage('Brand name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('logo').optional({ values: 'falsy' }).isURL({ require_tld: false }).withMessage('Logo must be a valid URL'),
    body('website').optional({ values: 'falsy' }).isURL({ require_tld: false }).withMessage('Website must be a valid URL'),
];

export const updateBrandValidation = [
    param('id').isMongoId().withMessage('Invalid brand ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('logo').optional({ values: 'falsy' }).isURL({ require_tld: false }).withMessage('Logo must be a valid URL'),
    body('website').optional({ values: 'falsy' }).isURL({ require_tld: false }).withMessage('Website must be a valid URL'),
];

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, storeId]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               storeId: { type: string }
 *               logo: { type: string }
 *               description: { type: string }
 *               website: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         description: Validation error or slug exists
 */
export const createBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, storeId, logo, description, website, isActive } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(storeId.toString())) {
            throw new AppError('Unauthorized: You can only create brands for your assigned stores', 403);
        }
    }

    // Check if slug already exists for this store
    const existingBrand = await Brand.findOne({ storeId, slug });
    if (existingBrand) {
        throw new AppError('Brand with this slug already exists in this store', 400);
    }

    // Create brand
    const brand = await Brand.create({
        name,
        slug,
        storeId,
        logo,
        description,
        website,
        isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
        message: 'Brand created successfully',
        brand,
    });

    // Invalidate brand cache for this store
    await invalidateBrandCache(storeId);
});

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands (Public)
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 */
export const getBrands = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    // Get store ID from multiple sources (header takes priority for API key requests)
    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    if (isStoreAdmin) {
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    // Channel filter
    if (req.channel) {
        // If channel is specified, brand must either:
        // 1. Have this channel in its channels list
        // 2. Have no channels set (empty list or undefined) -> Visible everywhere
        const channelFilter = {
            $or: [
                { channels: req.channel },
                { channels: { $exists: false } },
                { channels: { $size: 0 } }
            ]
        };

        if (filter.$or) {
            filter.$and = filter.$and || [];
            filter.$and.push(channelFilter);
        } else {
            // Check if filter has $or already (from search)
            if (Object.keys(filter).some(k => k === '$or')) {
                filter.$and = filter.$and || [];
                filter.$and.push(channelFilter);
            } else {
                filter.$and = filter.$and || [];
                filter.$and.push(channelFilter);
            }
        }
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search as string, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { slug: searchRegex }
        ];
    }

    const [brands, total] = await Promise.all([
        Brand.find(filter)
            .populate('storeId', 'name slug')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit),
        Brand.countDocuments(filter)
    ]);

    res.json({
        brands,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Get brand by ID (Public)
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Brand retrieved successfully
 *       404:
 *         description: Brand not found
 */
export const getBrandById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const brand = await Brand.findById(req.params.id).populate('storeId', 'name slug');

    if (!brand) {
        throw new AppError('Brand not found', 404);
    }

    res.json({ brand });
});

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: Update brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       404:
 *         description: Brand not found
 */
export const updateBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const brand = await Brand.findById(id);
    if (!brand) {
        throw new AppError('Brand not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(brand.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update brands for your assigned stores', 403);
        }
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== brand.slug) {
        const existingBrand = await Brand.findOne({
            storeId: brand.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingBrand) {
            throw new AppError('Brand with this slug already exists in this store', 400);
        }
    }

    // Update brand
    Object.assign(brand, updates);
    await brand.save();

    // Invalidate brand cache for this store
    await invalidateBrandCache(brand.storeId.toString());

    res.json({
        message: 'Brand updated successfully',
        brand,
    });
});

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Delete brand
 *     tags: [Brands]
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
 *         description: Brand deleted successfully
 */
export const deleteBrand = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete brands', 403);
    }

    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
        throw new AppError('Brand not found', 404);
    }

    // Clean up slug registry
    await SlugRegistry.deleteMany({ entityType: 'brand', entityId: brand._id });

    // Invalidate brand cache for this store
    await invalidateBrandCache(brand.storeId.toString());

    res.json({
        message: 'Brand deleted successfully',
    });
});

/**
 * Bulk action on brands (delete, activate, deactivate)
 * POST /api/brands/bulk-action
 */
export const bulkAction = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot perform bulk actions', 403);
    }

    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('ids array is required', 400);
    }

    if (!['delete', 'activate', 'deactivate'].includes(action)) {
        throw new AppError('Invalid action. Must be delete, activate, or deactivate', 400);
    }

    // Collect storeIds for cache invalidation
    const brands = await Brand.find({ _id: { $in: ids } }).select('storeId');
    const storeIds = [...new Set(brands.map(b => b.storeId.toString()))];

    let affected = 0;

    switch (action) {
        case 'delete': {
            const r = await Brand.deleteMany({ _id: { $in: ids } });
            affected = r.deletedCount;
            // Clean up slug registry for deleted brands
            await SlugRegistry.deleteMany({ entityType: 'brand', entityId: { $in: ids } });
            break;
        }
        case 'activate': {
            const r = await Brand.updateMany({ _id: { $in: ids } }, { isActive: true });
            affected = r.modifiedCount;
            break;
        }
        case 'deactivate': {
            const r = await Brand.updateMany({ _id: { $in: ids } }, { isActive: false });
            affected = r.modifiedCount;
            break;
        }
    }

    // Invalidate caches for all affected stores
    for (const storeId of storeIds) {
        await invalidateBrandCache(storeId);
    }

    res.json({
        message: `Bulk ${action} completed successfully`,
        affected,
    });
});
