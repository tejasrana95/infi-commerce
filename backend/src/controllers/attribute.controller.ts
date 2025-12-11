import { Response } from 'express';
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
    body('type').isIn(['select', 'multiselect', 'text', 'color', 'size']).withMessage('Invalid attribute type'),
    body('values').isArray().withMessage('Values must be an array'),
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
 *     summary: Create a new attribute
 *     tags: [Attributes]
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
 *               - type
 *               - values
 *             properties:
 *               name:
 *                 type: string
 *                 example: Color
 *               slug:
 *                 type: string
 *                 example: color
 *               storeId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [select, multiselect, text, color, size]
 *               values:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                     value:
 *                       type: string
 *                     colorCode:
 *                       type: string
 *               isFilterable:
 *                 type: boolean
 *               isVariation:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Attribute created successfully
 */
export const createAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, storeId, type, values, isFilterable, isVariation, sortOrder } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
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
        values,
        isFilterable: isFilterable !== undefined ? isFilterable : true,
        isVariation: isVariation !== undefined ? isVariation : false,
        sortOrder: sortOrder || 0,
    });

    res.status(201).json({
        message: 'Attribute created successfully',
        attribute,
    });
});

/**
 * @swagger
 * /api/attributes:
 *   get:
 *     summary: Get all attributes
 *     tags: [Attributes]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isFilterable
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isVariation
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Attributes retrieved successfully
 */
export const getAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isFilterable !== undefined) {
        filter.isFilterable = req.query.isFilterable === 'true';
    }

    if (req.query.isVariation !== undefined) {
        filter.isVariation = req.query.isVariation === 'true';
    }

    const attributes = await Attribute.find(filter)
        .populate('storeId', 'name slug')
        .sort({ sortOrder: 1, name: 1 });

    res.json({ attributes });
});

/**
 * @swagger
 * /api/attributes/{id}:
 *   get:
 *     summary: Get attribute by ID
 *     tags: [Attributes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attribute retrieved successfully
 *       404:
 *         description: Attribute not found
 */
export const getAttributeById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id).populate('storeId', 'name slug');

    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    res.json({ attribute });
});

/**
 * @swagger
 * /api/attributes/{id}:
 *   put:
 *     summary: Update attribute
 *     tags: [Attributes]
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
 *         description: Attribute updated successfully
 */
export const updateAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const attribute = await Attribute.findById(id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
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
        message: 'Attribute updated successfully',
        attribute,
    });
});

/**
 * @swagger
 * /api/attributes/{id}:
 *   delete:
 *     summary: Delete attribute
 *     tags: [Attributes]
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
 *         description: Attribute deleted successfully
 */
export const deleteAttribute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findByIdAndDelete(req.params.id);

    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    res.json({
        message: 'Attribute deleted successfully',
    });
});

/**
 * @swagger
 * /api/attributes/filterable:
 *   get:
 *     summary: Get filterable attributes for product filters
 *     tags: [Attributes]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filterable attributes retrieved
 */
export const getFilterableAttributes = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.query.storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const attributes = await Attribute.find({
        storeId: req.query.storeId,
        isFilterable: true,
    }).sort({ sortOrder: 1, name: 1 });

    res.json({ attributes });
});

/**
 * @swagger
 * /api/attributes/{id}/values:
 *   post:
 *     summary: Add value to attribute
 *     tags: [Attributes]
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
 *             properties:
 *               label:
 *                 type: string
 *               value:
 *                 type: string
 *               colorCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Value added successfully
 */
export const addAttributeValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    const { label, value, colorCode, image } = req.body;

    // Check if value already exists
    const existingValue = attribute.values.find((v) => v.value === value);
    if (existingValue) {
        throw new AppError('Value already exists for this attribute', 400);
    }

    attribute.values.push({ label, value, colorCode, image });
    await attribute.save();

    res.json({
        message: 'Value added successfully',
        attribute,
    });
});

/**
 * @swagger
 * /api/attributes/{id}/values/{valueId}:
 *   delete:
 *     summary: Remove value from attribute
 *     tags: [Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: valueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Value removed successfully
 */
export const removeAttributeValue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) {
        throw new AppError('Attribute not found', 404);
    }

    attribute.values = attribute.values.filter((v: any) => v._id.toString() !== req.params.valueId);
    await attribute.save();

    res.json({
        message: 'Value removed successfully',
        attribute,
    });
});
