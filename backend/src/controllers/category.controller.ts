import { Response } from 'express';
import { body, param } from 'express-validator';
import Category from '../models/Category';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

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
    body('image').optional().isURL().withMessage('Image must be a valid URL'),
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
    body('image').optional().isURL().withMessage('Image must be a valid URL'),
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

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.parentCategory !== undefined) {
        filter.parentCategory = req.query.parentCategory === 'null' ? null : req.query.parentCategory;
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

    res.json({
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

    res.json({
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

    const category = await Category.findOne({ storeId, slug })
        .populate('storeId', 'name slug')
        .populate('parentCategory', 'title slug');

    if (!category) {
        throw new AppError('Category not found', 404);
    }

    res.json({ category });
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
            if (parent.storeId.toString() !== category.storeId.toString()) {
                throw new AppError('Parent category must belong to the same store', 400);
            }
        } else {
            updates.parentCategory = null;
        }
    }

    // Update category
    Object.assign(category, updates);
    await category.save();

    res.json({
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

    res.json({
        message: 'Category deleted successfully',
    });
});
