import { Response } from 'express';
import { body, param } from 'express-validator';
import BlogCategory from '../models/BlogCategory';
import BlogPost from '../models/BlogPost';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import mongoose from 'mongoose';
import { triggerRevalidation } from '../utils/revalidation';


// --- Blog Categories ---

export const createBlogCategoryValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
];

export const updateBlogCategoryValidation = [
    param('id').isMongoId().withMessage('Invalid category ID'),
    body('name').optional().trim().notEmpty(),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
];

/**
 * @swagger
 * /api/blog/categories:
 *   post:
 *     summary: Create a blog category
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeId, name, slug]
 *             properties:
 *               storeId: { type: string }
 *               name: { type: string }
 *               slug: { type: string }
 *     responses:
 *       201:
 *         description: Category created successfully
 */
export const createBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, slug, description, image, parentId, seo, isActive, sortOrder } = req.body;

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(storeId.toString())) {
            throw new AppError('Unauthorized: You can only create blog categories for your assigned stores', 403);
        }
    }

    const existingCategory = await BlogCategory.findOne({ storeId, slug });
    if (existingCategory) {
        throw new AppError('Category with this slug already exists in this store', 400);
    }

    const category = await BlogCategory.create({
        storeId,
        name,
        slug,
        description,
        image,
        parentId,
        seo,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
    });

    res.status(201).json({
        message: 'Blog category created successfully',
        category,
    });
});

/**
 * @swagger
 * /api/blog/categories:
 *   get:
 *     summary: Get blog categories
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
export const getBlogCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    if (isStoreAdmin) {
        if (assignedStoreIds.length === 0) {
            return res.json({ data: [], pagination: { total: 0, page, pages: 0, limit } });
        }
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else {
        const storeId = req.headers['x-store-id'] || req.query.storeId;
        if (storeId) {
            filter.storeId = new mongoose.Types.ObjectId(storeId as string);
        }
    }

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: 'i' };
        filter.$or = [
            { name: searchRegex },
            { slug: searchRegex }
        ];
    }

    const aggregationPipeline: any[] = [
        { $match: filter },
        {
            $lookup: {
                from: 'stores',
                localField: 'storeId',
                foreignField: '_id',
                as: 'storeData'
            }
        },
        {
            $unwind: {
                path: '$storeData',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'blogposts',
                localField: '_id',
                foreignField: 'categoryIds',
                as: 'posts'
            }
        },
        {
            $addFields: {
                postCount: {
                    $size: {
                        $filter: {
                            input: '$posts',
                            as: 'post',
                            cond: { $eq: ['$$post.status', 'published'] }
                        }
                    }
                },
                storeId: {
                    _id: '$storeData._id',
                    name: '$storeData.name',
                    slug: '$storeData.slug'
                }
            }
        },
        { $project: { posts: 0, storeData: 0 } },
        { $sort: { sortOrder: 1, name: 1 } }
    ];

    const [result] = await BlogCategory.aggregate([
        { $match: filter },
        {
            $facet: {
                data: [
                    ...aggregationPipeline.slice(1), // Apply lookup/sort etc
                    { $skip: skip },
                    { $limit: limit }
                ],
                total: [{ $count: 'count' }]
            }
        }
    ]);

    const categories = result.data;
    const total = result.total[0]?.count || 0;

    return res.json({
        success: true,
        categories: categories, // Returning as 'categories' to match other endpoints, or 'data' for compat
        data: categories, // Keep 'data' for backward compatibility
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
 * /api/blog/categories/{id}:
 *   get:
 *     summary: Get blog category by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
export const getBlogCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await BlogCategory.findById(req.params.id).populate('storeId', 'name slug')
    if (!category) {
        throw new AppError('Category not found', 404);
    }
    res.json({ category });
});

/**
 * @swagger
 * /api/blog/categories/{id}:
 *   put:
 *     summary: Update blog category
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
export const updateBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const category = await BlogCategory.findById(id);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(category.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update blog categories for your assigned stores', 403);
        }
    }

    if (updates.slug && updates.slug !== category.slug) {
        const existing = await BlogCategory.findOne({
            storeId: category.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existing) {
            throw new AppError('Slug already exists', 400);
        }
    }

    delete updates.storeId;
    Object.assign(category, updates);
    await category.save();

    res.json({
        message: 'Category updated successfully',
        category,
    });
});

/**
 * @swagger
 * /api/blog/categories/{id}:
 *   delete:
 *     summary: Delete blog category
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
export const deleteBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete blog categories', 403);
    }

    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
        throw new AppError('Category not found', 404);
    }

    // Check if category has posts
    const hasPosts = await BlogPost.exists({ categoryIds: category._id });
    if (hasPosts) {
        throw new AppError('Cannot delete category containing posts', 400);
    }

    // Check if category has subcategories
    const hasChildren = await BlogCategory.exists({ parentId: category._id });
    if (hasChildren) {
        throw new AppError('Cannot delete category containing subcategories', 400);
    }

    await category.deleteOne();
    res.json({ message: 'Category deleted successfully' });
});


// --- Blog Posts ---

export const createBlogPostValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('content').notEmpty().withMessage('Content is required'),
];

/**
 * @swagger
 * /api/blog/posts:
 *   post:
 *     summary: Create a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [storeId, title, slug, content]
 *     responses:
 *       201:
 *         description: Post created successfully
 */
