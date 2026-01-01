import { Response } from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import Attribute from '../models/Attribute';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createAttributeValidation = [
    body('name').trim().notEmpty().withMessage('Attribute name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('type').isIn(['select', 'multiselect', 'checkbox', 'text', 'number']).withMessage('Invalid attribute type'),
];

export const updateAttributeValidation = [
    param('id').isMongoId().withMessage('Invalid attribute ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
];

/**
 * @swagger
 * /api/attributes:
 *   post:
 *     summary: Create a new product attribute (for specifications)
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 *     security:
 *       - bearerAuth: []
 */
export const createAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, storeId, type, options, unit, isFilterable, isComparable, isRequired, categoryIds, sortOrder } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(storeId.toString())) {
            throw new AppError('Unauthorized: You can only create attributes for your assigned stores', 403);
        }
    }

    // Check if slug already exists for this store
    const existingAttribute = await Attribute.findOne({ storeId, slug });
    if (existingAttribute) {
        throw new AppError('Attribute with this slug already exists in this store', 400);
    }

    // Create attribute
    const attribute = await Attribute.create({
        name,
        slug,
        storeId,
        type,
        options: options || [],
        unit,
        isFilterable: isFilterable !== undefined ? isFilterable : true,
        isComparable: isComparable !== undefined ? isComparable : true,
        isRequired: isRequired !== undefined ? isRequired : false,
        categoryIds: categoryIds || [],
        sortOrder: sortOrder || 0,
    });

    res.status(201).json({
        success: true,
        message: 'Attribute created successfully',
        data: attribute,
    });
});

/**
 * @swagger
 * /api/attributes:
 *   get:
 *     summary: Get all product attributes
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const getAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    if (isStoreAdmin) {
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isFilterable !== undefined) {
        filter.isFilterable = req.query.isFilterable === 'true';
    }

    if (req.query.isComparable !== undefined) {
        filter.isComparable = req.query.isComparable === 'true';
    }

    if (req.query.categoryId) {
        filter.categoryIds = req.query.categoryId;
    }

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search as string, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { slug: searchRegex },
            { type: searchRegex }
        ];
    }

    const [attributes, total] = await Promise.all([
        Attribute.find(filter)
            .populate('storeId', 'name slug')
            .populate('categoryIds', 'name slug')
            .sort({ sortOrder: 1, name: 1 })
            .skip(skip)
            .limit(limit),
        Attribute.countDocuments(filter)
    ]);

    res.json({
        success: true,
        data: attributes,
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
 * /api/attributes/{id}:
 *   get:
 *     summary: Get attribute by ID
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const getAttributeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'name slug');

    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    res.json({
        success: true,
        data: attribute,
    });
});

/**
 * @swagger
 * /api/attributes/{id}:
 *   put:
 *     summary: Update attribute
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const updateAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const attribute = await Attribute.findById(id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(attribute.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update attributes for your assigned stores', 403);
        }
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== attribute.slug) {
        const existingAttribute = await Attribute.findOne({
            storeId: attribute.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingAttribute) {
            throw new AppError('Attribute with this slug already exists in this store', 400);
        }
    }

    // Update attribute
    Object.assign(attribute, updates);
    await attribute.save();

    res.json({
        success: true,
        message: 'Attribute updated successfully',
        data: attribute,
    });
});

/**
 * @swagger
 * /api/attributes/{id}:
 *   delete:
 *     summary: Delete attribute
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const deleteAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete attributes', 403);
    }

    if (req.user?.role === 'store_admin') {
        throw new AppError('Store admins are not allowed to delete attributes', 403);
    }

    const attribute = await Attribute.findByIdAndDelete(req.params.id);

    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    res.json({
        success: true,
        message: 'Attribute deleted successfully',
    });
});

/**
 * @swagger
 * /api/attributes/filterable:
 *   get:
 *     summary: Get filterable attributes for product filters
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const getFilterableAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.query.storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const filter: any = {
        storeId: req.query.storeId,
        isFilterable: true,
    };

    // Filter by category if provided
    if (req.query.categoryId) {
        filter.$or = [
            { categoryIds: { $size: 0 } }, // No category restriction
            { categoryIds: req.query.categoryId }, // Matches the category
        ];
    }

    const attributes = await Attribute.find(filter).sort({ sortOrder: 1, name: 1 });

    res.json({
        success: true,
        data: attributes,
    });
});

/**
 * @swagger
 * /api/attributes/comparable:
 *   get:
 *     summary: Get comparable attributes for product comparison
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const getComparableAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.query.storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const filter: any = {
        storeId: req.query.storeId,
        isComparable: true,
    };

    if (req.query.categoryId) {
        filter.$or = [
            { categoryIds: { $size: 0 } },
            { categoryIds: req.query.categoryId },
        ];
    }

    const attributes = await Attribute.find(filter).sort({ sortOrder: 1, name: 1 });

    res.json({
        success: true,
        data: attributes,
    });
});

/**
 * @swagger
 * /api/attributes/{id}/options:
 *   post:
 *     summary: Add option to select/multiselect attribute
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const addAttributeOption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    if (!['select', 'multiselect'].includes(attribute.type)) {
        throw new AppError('Options can only be added to select or multiselect attributes', 400);
    }

    const { option } = req.body;

    if (!option || typeof option !== 'string') {
        throw new AppError('Option value is required', 400);
    }

    if (attribute.options?.includes(option)) {
        throw new AppError('Option already exists', 400);
    }

    attribute.options = [...(attribute.options || []), option];
    await attribute.save();

    res.json({
        success: true,
        message: 'Option added successfully',
        data: attribute,
    });
});

/**
 * @swagger
 * /api/attributes/{id}/options/{option}:
 *   delete:
 *     summary: Remove option from attribute
 *     tags: [Attributes]
 *     deprecated: true
 *     description: This endpoint is legacy. Use ProductOptions for variant-related features.
 */
export const removeAttributeOption = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    const optionToRemove = decodeURIComponent(req.params.option);
    attribute.options = attribute.options?.filter(opt => opt !== optionToRemove) || [];
    await attribute.save();

    res.json({
        success: true,
        message: 'Option removed successfully',
        data: attribute,
    });
});
