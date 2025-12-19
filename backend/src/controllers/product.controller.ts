import { Response } from 'express';
import { body, param } from 'express-validator';
import Product from '../models/Product';
import Store from '../models/Store';
import Category from '../models/Category';
import Sale from '../models/Sale';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createProductValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('description').notEmpty().withMessage('Description is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('type').isIn(['simple', 'variable', 'digital']).withMessage('Invalid product type'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('categoryIds').optional().isArray().withMessage('Category IDs must be an array'),
];

export const updateProductValidation = [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
];

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productData = req.body;

    // Verify store exists
    const store = await Store.findById(productData.storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Check if SKU already exists
    const existingSKU = await Product.findOne({ sku: productData.sku });
    if (existingSKU) {
        throw new AppError('Product with this SKU already exists', 400);
    }

    // Check if slug exists for this store
    const existingSlug = await Product.findOne({
        storeId: productData.storeId,
        slug: productData.slug,
    });
    if (existingSlug) {
        throw new AppError('Product with this slug already exists in this store', 400);
    }

    // Verify categories exist
    if (productData.categoryIds && productData.categoryIds.length > 0) {
        const categories = await Category.find({
            _id: { $in: productData.categoryIds },
            storeId: productData.storeId,
        });
        if (categories.length !== productData.categoryIds.length) {
            throw new AppError('One or more categories not found or do not belong to this store', 400);
        }
    }

    // Create product
    const product = await Product.create(productData);

    res.status(201).json({
        message: 'Product created successfully',
        product,
    });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isOnSale
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc, popular, rating]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isActive: true };

    // Support comma-separated IDs filter
    if (req.query.ids) {
        const ids = (req.query.ids as string).split(',').map(id => id.trim()).filter(id => id);
        if (ids.length > 0) {
            filter._id = { $in: ids };
        }
    }

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.categoryId) {
        filter.categoryIds = req.query.categoryId;
    }

    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice as string);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice as string);
    }

    if (req.query.isOnSale === 'true') {
        filter.isOnSale = true;
    }

    if (req.query.isFeatured === 'true') {
        filter.isFeatured = true;
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search as string, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { sku: searchRegex },
            { 'variants.sku': searchRegex },
        ];
    }

    // Attribute filters (e.g., ?attr_color=red&attr_size=L)
    const attrFilters: any = {};
    Object.keys(req.query).forEach((key) => {
        if (key.startsWith('attr_')) {
            attrFilters[`attributes.values`] = req.query[key];
        }
    });
    if (Object.keys(attrFilters).length > 0) {
        Object.assign(filter, attrFilters);
    }

    // Build sort
    let sort: any = { createdAt: -1 };
    switch (req.query.sort) {
        case 'newest':
            sort = { createdAt: -1 };
            break;
        case 'oldest':
            sort = { createdAt: 1 };
            break;
        case 'price_asc':
            sort = { price: 1 };
            break;
        case 'price_desc':
            sort = { price: -1 };
            break;
        case 'popular':
            sort = { salesCount: -1 };
            break;
        case 'rating':
            sort = { averageRating: -1 };
            break;
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('storeId', 'name slug domain')
            .populate('categoryIds', 'title slug')
            .populate('attributes.attributeId', 'name slug type values')
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .lean(),
        Product.countDocuments(filter),
    ]);

    res.json({
        products,
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
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findById(req.params.id)
        .populate('storeId', 'name slug domain')
        .populate('categoryIds', 'title slug path')
        .populate('attributes.attributeId', 'name slug type values');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Increment view count
    // Increment view count atomically to prevent version conflicts
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // We don't save the product instance here to avoid race conditions with other updates
    // The previous findById already returned the product data we need

    // Get active sales for this product
    const sales = await (Sale as any).getActiveSalesForProduct(product._id, product.categoryIds);

    res.json({
        product,
        activeSales: sales,
    });
});

/**
 * @swagger
 * /api/products/slug/{storeId}/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
export const getProductBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, slug } = req.params;

    const product = await Product.findOne({ storeId, slug })
        .populate('storeId', 'name slug domain')
        .populate('categoryIds', 'title slug path')
        .populate('attributes.attributeId', 'name slug type values');

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Increment view count atomically to prevent version conflicts
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // We don't save the product instance here to avoid race conditions with other updates
    // The previous findById already returned the product data we need

    res.json({ product });
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findById(id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku !== product.sku) {
        const existingSKU = await Product.findOne({ sku: updates.sku, _id: { $ne: id } });
        if (existingSKU) {
            throw new AppError('Product with this SKU already exists', 400);
        }
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== product.slug) {
        const existingSlug = await Product.findOne({
            storeId: product.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingSlug) {
            throw new AppError('Product with this slug already exists in this store', 400);
        }
    }

    // Remove system fields that shouldn't be updated manually
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;
    // Update product
    Object.assign(product, updates);
    await product.save();

    res.json({
        message: 'Product updated successfully',
        product,
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    res.json({
        message: 'Product deleted successfully',
    });
});

/**
 * @swagger
 * /api/products/{id}/check-shipping:
 *   post:
 *     summary: Check if product can ship to location
 *     tags: [Products]
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
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping availability checked
 */
export const checkShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const { country, state, city } = req.body;
    const canShip = (product as any).canShipTo(country, state, city);

    res.json({
        canShip,
        geoLimit: product.geoLimit,
        message: canShip ? 'Product can be shipped to this location' : 'Product cannot be shipped to this location',
    });
});

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved
 */
export const getFeaturedProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const filter: any = { isActive: true, isFeatured: true };

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    const products = await Product.find(filter)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .limit(limit)
        .sort({ salesCount: -1 });

    res.json({ products });
});

/**
 * @swagger
 * /api/products/on-sale:
 *   get:
 *     summary: Get products on sale
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sale products retrieved
 */
export const getOnSaleProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: any = { isActive: true, isOnSale: true };

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    const products = await Product.find(filter)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .limit(limit)
        .sort({ createdAt: -1 });

    res.json({ products });
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Products]
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
 *               stock:
 *                 type: number
 *               stockStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
export const updateStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { stock, stockStatus } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (stock !== undefined) product.stock = stock;
    if (stockStatus) product.stockStatus = stockStatus;

    await product.save();

    res.json({
        message: 'Stock updated successfully',
        product: {
            _id: product._id,
            stock: product.stock,
            stockStatus: product.stockStatus,
        },
    });
});