export const createBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, slug, author } = req.body;

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(storeId.toString())) {
            throw new AppError('Unauthorized: You can only create blog posts for your assigned stores', 403);
        }
    }

    const existingPost = await BlogPost.findOne({ storeId, slug });
    if (existingPost) {
        throw new AppError('Post with this slug already exists in this store', 400);
    }

    // Get actual user data for author
    let postAuthor = author;
    if (!postAuthor && req.user?.id) {
        const user = await User.findById(req.user.id).select('firstName lastName');
        if (user) {
            postAuthor = {
                name: `${user.firstName} ${user.lastName}`.trim(),
                userId: req.user.id
            };
        } else {
            postAuthor = {
                name: 'Admin',
                userId: req.user.id
            };
        }
    }

    const post = await BlogPost.create({
        ...req.body,
        author: postAuthor,
    });

    res.status(201).json({
        message: 'Blog post created successfully',
        post,
    });
});

/**
 * @swagger
 * /api/blog/posts:
 *   get:
 *     summary: Get blog posts
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
export const getBlogPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, category, tag, search, limit = 10, page = 1, sortBy = 'date' } = req.query;

    const filter: any = {};

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];
    let storeIdToUse: any = null;

    if (isStoreAdmin) {
        if (assignedStoreIds.length === 0) {
            return res.json({ data: [], pagination: { total: 0, page: Number(page), pages: 0, limit: Number(limit) } });
        }
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
        storeIdToUse = filter.storeId; // storeIdToUse will be an object { $in: [...] }
    } else {
        const storeId = req.headers['x-store-id'] || req.query.storeId;
        if (storeId) {
            filter.storeId = new mongoose.Types.ObjectId(storeId as string);
            storeIdToUse = storeId;
        }
    }

    if (status) filter.status = status;

    // Handle category filter - support both slug and ID
    if (category) {
        // Check if it's a valid MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(category as string);

        if (isObjectId) {
            // It's an ID, use directly
            filter.categoryIds = category;
        } else {
            // It's a slug, look up the category first
            const categoryDoc = await BlogCategory.findOne({
                slug: category,
                ...(storeIdToUse ? { storeId: storeIdToUse } : {})
            });

            if (categoryDoc) {
                filter.categoryIds = categoryDoc._id;
            } else {
                // Category not found, return empty results
                return res.json({
                    data: [],
                    pagination: {
                        total: 0,
                        page: Number(page),
                        pages: 0,
                        limit: Number(limit),
                    }
                });
            }
        }
    }

    if (tag) filter.tags = tag;
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } },
            { content: { $regex: search, $options: 'i' } },
        ];
    }

    let sort: any = { createdAt: -1 };
    if (sortBy === 'views') sort = { viewCount: -1 };
    if (sortBy === 'likes') sort = { likeCount: -1 };

    const posts = await BlogPost.find(filter)
        .populate('storeId', 'name slug')
        .sort(sort)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('categoryIds', 'name slug path parentId level');

    const total = await BlogPost.countDocuments(filter);

    return res.json({
        data: posts,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            limit: Number(limit),
        }
    });
});

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   get:
 *     summary: Get blog post by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 */
