import { Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Category from '../models/Category';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import cache from '../utils/cache';
import { triggerRevalidation } from '../utils/revalidation';
import { escapeRegExp } from '../utils/search.utils';

// Validation rules
export const createCategoryValidation = [
    body('title').trim().notEmpty().withMessage('Category title is required'),
    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Slug is required')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('description').optional().trim(),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('parentCategory').optional().isMongoId().withMessage('Invalid parent category ID'),
    body('image').optional().custom((value) => {
        if (!value) return true;
        // Allow both regular URLs and localhost URLs
        const urlPattern = /^(https?:\/\/)(localhost(:\d+)?|[\w.-]+)([\/\w.-]*)*\/?$/i;
        if (!urlPattern.test(value)) {
            throw new Error('Image must be a valid URL');
        }
        return true;
    }),
    body('status').optional().isIn(['active', 'inactive', 'draft']).withMessage('Invalid status'),
    body('seo.metaTitle').optional().trim().isLength({ max: 60 }).withMessage('Meta title max 60 characters'),
    body('seo.metaDescription').optional().trim().isLength({ max: 160 }).withMessage('Meta description max 160 characters'),
];

export const updateCategoryValidation = [
    param('id').isMongoId().withMessage('Invalid category ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('description').optional().trim(),
    body('parentCategory').optional().isMongoId().withMessage('Invalid parent category ID'),
    body('image').optional().custom((value) => {
        if (!value) return true;
        // Allow both regular URLs and localhost URLs
        const urlPattern = /^(https?:\/\/)(localhost(:\d+)?|[\w.-]+)([\/\w.-]*)*\/?$/i;
        if (!urlPattern.test(value)) {
            throw new Error('Image must be a valid URL');
        }
        return true;
    }),
    body('status').optional().isIn(['active', 'inactive', 'draft']).withMessage('Invalid status'),
];

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - storeId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Electronics
 *               slug:
 *                 type: string
 *                 example: electronics
 *               description:
 *                 type: string
 *                 example: <p>All electronic products</p>
 *               storeId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               parentCategory:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439012
 *               image:
 *                 type: string
 *                 example: https://example.com/electronics.jpg
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *               seo:
 *                 type: object
 *                 properties:
 *                   metaTitle:
 *                     type: string
 *                   metaDescription:
 *                     type: string
 *                   metaKeywords:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, slug, description, storeId, parentCategory, image, status, seo, sortOrder, isVisible } = req.body;

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(storeId.toString())) {
            throw new AppError('Unauthorized: You can only create categories for your assigned stores', 403);
        }
    }

    // Check if slug already exists for this store
    const existingCategory = await Category.findOne({ storeId, slug });
    if (existingCategory) {
        throw new AppError('Category with this slug already exists in this store', 400);
    }

    // If parent category is provided, verify it exists and belongs to same store
    if (parentCategory) {
        const parent = await Category.findById(parentCategory);
        if (!parent) {
            throw new AppError('Parent category not found', 404);
        }
        console.log(parent.storeId.toString(), storeId);
        if (parent.storeId.toString() !== storeId) {
            throw new AppError('Parent category must belong to the same store', 400);
        }
    }

    // Create category
    const category = await Category.create({
        title,
        slug,
        description,
        storeId,
        parentCategory: parentCategory || null,
        image,
        status: status || 'active',
        seo: seo || {},
        sortOrder: sortOrder || 0,
        isVisible: isVisible !== undefined ? isVisible : true,
    });

    res.status(201).json({
        message: 'Category created successfully',
        category,
    });

    // Invalidate store categories cache
    cache.clearByPrefix(`categories:store:${storeId}`);
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *         description: Filter by store ID
 *       - in: query
 *         name: parentCategory
 *         schema:
 *           type: string
 *         description: Filter by parent category (use 'null' for root categories)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // Support comma-separated IDs filter
    if (req.query.ids) {
        const ids = (req.query.ids as string).split(',').map(id => id.trim()).filter(id => id);
        if (ids.length > 0) {
            filter._id = { $in: ids };
        }
    }

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    // Get store ID from multiple sources (header takes priority for API key requests)
    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    if (isStoreAdmin) {
        if (assignedStoreIds.length === 0) {
            // If store admin has no assigned stores, return empty result
            return res.json({ categories: [], total: 0, pages: 0 });
        }
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.parentCategory !== undefined) {
        filter.parentCategory = req.query.parentCategory === 'null' ? null : req.query.parentCategory;
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search as string, $options: 'i' };
        filter.$or = [
            { title: searchRegex },
            { slug: searchRegex },
            { description: searchRegex }
        ];
    }

    // Get categories with pagination
    const [categories, total] = await Promise.all([
        Category.find(filter)
            .populate('storeId', 'name slug')
            .populate('parentCategory', 'title slug')
            .skip(skip)
            .limit(limit)
            .sort({ sortOrder: 1, title: 1 }),
        Category.countDocuments(filter),
    ]);

    return res.json({
        categories,
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
 * /api/categories/tree/{storeId}:
 *   get:
 *     summary: Get category tree for a store
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 */
export const getCategoryTree = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;
    const cacheKey = `categories:store:${storeId}:tree`;

    const cachedTree = cache.get(cacheKey);
    if (cachedTree) {
        return res.json({ storeId, tree: cachedTree });
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Get all categories for the store
    const categories = await Category.find({ storeId, status: 'active' }).sort({ sortOrder: 1, title: 1 });

    // Build tree structure
    const buildTree = (parentId: any = null): any[] => {
        return categories
            .filter((cat) => {
                if (parentId === null) {
                    return cat.parentCategory === null || cat.parentCategory === undefined;
                }
                return cat.parentCategory && cat.parentCategory.toString() === parentId.toString();
            })
            .map((cat) => ({
                _id: cat._id,
                title: cat.title,
                slug: cat.slug,
                description: cat.description,
                image: cat.image,
                level: cat.level,
                path: cat.path,
                children: buildTree(cat._id),
            }));
    };

    const tree = buildTree();

    cache.set(cacheKey, tree, 600); // 10 minutes for tree

    return res.json({
        storeId,
        tree,
    });
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
export const getCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await Category.findById(req.params.id)
        .populate('storeId', 'name slug')
        .populate('parentCategory', 'title slug');

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    res.json({ category });
});

/**
 * @swagger
 * /api/categories/slug/{storeId}/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
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
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
export const getCategoryBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, slug } = req.params;
    const cacheKey = `categories:store:${storeId}:slug:${slug}`;

    const cachedCategory = cache.get(cacheKey);
    if (cachedCategory) {
        return res.json({ category: cachedCategory });
    }

    const category = await Category.findOne({ storeId, slug })
        .populate('storeId', 'name slug')
        .populate('parentCategory', 'title slug');

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    cache.set(cacheKey, category, 300);

    return res.json({ category });
});

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
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
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               parentCategory:
 *                 type: string
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *               seo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // Find category
    const category = await Category.findById(id);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(category.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update categories for your assigned stores', 403);
        }
    }

    // If slug is being updated, check for conflicts
    if (updates.slug && updates.slug !== category.slug) {
        const existingCategory = await Category.findOne({
            storeId: category.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingCategory) {
            throw new AppError('Category with this slug already exists in this store', 400);
        }
    }

    // If parent category is being updated, validate it
    if (updates.parentCategory !== undefined) {
        if (updates.parentCategory) {
            // Check if trying to set itself as parent
            if (updates.parentCategory === id) {
                throw new AppError('Category cannot be its own parent', 400);
            }

            const parent = await Category.findById(updates.parentCategory);
            if (!parent) {
                throw new AppError('Parent category not found', 404);
            }
            if (parent.storeId.toString() !== updates.storeId.toString()) {
                throw new AppError('Parent category must belong to the same store', 400);
            }
        } else {
            updates.parentCategory = null;
        }
    }

    // Update category
    Object.assign(category, updates);
    await category.save();

    // Invalidate store categories cache
    cache.clearByPrefix(`categories:store:${category.storeId}`);

    // Trigger frontend cache revalidation
    triggerRevalidation(category.storeId.toString(), 'category', category.slug).catch(err => {
        console.error('Revalidation failed:', err);
    });

    return res.json({
        message: 'Category updated successfully',
        category,
    });
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       400:
 *         description: Category has children
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 */
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete categories', 403);
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Check if category has children
    const childrenCount = await Category.countDocuments({ parentCategory: category._id });
    if (childrenCount > 0) {
        throw new AppError('Cannot delete category with child categories. Delete children first.', 400);
    }

    await category.deleteOne();

    // Invalidate store categories cache
    cache.clearByPrefix(`categories:store:${category.storeId}`);

    return res.json({
        message: 'Category deleted successfully',
    });
});

