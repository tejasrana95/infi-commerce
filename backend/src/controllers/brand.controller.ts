import { Response } from 'express';
import { body, param } from 'express-validator';
import Brand from '../models/Brand';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

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
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    const brands = await Brand.find(filter)
        .populate('storeId', 'name slug')
        .sort({ name: 1 });

    res.json({ brands });
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
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
        throw new AppError('Brand not found', 404);
    }

    res.json({
        message: 'Brand deleted successfully',
    });
});
