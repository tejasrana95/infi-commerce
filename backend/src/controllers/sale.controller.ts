import { Response } from 'express';
import { body } from 'express-validator';
import Sale from '../models/Sale';
import Product from '../models/Product';
import Category from '../models/Category';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createSaleValidation = [
    body('name').trim().notEmpty().withMessage('Sale name is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('type').isIn(['percentage', 'fixed']).withMessage('Type must be percentage or fixed'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
    body('applyTo').isIn(['categories', 'products', 'all']).withMessage('Invalid applyTo value'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
];

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Promotions]
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
 *               - storeId
 *               - type
 *               - value
 *               - applyTo
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Holiday Sale
 *               storeId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *                 example: 10
 *               applyTo:
 *                 type: string
 *                 enum: [categories, products, all]
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Sale created successfully
 */
export const createSale = asyncHandler(async (req: AuthRequest, res: Response) => {
    const saleData = req.body;

    // Verify store exists
    const store = await Store.findById(saleData.storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Validate date range
    const startDate = new Date(saleData.startDate);
    const endDate = new Date(saleData.endDate);
    if (endDate <= startDate) {
        throw new AppError('End date must be after start date', 400);
    }

    // Verify categories if applying to categories
    if (saleData.applyTo === 'categories' && saleData.categoryIds) {
        const categories = await Category.find({
            _id: { $in: saleData.categoryIds },
            storeId: saleData.storeId,
        });
        if (categories.length !== saleData.categoryIds.length) {
            throw new AppError('One or more categories not found or do not belong to this store', 400);
        }
    }

    // Verify products if applying to products
    if (saleData.applyTo === 'products' && saleData.productIds) {
        const products = await Product.find({
            _id: { $in: saleData.productIds },
            storeId: saleData.storeId,
        });
        if (products.length !== saleData.productIds.length) {
            throw new AppError('One or more products not found or do not belong to this store', 400);
        }
    }

    // Create sale
    const sale = await Sale.create(saleData);

    // Apply sale to products
    await applySaleToProducts(sale);

    res.status(201).json({
        message: 'Sale created successfully',
        sale,
    });
});

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
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
 *         description: Sales retrieved successfully
 */
export const getSales = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { description: searchRegex }
        ];
    }

    const [sales, total] = await Promise.all([
        Sale.find(filter)
            .populate('storeId', 'name slug')
            .populate('categoryIds', 'title slug')
            .populate('productIds', 'name slug')
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Sale.countDocuments(filter)
    ]);

    res.json({
        sales,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * @swagger
 * /api/sales/active:
 *   get:
 *     summary: Get currently active sales
 *     tags: [Promotions]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active sales retrieved
 */
export const getActiveSales = asyncHandler(async (req: AuthRequest, res: Response) => {
    const now = new Date();
    const filter: any = {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
    };

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    const sales = await Sale.find(filter)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .sort({ priority: -1 });

    res.json({ sales });
});

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Promotions]
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
 *         description: Sale retrieved successfully
 */
export const getSaleById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sale = await Sale.findById(req.params.id)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .populate('productIds', 'name slug');

    if (!sale) {
        throw new AppError('Sale not found', 404);
    }

    res.json({ sale });
});

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Update sale
 *     tags: [Promotions]
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
 *         description: Sale updated successfully
 */
export const updateSale = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const sale = await Sale.findById(id);
    if (!sale) {
        throw new AppError('Sale not found', 404);
    }

    // Validate date range if being updated
    if (updates.startDate || updates.endDate) {
        const startDate = updates.startDate ? new Date(updates.startDate) : sale.startDate;
        const endDate = updates.endDate ? new Date(updates.endDate) : sale.endDate;
        if (endDate <= startDate) {
            throw new AppError('End date must be after start date', 400);
        }
    }

    // Update sale
    Object.assign(sale, updates);
    await sale.save();

    // Re-apply sale to products
    await applySaleToProducts(sale);

    res.json({
        message: 'Sale updated successfully',
        sale,
    });
});

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Delete sale
 *     tags: [Promotions]
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
 *         description: Sale deleted successfully
 */
export const deleteSale = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
        throw new AppError('Sale not found', 404);
    }

    // Remove sale prices from affected products
    await removeSaleFromProducts(sale);

    await sale.deleteOne();

    res.json({
        message: 'Sale deleted successfully',
    });
});

/**
 * @swagger
 * /api/sales/{id}/apply:
 *   post:
 *     summary: Manually apply sale to products
 *     tags: [Promotions]
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
 *         description: Sale applied successfully
 */
export const applySale = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
        throw new AppError('Sale not found', 404);
    }

    const affectedProducts = await applySaleToProducts(sale);

    res.json({
        message: 'Sale applied successfully',
        affectedProductsCount: affectedProducts,
    });
});

// Helper function to apply sale to products
async function applySaleToProducts(sale: any): Promise<number> {
    let filter: any = { storeId: sale.storeId };

    if (sale.applyTo === 'categories') {
        filter.categoryIds = { $in: sale.categoryIds };
    } else if (sale.applyTo === 'products') {
        filter._id = { $in: sale.productIds };
    }
    // If 'all', no additional filter needed

    const products = await Product.find(filter);

    let count = 0;
    for (const product of products) {
        const discount = (sale as any).calculateDiscount(product.price);
        const salePrice = product.price - discount;

        product.salePrice = salePrice;
        product.salePriceStartDate = sale.startDate;
        product.salePriceEndDate = sale.endDate;
        await product.save();
        count++;
    }

    return count;
}

// Helper function to remove sale from products
async function removeSaleFromProducts(sale: any): Promise<number> {
    let filter: any = { storeId: sale.storeId };

    if (sale.applyTo === 'categories') {
        filter.categoryIds = { $in: sale.categoryIds };
    } else if (sale.applyTo === 'products') {
        filter._id = { $in: sale.productIds };
    }

    const result = await Product.updateMany(filter, {
        $unset: { salePrice: '', salePriceStartDate: '', salePriceEndDate: '' },
    });

    return result.modifiedCount;
}
