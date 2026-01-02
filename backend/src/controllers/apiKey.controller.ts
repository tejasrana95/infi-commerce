import { Response } from 'express';
import { body, param } from 'express-validator';
import ApiKey from '../models/ApiKey';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';

// Validation rules
export const createApiKeyValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('channel').isIn(['web', 'mobile', 'third_party', 'internal']).withMessage('Invalid channel'),
    body('allowedIps').optional().isArray(),
    body('allowedIps.*').optional().isIP().withMessage('Invalid IP address'),
    body('validFrom').optional().isISO8601().toDate(),
    body('validUntil').optional().isISO8601().toDate(),
    body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
    body('permissions').isArray({ min: 1 }).withMessage('At least one permission required'),
    body('permissions.*').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    body('storeScope').isIn(['all', 'single']).withMessage('Invalid store scope'),
    body('storeId').optional().isMongoId(),
];

export const updateApiKeyValidation = [
    param('id').isMongoId().withMessage('Invalid API key ID'),
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('channel').optional().isIn(['web', 'mobile', 'third_party', 'internal']),
    body('allowedIps').optional().isArray(),
    body('allowedIps.*').optional().custom((value) => {
        // Allow 0.0.0.0 for "any IP"
        if (value === '0.0.0.0') return true;
        // Validate as IP
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(value)) throw new Error('Invalid IP address');
        return true;
    }),
    body('validFrom').optional().isISO8601().toDate(),
    body('validUntil').optional().isISO8601().toDate(),
    body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
    body('permissions').optional().isArray({ min: 1 }),
    body('permissions.*').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    body('storeScope').optional().isIn(['all', 'single']),
    body('storeId').optional().isMongoId(),
    body('isActive').optional().isBoolean(),
];

/**
 * Create a new API key
 */
export const createApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, channel, allowedIps, validFrom, validUntil, rateLimit, permissions, storeScope, storeId } = req.body;

    // Validate storeId if storeScope is 'single'
    if (storeScope === 'single' && !storeId) {
        throw new AppError('Store ID is required when store scope is single', 400);
    }

    // Generate the API key
    const { key, hash, prefix } = (ApiKey as any).generateKey();

    const apiKey = await ApiKey.create({
        name,
        keyHash: hash,
        keyPrefix: prefix,
        channel: channel || 'third_party',
        allowedIps: allowedIps || ['0.0.0.0'],
        validFrom: validFrom || new Date(),
        validUntil,
        rateLimit,
        permissions: permissions || ['GET'],
        storeScope: storeScope || 'all',
        storeId: storeScope === 'single' ? storeId : undefined,
        createdBy: req.user!.id,
    });

    // Return the plain key ONLY on creation
    res.status(201).json({
        message: 'API key created successfully',
        apiKey: {
            _id: apiKey._id,
            name: apiKey.name,
            key, // Plain key - shown only once!
            keyPrefix: apiKey.keyPrefix,
            channel: apiKey.channel,
            allowedIps: apiKey.allowedIps,
            validFrom: apiKey.validFrom,
            validUntil: apiKey.validUntil,
            rateLimit: apiKey.rateLimit,
            permissions: apiKey.permissions,
            storeScope: apiKey.storeScope,
            storeId: apiKey.storeId,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
        },
    });
});

/**
 * Get all API keys (for admin listing)
 */
export const getApiKeys = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.channel) {
        filter.channel = req.query.channel;
    }

    const [apiKeys, total] = await Promise.all([
        ApiKey.find(filter)
            .select('-keyHash') // Never expose the hash
            .populate('storeId', 'name')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        ApiKey.countDocuments(filter),
    ]);

    res.json({
        apiKeys,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
});

/**
 * Get single API key by ID
 */
export const getApiKeyById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await ApiKey.findById(req.params.id)
        .select('-keyHash')
        .populate('storeId', 'name')
        .populate('createdBy', 'name email');

    if (!apiKey) {
        throw new AppError('API key not found', 404);
    }

    res.json({ apiKey });
});

/**
 * Update an API key
 */
export const updateApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    // Validate storeId if storeScope is being changed to 'single'
    if (updates.storeScope === 'single' && !updates.storeId) {
        // Check if existing key has storeId
        const existing = await ApiKey.findById(id);
        if (!existing?.storeId) {
            throw new AppError('Store ID is required when store scope is single', 400);
        }
    }

    // Remove keyHash from updates if accidentally included
    delete updates.keyHash;
    delete updates.keyPrefix;

    const apiKey = await ApiKey.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
    })
        .select('-keyHash')
        .populate('storeId', 'name')
        .populate('createdBy', 'name email');

    if (!apiKey) {
        throw new AppError('API key not found', 404);
    }

    res.json({
        message: 'API key updated successfully',
        apiKey,
    });
});

/**
 * Delete an API key
 */
export const deleteApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await ApiKey.findByIdAndDelete(req.params.id);

    if (!apiKey) {
        throw new AppError('API key not found', 404);
    }

    res.json({ message: 'API key deleted successfully' });
});

/**
 * Regenerate an API key (creates new key for existing entry)
 */
export const regenerateApiKey = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await ApiKey.findById(req.params.id);

    if (!apiKey) {
        throw new AppError('API key not found', 404);
    }

    // Generate new key
    const { key, hash, prefix } = (ApiKey as any).generateKey();

    apiKey.keyHash = hash;
    apiKey.keyPrefix = prefix;
    apiKey.usageCount = 0; // Reset usage count
    apiKey.lastUsedAt = undefined;
    await apiKey.save();

    res.json({
        message: 'API key regenerated successfully',
        apiKey: {
            _id: apiKey._id,
            name: apiKey.name,
            key, // New plain key - shown only once!
            keyPrefix: apiKey.keyPrefix,
        },
    });
});

/**
 * Toggle API key active status
 */
export const toggleApiKeyStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await ApiKey.findById(req.params.id);

    if (!apiKey) {
        throw new AppError('API key not found', 404);
    }

    apiKey.isActive = !apiKey.isActive;
    await apiKey.save();

    res.json({
        message: `API key ${apiKey.isActive ? 'activated' : 'deactivated'} successfully`,
        apiKey: {
            _id: apiKey._id,
            isActive: apiKey.isActive,
        },
    });
});