/**
 * @swagger
 * /api/categories/{id}/filters:
 *   get:
 *     summary: Get available filters for a category
 *     tags: [Categories]
 *     description: Returns aggregated filter data from products in this category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: includeSubcategories
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include products from subcategories
 *     responses:
 *       200:
 *         description: Filter data retrieved successfully
 *       404:
 *         description: Category not found
 */
export const getCategoryFilters = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { storeId, includeSubcategories = 'true' } = req.query;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    let categoryIds: string[] | null = null;
    let category = null;

    // Handle "all-products" virtual category
    if (id === 'all-products') {
        // No specific category filter, will aggregate across all products
    } else {
        // Verify category exists
        category = await Category.findById(id);
        if (!category) {
            throw new AppError('Category not found', 404);
        }

        // Get category IDs to filter by (including subcategories if requested)
        categoryIds = [id];
        if (includeSubcategories === 'true') {
            const subcategories = await Category.find({
                storeId,
                path: { $regex: new RegExp(`^${escapeRegExp(category.path)}`) },
            }).select('_id');
            categoryIds = subcategories.map((c) => c._id.toString());
        }
    }

    // Import Product model here to avoid circular dependency
    const Product = require('../models/Product').default;
    const Attribute = require('../models/Attribute').default;

    // Build base match for products
    const baseMatch: any = {
        storeId: require('mongoose').Types.ObjectId.createFromHexString(storeId as string),
        isActive: true,
    };

    // Add category filter if not "all-products"
    if (categoryIds) {
        baseMatch.categoryIds = { $in: categoryIds.map((cid) => require('mongoose').Types.ObjectId.createFromHexString(cid)) };
    }

    // Run aggregation pipelines in parallel
    const [priceRange, brands, tags, ratings, availability, subcategories] = await Promise.all([
        // Price range
        Product.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                },
            },
        ]),

        // Brands with count (lookup brand name from brands collection)
        // Normalize brand to string to handle mixed ObjectId/string storage
        Product.aggregate([
            { $match: { ...baseMatch, brand: { $exists: true, $nin: [null, ''] } } },
            {
                $addFields: {
                    brandIdStr: { $toString: '$brand' },
                },
            },
            { $group: { _id: '$brandIdStr', count: { $sum: 1 } } },
            {
                $addFields: {
                    brandObjectId: { $toObjectId: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brandObjectId',
                    foreignField: '_id',
                    as: 'brandInfo',
                },
            },
            { $unwind: { path: '$brandInfo', preserveNullAndEmptyArrays: true } },
            // Group again by brand _id to merge any remaining duplicates
            {
                $group: {
                    _id: '$brandInfo._id',
                    value: { $first: '$_id' },
                    label: { $first: '$brandInfo.name' },
                    count: { $sum: '$count' },
                },
            },
            { $match: { _id: { $ne: null } } }, // Filter out entries with no brand match
            { $sort: { count: -1 } },
            {
                $project: {
                    value: '$value',
                    label: { $ifNull: ['$label', '$value'] },
                    count: 1,
                    _id: 0,
                },
            },
        ]),

        // Tags with count
        Product.aggregate([
            { $match: baseMatch },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
            { $project: { value: '$_id', label: '$_id', count: 1, _id: 0 } },
        ]),

        // Rating distribution
        Product.aggregate([
            { $match: { ...baseMatch, averageRating: { $exists: true, $ne: null } } },
            {
                $bucket: {
                    groupBy: '$averageRating',
                    boundaries: [0, 1, 2, 3, 4, 5.1],
                    default: 'Other',
                    output: { count: { $sum: 1 } },
                },
            },
        ]),

        // Availability
        Product.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$stockStatus', count: { $sum: 1 } } },
            { $project: { value: '$_id', status: '$_id', count: 1, _id: 0 } },
        ]),

        // Subcategories with product count
        Category.aggregate([
            {
                $match: {
                    storeId: require('mongoose').Types.ObjectId.createFromHexString(storeId as string),
                    // If all-products, show root categories. Else show children of current category
                    parentCategory: id === 'all-products'
                        ? null
                        : require('mongoose').Types.ObjectId.createFromHexString(id),
                    status: 'active',
                },
            },
            {
                $lookup: {
                    from: 'products',
                    let: { catId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $in: ['$$catId', '$categoryIds'] }, isActive: true } },
                        { $count: 'count' },
                    ],
                    as: 'productCount',
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    image: 1,
                    productCount: { $ifNull: [{ $arrayElemAt: ['$productCount.count', 0] }, 0] },
                },
            },
            { $sort: { sortOrder: 1, title: 1 } },
        ]),
    ]);

    // Get filterable attributes with their values
    // Check for isFilterable: true OR missing (for legacy data)
    const filterableAttributes = await Attribute.find({
        storeId: require('mongoose').Types.ObjectId.createFromHexString(storeId as string),
        $or: [{ isFilterable: true }, { isFilterable: { $exists: false } }]
    }).lean();

    // Get attribute values used in products of this category
    // Get attribute values used in products of this category
    const attributeValuesAgg = await Product.aggregate([
        { $match: baseMatch },
        { $unwind: '$specifications' },
        {
            $group: {
                _id: {
                    attributeId: '$specifications.attributeId',
                    value: '$specifications.value',
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.attributeId',
                values: { $push: { value: '$_id.value', count: '$count' } },
            },
        },
    ]);

    // Merge attribute data with aggregated values
    const attributes = filterableAttributes.map((attr: any) => {
        // Use loose comparison or string conversion for IDs to be safe
        const aggData = attributeValuesAgg.find(
            (a: any) => a._id && String(a._id) === String(attr._id)
        );
        return {
            _id: attr._id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            values: aggData ? aggData.values : [],
            options: attr.options || [],
        };
    }).filter((attr: any) => attr.values.length > 0); // Only return attributes with values in this category

    res.json({
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        brands,
        tags,
        ratings: ratings.map((r: any) => ({
            rating: r._id === 'Other' ? null : Math.floor(r._id),
            count: r.count,
        })).filter((r: any) => r.rating !== null),
        availability,
        subcategories,
        attributes,
    });
});
