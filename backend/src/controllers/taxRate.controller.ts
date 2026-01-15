import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import TaxRate, { ISubTax } from '../models/TaxRate';
import { asyncHandler } from '../middleware/validation';
import { invalidateTaxRateCache } from '../utils/cache-invalidation';

// Validation rules
export const createTaxRateValidation = [
    body('name').notEmpty().withMessage('Tax name is required'),
    body('rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('isSplit').optional().isBoolean(),
    body('subTaxes').optional().isArray(),
    body('subTaxes.*.name').optional().notEmpty().withMessage('Sub-tax name is required'),
    body('subTaxes.*.rate').optional().isFloat({ min: 0 }).withMessage('Sub-tax rate must be positive'),
    body('description').optional().isString(),
    body('isActive').optional().isBoolean(),
];

export const updateTaxRateValidation = [
    param('id').isMongoId().withMessage('Invalid tax rate ID'),
    body('name').optional().notEmpty().withMessage('Tax name cannot be empty'),
    body('rate').optional().isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('isSplit').optional().isBoolean(),
    body('subTaxes').optional().isArray(),
    body('subTaxes.*.name').optional().notEmpty(),
    body('subTaxes.*.rate').optional().isFloat({ min: 0 }),
    body('description').optional().isString(),
    body('isActive').optional().isBoolean(),
];

/**
 * @swagger
 * /api/tax-rates:
 *   get:
 *     summary: Get all tax rates
 *     tags: [Tax Rates]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Tax rates retrieved successfully
 */
export const getTaxRates = asyncHandler(async (req: Request, res: Response) => {
    const { isActive, page = 1, limit = 20, search } = req.query;

    const query: any = {};
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }

    const [taxRates, total] = await Promise.all([
        TaxRate.find(query)
            .sort({ name: 1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        TaxRate.countDocuments(query),
    ]);

    return res.json({
        success: true,
        data: taxRates,
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
 * /api/tax-rates/{id}:
 *   get:
 *     summary: Get tax rate by ID
 *     tags: [Tax Rates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tax rate retrieved successfully
 *       404:
 *         description: Tax rate not found
 */
export const getTaxRateById = asyncHandler(async (req: Request, res: Response) => {
    const taxRate = await TaxRate.findById(req.params.id);

    if (!taxRate) {
        return res.status(404).json({
            success: false,
            error: 'Tax rate not found',
        });
    }

    return res.json({
        success: true,
        data: taxRate,
    });
});

/**
 * @swagger
 * /api/tax-rates:
 *   post:
 *     summary: Create tax rate
 *     tags: [Tax Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               rate: { type: number }
 *               isSplit: { type: boolean }
 *               subTaxes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     rate: { type: number }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Tax rate created successfully
 */
export const createTaxRate = asyncHandler(async (req: Request, res: Response) => {
    const { name, rate, isSplit, subTaxes, description, isActive } = req.body;

    // Check for duplicate name
    const existing = await TaxRate.findOne({ name });
    if (existing) {
        return res.status(400).json({
            success: false,
            error: 'A tax rate with this name already exists',
        });
    }

    // If split tax, rate is calculated from subTaxes
    let finalRate = rate || 0;
    if (isSplit && subTaxes && subTaxes.length > 0) {
        finalRate = subTaxes.reduce((sum: number, st: ISubTax) => sum + (st.rate || 0), 0);
    }

    const taxRate = new TaxRate({
        name,
        rate: finalRate,
        isSplit: isSplit || false,
        subTaxes: isSplit ? subTaxes : undefined,
        description,
        isActive: isActive !== undefined ? isActive : true,
    });

    await taxRate.save();

    // Invalidate tax rate cache
    await invalidateTaxRateCache(taxRate._id.toString());

    return res.status(201).json({
        success: true,
        data: taxRate,
        message: 'Tax rate created successfully',
    });
});

/**
 * @swagger
 * /api/tax-rates/{id}:
 *   put:
 *     summary: Update tax rate
 *     tags: [Tax Rates]
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
 *         description: Tax rate updated successfully
 *       404:
 *         description: Tax rate not found
 */
export const updateTaxRate = asyncHandler(async (req: Request, res: Response) => {
    const taxRate = await TaxRate.findById(req.params.id);

    if (!taxRate) {
        return res.status(404).json({
            success: false,
            error: 'Tax rate not found',
        });
    }

    const { name, rate, isSplit, subTaxes, description, isActive } = req.body;

    // Check for duplicate name (if changing name)
    if (name && name !== taxRate.name) {
        const existing = await TaxRate.findOne({ name });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'A tax rate with this name already exists',
            });
        }
        taxRate.name = name;
    }

    if (isSplit !== undefined) {
        taxRate.isSplit = isSplit;
    }

    if (isSplit && subTaxes && subTaxes.length > 0) {
        taxRate.subTaxes = subTaxes;
        // Rate will be auto-calculated by pre-save middleware
    } else if (rate !== undefined) {
        taxRate.rate = rate;
    }

    if (description !== undefined) {
        taxRate.description = description;
    }

    if (isActive !== undefined) {
        taxRate.isActive = isActive;
    }

    await taxRate.save();

    // Invalidate tax rate cache
    await invalidateTaxRateCache(taxRate._id.toString());

    return res.json({
        success: true,
        data: taxRate,
        message: 'Tax rate updated successfully',
    });
});

/**
 * @swagger
 * /api/tax-rates/{id}:
 *   delete:
 *     summary: Delete tax rate
 *     tags: [Tax Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tax rate deleted successfully
 *       404:
 *         description: Tax rate not found
 */
export const deleteTaxRate = asyncHandler(async (req: Request, res: Response) => {
    const taxRate = await TaxRate.findById(req.params.id);

    if (!taxRate) {
        return res.status(404).json({
            success: false,
            error: 'Tax rate not found',
        });
    }

    // Check if tax rate is used by any products before deleting
    const Product = (await import('../models/Product')).default;
    const isUsed = await Product.exists({ taxClassId: req.params.id });

    if (isUsed) {
        return res.status(400).json({
            success: false,
            error: 'Cannot delete tax rate because it is used by one or more products',
        });
    }

    await TaxRate.findByIdAndDelete(req.params.id);

    // Invalidate tax rate cache
    await invalidateTaxRateCache(req.params.id);

    return res.json({
        success: true,
        message: 'Tax rate deleted successfully',
    });
});
