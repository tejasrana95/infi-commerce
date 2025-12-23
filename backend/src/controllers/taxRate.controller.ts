import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import TaxRate, { ISubTax } from '../models/TaxRate';
import { asyncHandler } from '../middleware/validation';

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
 * Get all tax rates
 * GET /api/tax-rates
 */
export const getTaxRates = asyncHandler(async (req: Request, res: Response) => {
    const { isActive } = req.query;

    const query: any = {};
    if (isActive !== undefined) {
        query.isActive = isActive === 'true';
    }

    const taxRates = await TaxRate.find(query).sort({ name: 1 });

    return res.json({
        success: true,
        data: taxRates,
        total: taxRates.length,
    });
});

/**
 * Get tax rate by ID
 * GET /api/tax-rates/:id
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
 * Create tax rate
 * POST /api/tax-rates
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

    return res.status(201).json({
        success: true,
        data: taxRate,
        message: 'Tax rate created successfully',
    });
});

/**
 * Update tax rate
 * PUT /api/tax-rates/:id
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

    return res.json({
        success: true,
        data: taxRate,
        message: 'Tax rate updated successfully',
    });
});

/**
 * Delete tax rate
 * DELETE /api/tax-rates/:id
 */
export const deleteTaxRate = asyncHandler(async (req: Request, res: Response) => {
    const taxRate = await TaxRate.findById(req.params.id);

    if (!taxRate) {
        return res.status(404).json({
            success: false,
            error: 'Tax rate not found',
        });
    }

    // TODO: Check if tax rate is used by any products before deleting
    // For now, allow deletion

    await TaxRate.findByIdAndDelete(req.params.id);

    return res.json({
        success: true,
        message: 'Tax rate deleted successfully',
    });
});