export const getBlogPostById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await BlogPost.findById(req.params.id)
        .populate('categoryIds')
        .populate('author.userId', 'username email');

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    res.json({ post });
});

/**
 * @swagger
 * /api/blog/posts/slug/{slug}:
 *   get:
 *     summary: Get blog post by slug (public)
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 */
export const getBlogPostBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;
    const filter: any = { slug, status: 'published' };

    // Get store ID from header (for public routes) or query
    const storeId = req.headers['x-store-id'] || req.query.storeId;

    if (storeId) {
        filter.storeId = storeId;
    }

    const post = await BlogPost.findOne(filter)
        .populate('categoryIds', 'name slug path parentId level')
        .populate('author.userId', 'firstName lastName');

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    res.json({ data: post });
});

/**
 * @swagger
 * /api/blog/posts/tags:
 *   get:
 *     summary: Get popular tags
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 */
export const getPopularTags = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 20 } = req.query;

    const filter: any = { status: 'published' };

    // Get store ID from header (for public routes) or query
    const storeId = req.headers['x-store-id'] || req.query.storeId;

    if (storeId) {
        filter.storeId = storeId;
    }

    const posts = await BlogPost.find(filter).select('tags');
    const tagCounts: Record<string, number> = {};

    posts.forEach(post => {
        post.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, Number(limit))
        .map(([tag]) => tag);

    res.json({ data: sortedTags });
});

/**
 * @swagger
 * /api/blog/posts/{id}/view:
 *   post:
 *     summary: Track blog post view
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: View tracked successfully
 */
export const trackBlogView = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await BlogPost.findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { new: true }
    );

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    res.json({ success: true });
});

/**
 * @swagger
 * /api/blog/posts/{id}/like:
 *   post:
 *     summary: Like blog post
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Like tracked successfully
 */
export const likeBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await BlogPost.findByIdAndUpdate(
        req.params.id,
        { $inc: { likeCount: 1 } },
        { new: true }
    );

    if (!post) {
        throw new AppError('Post not found', 404);
    }

    res.json({ success: true, likeCount: post.likeCount });
});

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   put:
 *     summary: Update blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
export const updateBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const post = await BlogPost.findById(id);
    if (!post) {
        throw new AppError('Post not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(post.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update blog posts for your assigned stores', 403);
        }
    }

    if (updates.slug && updates.slug !== post.slug) {
        const existing = await BlogPost.findOne({
            storeId: post.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existing) {
            throw new AppError('Slug already exists', 400);
        }
    }

    delete updates.storeId;
    Object.assign(post, updates);
    await post.save();

    // Trigger frontend cache revalidation
    triggerRevalidation(post.storeId.toString(), 'blog', post.slug).catch(err => {
        console.error('Revalidation failed:', err);
    });

    res.json({
        message: 'Post updated successfully',
        post,
    });
});

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   delete:
 *     summary: Delete blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */
export const deleteBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete blog posts', 403);
    }

    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
        throw new AppError('Post not found', 404);
    }

    // Update category counts
    if (post.categoryIds && post.categoryIds.length > 0) {
        for (const catId of post.categoryIds) {
            const count = await BlogPost.countDocuments({ categoryIds: catId, status: 'published' });
            await BlogCategory.updateOne({ _id: catId }, { postCount: count });
        }
    }

    res.json({ message: 'Post deleted successfully' });
});
