import { Response } from 'express';
import { body, param } from 'express-validator';
import BlogCategory from '../models/BlogCategory';
import BlogPost from '../models/BlogPost';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';


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
 */
export const createBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, name, slug, description, image, parentId, seo, isActive, sortOrder } = req.body;

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
 */
export const getBlogCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filter: any = {};
    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    } else if (req.user?.storeId) {
        filter.storeId = req.user.storeId;
    }

    const categories = await BlogCategory.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ categories });
});

/**
 * @swagger
 * /api/blog/categories/{id}:
 *   get:
 *     summary: Get blog category by ID
 *     tags: [Blog]
 */
export const getBlogCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const category = await BlogCategory.findById(req.params.id);
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
 */
export const updateBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const category = await BlogCategory.findById(id);
    if (!category) {
        throw new AppError('Category not found', 404);
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
 */
export const deleteBlogCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
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
 */
export const createBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId, title, slug, excerpt, content, featuredImage,
        categoryIds, tags, author, relatedProducts, layoutId,
        seo, status, scheduledAt, allowComments, isFeatured, isPinned
    } = req.body;

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
        storeId,
        title,
        slug,
        excerpt,
        content,
        featuredImage,
        categoryIds: categoryIds || [],
        tags: tags || [],
        author: postAuthor,
        relatedProducts: relatedProducts || [],
        layoutId,
        seo,
        status: status || 'draft',
        scheduledAt,
        allowComments: allowComments !== undefined ? allowComments : true,
        isFeatured: isFeatured || false,
        isPinned: isPinned || false,
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
 */
export const getBlogPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, status, categoryId, tag, limit = 10, page = 1 } = req.query;

    const filter: any = {};
    if (storeId) {
        filter.storeId = storeId;
    } else if (req.user?.storeId) {
        filter.storeId = req.user.storeId;
    }

    if (status) filter.status = status;
    if (categoryId) filter.categoryIds = categoryId;
    if (tag) filter.tags = tag;

    const posts = await BlogPost.find(filter)
        .sort({ updatedAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .populate('categoryIds', 'name slug');

    const total = await BlogPost.countDocuments(filter);

    res.json({
        posts,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * @swagger
 * /api/blog/posts/{id}:
 *   get:
 *     summary: Get blog post by ID
 *     tags: [Blog]
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
 * /api/blog/posts/{id}:
 *   put:
 *     summary: Update blog post
 *     tags: [Blog]
 */
export const updateBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const post = await BlogPost.findById(id);
    if (!post) {
        throw new AppError('Post not found', 404);
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
 */
export const deleteBlogPost = asyncHandler(async (req: AuthRequest, res: Response) => {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
        throw new AppError('Post not found', 404);
    }

    // Trigger update of category counts logic which is in middleware or should be manually called?
    // The BlogPost model post schema logic handles updating counts on SAVE, but maybe not on Delete.
    // Let's manually trigger a count update helper or ensure the logic exists.
    // For now, simpler implementation:

    if (post.categoryIds && post.categoryIds.length > 0) {
        for (const catId of post.categoryIds) {
            const count = await BlogPost.countDocuments({ categoryIds: catId, status: 'published' });
            await BlogCategory.updateOne({ _id: catId }, { postCount: count });
        }
    }

    res.json({ message: 'Post deleted successfully' });
});
