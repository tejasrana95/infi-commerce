import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createStoreValidation = [
    body('name').trim().notEmpty().withMessage('Store name is required'),
    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Store slug is required')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('domain')
        .trim()
        .notEmpty()
        .withMessage('Domain is required')
        .custom((value) => {
            // Allow localhost (with optional port) or standard domain format
            const isLocalhost = /^localhost(:\d{1,5})?$/.test(value);
            const isStandardDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value);

            if (!isLocalhost && !isStandardDomain) {
                throw new Error('Invalid domain format');
            }
            return true;
        }),
    body('description').optional().trim(),
    body('logo').optional().isURL().withMessage('Logo must be a valid URL'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code'),
    body('timezone').optional().trim(),
];

export const updateStoreValidation = [
    param('id').isMongoId().withMessage('Invalid store ID'),
    body('name').optional().trim().notEmpty().withMessage('Store name cannot be empty'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('domain')
        .optional()
        .trim()
        .custom((value) => {
            // Allow localhost (with optional port) or standard domain format
            const isLocalhost = /^localhost(:\d{1,5})?$/.test(value);
            const isStandardDomain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(value);

            if (!isLocalhost && !isStandardDomain) {
                throw new Error('Invalid domain format');
            }
            return true;
        }),
    body('description').optional().trim(),
    body('logo').optional().isURL().withMessage('Logo must be a valid URL'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code'),
    body('timezone').optional().trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

/**
 * @swagger
 * /api/stores/domain/{domain}:
 *   get:
 *     summary: Get store by domain
 *     tags: [Stores]
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Store domain
 *     responses:
 *       200:
 *         description: Store details
 *       404:
 *         description: Store not found
 */
export const getStoreByDomain = asyncHandler(async (req: Request, res: Response) => {
    const { domain } = req.params;
    const store = await Store.findOne({ domain, isActive: true });

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    res.json(store);
});

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     description: Create a new store (requires admin authentication)
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
 *               - slug
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Awesome Store
 *               slug:
 *                 type: string
 *                 example: my-awesome-store
 *               domain:
 *                 type: string
 *                 example: mystore.com
 *               description:
 *                 type: string
 *                 example: The best online store for amazing products
 *               logo:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/logo.png
 *               currency:
 *                 type: string
 *                 example: USD
 *                 minLength: 3
 *                 maxLength: 3
 *               timezone:
 *                 type: string
 *                 example: America/New_York
 *               settings:
 *                 type: object
 *                 example: { "theme": "modern", "emailNotifications": true }
 *     responses:
 *       201:
 *         description: Store created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       400:
 *         description: Validation error or store already exists
 *       401:
 *         description: Unauthorized
 */
export const createStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, slug, domain, description, logo, currency, timezone, settings } = req.body;

    // Check if store with slug or domain already exists
    const existingStore = await Store.findOne({
        $or: [{ slug }, { domain }],
    });

    if (existingStore) {
        if (existingStore.slug === slug) {
            throw new AppError('Store with this slug already exists', 400);
        }
        if (existingStore.domain === domain) {
            throw new AppError('Store with this domain already exists', 400);
        }
    }

    // Create new store
    const store = await Store.create({
        name,
        slug,
        domain,
        description,
        logo,
        currency: currency || 'USD',
        timezone: timezone || 'UTC',
        settings: settings || {},
    });

    res.status(201).json({
        message: 'Store created successfully',
        store,
    });
});

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores
 *     tags: [Stores]
 *     description: Retrieve a list of all stores with pagination and filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or domain
 *     responses:
 *       200:
 *         description: List of stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
export const getStores = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { domain: { $regex: req.query.search, $options: 'i' } },
        ];
    }

    // Get stores with pagination
    const [stores, total] = await Promise.all([
        Store.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Store.countDocuments(filter),
    ]);

    res.json({
        stores,
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
 * /api/stores/{id}:
 *   get:
 *     summary: Get store by ID
 *     tags: [Stores]
 *     description: Retrieve a single store by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 */
export const getStoreById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    res.json({ store });
});

/**
 * @swagger
 * /api/stores/slug/{slug}:
 *   get:
 *     summary: Get store by slug
 *     tags: [Stores]
 *     description: Retrieve a single store by its slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug
 *     responses:
 *       200:
 *         description: Store retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 */
export const getStoreBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findOne({ slug: req.params.slug });

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    res.json({ store });
});

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update store
 *     tags: [Stores]
 *     description: Update an existing store (requires admin authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               domain:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *               currency:
 *                 type: string
 *               timezone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Store updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const updateStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // If slug or domain is being updated, check for conflicts
    if (updates.slug || updates.domain) {
        const conflictFilter: any = {
            _id: { $ne: id },
            $or: [],
        };

        if (updates.slug) {
            conflictFilter.$or.push({ slug: updates.slug });
        }
        if (updates.domain) {
            conflictFilter.$or.push({ domain: updates.domain });
        }

        const existingStore = await Store.findOne(conflictFilter);
        if (existingStore) {
            if (existingStore.slug === updates.slug) {
                throw new AppError('Store with this slug already exists', 400);
            }
            if (existingStore.domain === updates.domain) {
                throw new AppError('Store with this domain already exists', 400);
            }
        }
    }

    const store = await Store.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    });

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    res.json({
        message: 'Store updated successfully',
        store,
    });
});

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete store
 *     tags: [Stores]
 *     description: Delete a store (requires admin authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized
 */
export const deleteStore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    res.json({
        message: 'Store deleted successfully',
    });
});

/**
 * @swagger
 * /api/stores/{id}/toggle-status:
 *   patch:
 *     summary: Toggle store active status
 *     tags: [Stores]
 *     description: Activate or deactivate a store (requires admin authentication)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 store:
 *                   $ref: '#/components/schemas/Store'
 *       404:
 *         description: Store not found
 *       401:
 *         description: Unauthorized
 */
export const toggleStoreStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    store.isActive = !store.isActive;
    await store.save();

    res.json({
        message: `Store ${store.isActive ? 'activated' : 'deactivated'} successfully`,
        store,
    });
});
