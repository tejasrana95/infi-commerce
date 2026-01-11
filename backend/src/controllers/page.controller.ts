import { Response } from 'express';
import { body, param } from 'express-validator';
import Page from '../models/Page';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { triggerRevalidation } from '../utils/revalidation';

export const createPageValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
];

export const updatePageValidation = [
    param('id').isMongoId().withMessage('Invalid page ID'),
    body('title').optional().trim().notEmpty(),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
];

/**
 * @swagger
 * /api/pages:
 *   post:
 *     summary: Create a new page
 *     tags: [Pages]
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
 *     responses:
 *       201:
 *         description: Page created successfully
 */
export const createPage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, title, slug, useLayout, layoutId, content, featuredImage, seo, status, showInFooter, footerGroup, showInHeader, template, sortOrder } = req.body;

    const existingPage = await Page.findOne({ storeId, slug });
    if (existingPage) {
        throw new AppError('Page with this slug already exists in this store', 400);
    }

    const page = await Page.create({
        storeId,
        title,
        slug,
        useLayout: useLayout || false,
        layoutId,
        content,
        featuredImage,
        seo,
        status: status || 'draft',
        showInFooter: showInFooter || false,
        footerGroup,
        showInHeader: showInHeader || false,
        template: template || 'default',
        sortOrder: sortOrder || 0,
    });

    res.status(201).json({
        message: 'Page created successfully',
        page,
    });
});

/**
 * @swagger
 * /api/pages:
 *   get:
 *     summary: Get all pages
 *     tags: [Pages]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pages retrieved successfully
 */
export const getPages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter: any = {};

    // Get store ID from multiple sources (header takes priority for API key requests)
    const effectiveStoreId = (req.headers['x-store-id'] || req.query.storeId || req.body?.storeId) as string | undefined;

    // Store filter - optional for super_admin
    if (effectiveStoreId) {
        filter.storeId = effectiveStoreId;
    } else if (req.user?.role === 'super_admin') {
        // Super admin can see all pages
    } else if (req.user?.storeIds?.length) {
        // Store admin sees only their store's pages
        filter.storeId = req.user.storeIds[0];
    }

    if (status) {
        filter.status = status;
    }

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { slug: { $regex: search, $options: 'i' } },
        ];
    }

    const [pages, total] = await Promise.all([
        Page.find(filter)
            .populate('storeId', 'name')
            .sort({ sortOrder: 1, title: 1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        Page.countDocuments(filter),
    ]);

    res.json({
        success: true,
        pages,
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
 * /api/pages/{id}:
 *   get:
 *     summary: Get page by ID
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 */
export const getPageById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = await Page.findById(req.params.id).populate('layoutId');

    if (!page) {
        throw new AppError('Page not found', 404);
    }

    res.json({ page });
});

/**
 * @swagger
 * /api/pages/{id}:
 *   put:
 *     summary: Update page
 *     tags: [Pages]
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
 *         description: Page updated successfully
 */
export const updatePage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const page = await Page.findById(id);
    if (!page) {
        throw new AppError('Page not found', 404);
    }

    if (updates.slug && updates.slug !== page.slug) {
        const existingPage = await Page.findOne({
            storeId: page.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingPage) {
            throw new AppError('Page with this slug already exists in this store', 400);
        }
    }

    Object.assign(page, updates);
    await page.save();

    // Trigger frontend cache revalidation
    triggerRevalidation(page.storeId.toString(), 'page', page.slug).catch(err => {
        console.error('Revalidation failed:', err);
    });

    res.json({
        message: 'Page updated successfully',
        page,
    });
});

/**
 * @swagger
 * /api/pages/{id}:
 *   delete:
 *     summary: Delete page
 *     tags: [Pages]
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
 *         description: Page deleted successfully
 */
export const deletePage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = await Page.findByIdAndDelete(req.params.id);

    if (!page) {
        throw new AppError('Page not found', 404);
    }

    res.json({
        message: 'Page deleted successfully',
    });
});

/**
 * @swagger
 * /api/pages/slug/{slug}:
 *   get:
 *     summary: Get page by slug (public)
 *     tags: [Pages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page retrieved successfully
 */
export const getPageBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;

    // Get store ID from header or query - MANDATORY now
    const storeId = req.headers['x-store-id'] || req.query.storeId;

    if (!storeId) {
        throw new AppError('Store ID is required', 400);
    }

    const filter: any = {
        slug,
        storeId,
        status: 'published'
    };

    const page = await Page.findOne(filter).populate('layoutId');

    if (!page) {
        throw new AppError('Page not found', 404);
    }

    res.json({ data: page });
});
