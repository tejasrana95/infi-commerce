import { Response } from 'express';
import { body, param } from 'express-validator';
import ProductOption from '../models/ProductOption';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createProductOptionValidation = [
    body('name').trim().notEmpty().withMessage('Product option name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('type').isIn(['select', 'multiselect', 'color', 'size']).withMessage('Invalid option type'),
    body('values').isArray().withMessage('Values must be an array'),
];

export const updateProductOptionValidation = [
    param('id').isMongoId().withMessage('Invalid product option ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
];

/**
 * @swagger
 * /api/product-options:
 *   post:
 *     summary: Create a new product option (for variants)
 *     tags: [ProductOptions]
 *     security:
 *       - bearerAuth: []
 */
export const createProductOption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, storeId, type, values, isFilterable, sortOrder } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Check if slug already exists for this store
    const existingOption = await ProductOption.findOne({ storeId, slug });
    if (existingOption) {
        throw new AppError('Product option with this slug already exists in this store', 400);
    }

    // Create product option
    const productOption = await ProductOption.create({
        name,
        slug,
        storeId,
        type,
        values,
        isFilterable: isFilterable !== undefined ? isFilterable : true,
        sortOrder: sortOrder || 0,
    });

    res.status(201).json({
        message: 'Product option created successfully',
        productOption,
    });
});

/**
 * @swagger
 * /api/product-options:
 *   get:
 *     summary: Get all product options
 *     tags: [ProductOptions]
 */
export const getProductOptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isFilterable !== undefined) {
        filter.isFilterable = req.query.isFilterable === 'true';
    }

    const productOptions = await ProductOption.find(filter)
        .populate('storeId', 'name slug')
        .sort({ sortOrder: 1, name: 1 });

    res.json({ productOptions });
});

/**
 * @swagger
 * /api/product-options/{id}:
 *   get:
 *     summary: Get product option by ID
 *     tags: [ProductOptions]
 */
export const getProductOptionById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productOption = await ProductOption.findById(req.params.id).populate('storeId', 'name slug');

    if (!productOption) {
        throw new AppError('Product option not found', 404);
    }

    res.json({ productOption });
});

/**
 * @swagger
 * /api/product-options/{id}:
 *   put:
 *     summary: Update product option
 *     tags: [ProductOptions]
 */
export const updateProductOption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const productOption = await ProductOption.findById(id);
    if (!productOption) {
        throw new AppError('Product option not found', 404);
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== productOption.slug) {
        const existingOption = await ProductOption.findOne({
            storeId: productOption.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingOption) {
            throw new AppError('Product option with this slug already exists in this store', 400);
        }
    }

    // Update product option
    Object.assign(productOption, updates);
    await productOption.save();

    res.json({
        message: 'Product option updated successfully',
        productOption,
    });
});

/**
 * @swagger
 * /api/product-options/{id}:
 *   delete:
 *     summary: Delete product option
 *     tags: [ProductOptions]
 */
export const deleteProductOption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productOption = await ProductOption.findByIdAndDelete(req.params.id);

    if (!productOption) {
        throw new AppError('Product option not found', 404);
    }

    res.json({
        message: 'Product option deleted successfully',
    });
});

/**
 * @swagger
 * /api/product-options/filterable:
 *   get:
 *     summary: Get filterable product options for product filters
 *     tags: [ProductOptions]
 */
export const getFilterableProductOptions = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.query.storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const productOptions = await ProductOption.find({
        storeId: req.query.storeId,
        isFilterable: true,
    }).sort({ sortOrder: 1, name: 1 });

    res.json({ productOptions });
});

/**
 * @swagger
 * /api/product-options/{id}/values:
 *   post:
 *     summary: Add value to product option
 *     tags: [ProductOptions]
 */
export const addProductOptionValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productOption = await ProductOption.findById(req.params.id);
    if (!productOption) {
        throw new AppError('Product option not found', 404);
    }

    const { label, value, colorCode, image } = req.body;

    // Check if value already exists
    const existingValue = productOption.values.find((v) => v.value === value);
    if (existingValue) {
        throw new AppError('Value already exists for this product option', 400);
    }

    productOption.values.push({ label, value, colorCode, image });
    await productOption.save();

    res.json({
        message: 'Value added successfully',
        productOption,
    });
});

/**
 * @swagger
 * /api/product-options/{id}/values/{valueId}:
 *   delete:
 *     summary: Remove value from product option
 *     tags: [ProductOptions]
 */
export const removeProductOptionValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productOption = await ProductOption.findById(req.params.id);
    if (!productOption) {
        throw new AppError('Product option not found', 404);
    }

    productOption.values = productOption.values.filter((v: any) => v._id.toString() !== req.params.valueId);
    await productOption.save();

    res.json({
        message: 'Value removed successfully',
        productOption,
    });
});
