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
 *     summary: Get all products with SEO-friendly filters
 *     tags: [Products]
 *     description: |
 *       Supports multiple filter formats for SEO-friendly URLs:
 *       - Price range: price=100-500 or minPrice=100&maxPrice=500
 *       - Brand: brand=nike or brand=nike,adidas
 *       - Tags: tags=summer,new-arrival
 *       - Rating: rating=4 (4 stars and above)
 *       - Stock: stock=in-stock,pre-order
 *       - Attributes: color=red,blue or attr_color=red (legacy)
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Single or comma-separated category IDs
 *       - in: query
 *         name: price
 *         schema:
 *           type: string
 *         description: Price range (e.g., 100-500)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Single or comma-separated brands
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating (e.g., 4 for 4+ stars)
 *       - in: query
 *         name: stock
 *         schema:
 *           type: string
 *           enum: [in-stock, out-of-stock, pre-order, backorder]
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
 *           enum: [newest, oldest, price-low, price-high, bestselling, rating, featured, alphabetical]
 *     responses:
 *       200:
 *         description: Products retrieved with active filters metadata
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
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

    // Category filter - support single or multiple categories
    if (req.query.categoryId) {
        const categoryIds = (req.query.categoryId as string).split(',').map(id => id.trim());
        const validCategoryIds = categoryIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/));

        if (validCategoryIds.length > 0) {
            filter.categoryIds = validCategoryIds.length === 1
                ? validCategoryIds[0]
                : { $in: validCategoryIds };
        } else if (categoryIds.includes('all-products')) {
            // Explicitly ignore 'all-products' if passed, treating it as no category filter
        }
    }

    // Price range filter (SEO-friendly: minPrice, maxPrice or price=100-500)
    if (req.query.price) {
        const [min, max] = (req.query.price as string).split('-').map(v => parseFloat(v));
        filter.price = {};
        if (!isNaN(min)) filter.price.$gte = min;
        if (!isNaN(max)) filter.price.$lte = max;
    } else if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice as string);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice as string);
    }

    // Brand filter (SEO-friendly: brand=nike or brand=nike,adidas)
    if (req.query.brand) {
        const brands = (req.query.brand as string).split(',').map(b => b.trim());
        filter.brand = brands.length === 1
            ? { $regex: new RegExp(`^${brands[0]}$`, 'i') }
            : { $in: brands.map(b => new RegExp(`^${b}$`, 'i')) };
    }

    // Tags filter (SEO-friendly: tags=summer,new-arrival)
    if (req.query.tags) {
        const tags = (req.query.tags as string).split(',').map(t => t.trim());
        filter.tags = { $in: tags };
    }

    // Rating filter (SEO-friendly: rating=4 means 4 stars and above)
    if (req.query.rating) {
        const minRating = parseFloat(req.query.rating as string);
        if (!isNaN(minRating)) {
            filter.averageRating = { $gte: minRating };
        }
    }

    // Stock status filter (SEO-friendly: stock=in-stock,pre-order)
    if (req.query.stock) {
        const stockStatuses = (req.query.stock as string).split(',').map(s => s.trim());
        filter.stockStatus = stockStatuses.length === 1
            ? stockStatuses[0]
            : { $in: stockStatuses };
    }

    // Availability shorthand (in_stock=true)
    if (req.query.in_stock === 'true') {
        filter.stockStatus = 'in-stock';
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

    // Attribute filters - support multiple formats:
    // 1. attr_color=red (legacy)
    // 2. color=red,blue (SEO-friendly by attribute slug)
    // 3. filter[color]=red (array format)
    const attrConditions: any[] = [];

    // First, get all filterable attribute slugs if we have storeId
    let filterableAttributeMap: Record<string, any> = {};
    if (req.query.storeId) {
        const Attribute = require('../models/Attribute').default;
        const filterableAttrs = await Attribute.find({
            storeId: req.query.storeId,
            $or: [{ isFilterable: true }, { isFilterable: { $exists: false } }]
        }).select('slug _id').lean();

        filterableAttrs.forEach((a: any) => {
            filterableAttributeMap[a.slug] = a._id;
        });
    }

    Object.keys(req.query).forEach((key) => {
        const value = req.query[key] as string;
        let attrSlug: string | null = null;
        let values: string[] = [];

        // Identify filter type and extract slug
        if (key.startsWith('attr_')) {
            attrSlug = key.replace('attr_', '');
        } else if (key.startsWith('filter[') && key.endsWith(']')) {
            attrSlug = key.slice(7, -1);
        } else if (filterableAttributeMap[key]) {
            attrSlug = key;
        }

        if (attrSlug) {
            values = value.split(',').map(v => v.trim());
            const attrId = filterableAttributeMap[attrSlug];

            if (attrId) {
                // Precise match using attribute ID
                attrConditions.push({
                    specifications: {
                        $elemMatch: {
                            attributeId: attrId,
                            value: values.length === 1 ? values[0] : { $in: values }
                        }
                    }
                });
            } else {
                // Fallback loose match on value if ID not found
                attrConditions.push({
                    'specifications.value': values.length === 1 ? values[0] : { $in: values }
                });
            }
        }
    });

    if (attrConditions.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push(...attrConditions);
    }

    // Build sort - support SEO-friendly sort names
    let sort: any = { createdAt: -1 };
    const sortParam = (req.query.sort as string) || 'newest';
    switch (sortParam) {
        case 'newest':
        case 'new':
            sort = { createdAt: -1 };
            break;
        case 'oldest':
        case 'old':
            sort = { createdAt: 1 };
            break;
        case 'price_asc':
        case 'price-asc':
        case 'price-low':
            sort = { price: 1 };
            break;
        case 'price_desc':
        case 'price-desc':
        case 'price-high':
            sort = { price: -1 };
            break;
        case 'popular':
        case 'bestselling':
        case 'best-selling':
            sort = { salesCount: -1 };
            break;
        case 'rating':
        case 'top-rated':
            sort = { averageRating: -1 };
            break;
        case 'alphabetical':
        case 'name-asc':
            sort = { name: 1 };
            break;
        case 'name-desc':
            sort = { name: -1 };
            break;
        case 'featured':
            sort = { isFeatured: -1, salesCount: -1 };
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

    // Look up brand names for products that have brand IDs
    const brandIds = [...new Set(products.filter(p => p.brand).map(p => p.brand))];
    if (brandIds.length > 0) {
        const Brand = require('../models/Brand').default;
        const mongoose = require('mongoose');
        const validBrandIds = brandIds.filter(id => mongoose.Types.ObjectId.isValid(id));
        if (validBrandIds.length > 0) {
            const brands = await Brand.find({ _id: { $in: validBrandIds } }).select('_id name').lean();
            const brandMap = new Map(brands.map((b: any) => [b._id.toString(), b.name]));

            // Replace brand ID with brand name in products
            products.forEach((product: any) => {
                if (product.brand && brandMap.has(product.brand)) {
                    product.brandName = brandMap.get(product.brand);
                }
            });
        }
    }

    // Build active filters metadata for frontend URL reconstruction
    const activeFilters: Record<string, string | string[]> = {};
    if (req.query.brand) activeFilters.brand = req.query.brand as string;
    if (req.query.tags) activeFilters.tags = req.query.tags as string;
    if (req.query.rating) activeFilters.rating = req.query.rating as string;
    if (req.query.stock) activeFilters.stock = req.query.stock as string;
    if (req.query.price) activeFilters.price = req.query.price as string;
    if (req.query.minPrice || req.query.maxPrice) {
        activeFilters.price = `${req.query.minPrice || 0}-${req.query.maxPrice || ''}`;
    }
    // Add attribute filters
    Object.keys(req.query).forEach(key => {
        if (key.startsWith('attr_')) {
            const attrSlug = key.replace('attr_', '');
            activeFilters[attrSlug] = req.query[key] as string;
        } else if (filterableAttributeMap[key]) {
            activeFilters[key] = req.query[key] as string;
        } else if (key.startsWith('filter[') && key.endsWith(']')) {
            const attrSlug = key.slice(7, -1);
            activeFilters[attrSlug] = req.query[key] as string;
        }
    });

    res.json({
        products,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        activeFilters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        sort: sortParam,
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
