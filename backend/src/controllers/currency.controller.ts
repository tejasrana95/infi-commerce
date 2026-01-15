import { Response } from 'express';
import { body } from 'express-validator';
import Currency from '../models/Currency';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { invalidateCurrencyCache } from '../utils/cache-invalidation';

// Validation rules
export const createCurrencyValidation = [
    body('code').trim().notEmpty().isLength({ min: 3, max: 3 }).withMessage('Currency code must be 3 characters'),
    body('name').trim().notEmpty().withMessage('Currency name is required'),
    body('symbol').trim().notEmpty().withMessage('Currency symbol is required'),
    body('exchangeRate').isFloat({ min: 0 }).withMessage('Exchange rate must be positive'),
];

/**
 * @swagger
 * /api/currencies:
 *   post:
 *     summary: Create a new currency
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - symbol
 *               - exchangeRate
 *             properties:
 *               code:
 *                 type: string
 *                 example: USD
 *               name:
 *                 type: string
 *                 example: US Dollar
 *               symbol:
 *                 type: string
 *                 example: $
 *               exchangeRate:
 *                 type: number
 *                 example: 1
 *               isBaseCurrency:
 *                 type: boolean
 *               decimalPlaces:
 *                 type: number
 *               symbolPosition:
 *                 type: string
 *                 enum: [before, after]
 *     responses:
 *       201:
 *         description: Currency created successfully
 */
export const createCurrency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code, name, symbol, exchangeRate, isBaseCurrency, decimalPlaces, symbolPosition } = req.body;

    // Check if currency code already exists
    const existingCurrency = await Currency.findOne({ code: code.toUpperCase() });
    if (existingCurrency) {
        throw new AppError('Currency with this code already exists', 400);
    }

    // If setting as base currency, unset other base currencies
    if (isBaseCurrency) {
        await Currency.updateMany({}, { isBaseCurrency: false });
    }

    // Create currency
    const currency = await Currency.create({
        code: code.toUpperCase(),
        name,
        symbol,
        exchangeRate,
        isBaseCurrency: isBaseCurrency || false,
        decimalPlaces: decimalPlaces || 2,
        symbolPosition: symbolPosition || 'before',
    });

    res.status(201).json({
        message: 'Currency created successfully',
        currency,
    });

    // Invalidate currency cache
    await invalidateCurrencyCache();
});

/**
 * @swagger
 * /api/currencies:
 *   get:
 *     summary: Get all currencies
 *     tags: [Currencies]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Currencies retrieved successfully
 */
export const getCurrencies = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { code: searchRegex },
            { symbol: searchRegex }
        ];
    }

    const [currencies, total] = await Promise.all([
        Currency.find(filter)
            .sort({ code: 1 })
            .skip(skip)
            .limit(limit),
        Currency.countDocuments(filter)
    ]);

    res.json({
        success: true,
        currencies,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * @swagger
 * /api/currencies/{code}:
 *   get:
 *     summary: Get currency by code
 *     tags: [Currencies]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Currency retrieved successfully
 *       404:
 *         description: Currency not found
 */
export const getCurrencyByCode = asyncHandler(async (req: AuthRequest, res: Response) => {
    const currency = await Currency.findOne({ code: req.params.code.toUpperCase() });

    if (!currency) {
        throw new AppError('Currency not found', 404);
    }

    res.json({ currency });
});

/**
 * @swagger
 * /api/currencies/{code}:
 *   put:
 *     summary: Update currency
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
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
 *         description: Currency updated successfully
 */
export const updateCurrency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const updates = req.body;
    const currency = await Currency.findOne({ _id: req.params.id });
    if (!currency) {
        throw new AppError('Currency not found', 404);
    }

    // If setting as base currency, unset other base currencies
    if (updates.isBaseCurrency === true) {
        await Currency.updateMany({ code: { $ne: currency.code } }, { isBaseCurrency: false });
    }

    // Update currency
    Object.assign(currency, updates);
    await currency.save();

    // Invalidate currency cache
    await invalidateCurrencyCache();

    res.json({
        message: 'Currency updated successfully',
        currency,
    });
});

/**
 * @swagger
 * /api/currencies/{code}:
 *   delete:
 *     summary: Delete currency
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Currency deleted successfully
 */
export const deleteCurrency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const currency = await Currency.findOne({ _id: req.params.id });

    if (!currency) {
        throw new AppError('Currency not found', 404);
    }

    if (currency.isBaseCurrency) {
        throw new AppError('Cannot delete base currency', 400);
    }

    await currency.deleteOne();

    // Invalidate currency cache
    await invalidateCurrencyCache();

    res.json({
        message: 'Currency deleted successfully',
    });
});

/**
 * @swagger
 * /api/currencies/convert:
 *   post:
 *     summary: Convert amount between currencies
 *     tags: [Currencies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - fromCurrency
 *               - toCurrency
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Amount converted successfully
 */
export const convertCurrency = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
        throw new AppError('Amount, fromCurrency, and toCurrency are required', 400);
    }

    const from = await Currency.findOne({ code: fromCurrency.toUpperCase(), isActive: true });
    const to = await Currency.findOne({ code: toCurrency.toUpperCase(), isActive: true });

    if (!from || !to) {
        throw new AppError('One or both currencies not found or inactive', 404);
    }

    // Convert to base currency first, then to target currency
    const baseAmount = amount / from.exchangeRate;
    const convertedAmount = baseAmount * to.exchangeRate;

    res.json({
        amount,
        fromCurrency: from.code,
        toCurrency: to.code,
        convertedAmount: parseFloat(convertedAmount.toFixed(to.decimalPlaces)),
        exchangeRate: to.exchangeRate / from.exchangeRate,
    });
});

/**
 * @swagger
 * /api/currencies/{code}/rate:
 *   put:
 *     summary: Update exchange rate
 *     tags: [Currencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exchangeRate
 *             properties:
 *               exchangeRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Exchange rate updated successfully
 */
export const updateExchangeRate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { exchangeRate } = req.body;

    if (!exchangeRate || exchangeRate <= 0) {
        throw new AppError('Valid exchange rate is required', 400);
    }

    const currency = await Currency.findOne({ _id: req.params.id });
    if (!currency) {
        throw new AppError('Currency not found', 404);
    }

    currency.exchangeRate = exchangeRate;
    await currency.save();

    // Invalidate currency cache
    await invalidateCurrencyCache();

    res.json({
        message: 'Exchange rate updated successfully',
        currency,
    });
});

/**
 * @swagger
 * /api/currencies/base:
 *   get:
 *     summary: Get base currency
 *     tags: [Currencies]
 *     responses:
 *       200:
 *         description: Base currency retrieved
 */
export const getBaseCurrency = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const currency = await Currency.findOne({ isBaseCurrency: true });

    if (!currency) {
        throw new AppError('No base currency set', 404);
    }

    res.json({ currency });
});
