import { Response } from 'express';
import { query, body, param } from 'express-validator';
import mongoose from 'mongoose';
import NotificationQueue from '../models/NotificationQueue';
import NotificationTemplate from '../models/NotificationTemplate';
import Store from '../models/Store';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import {
    getDefaultTemplateContent,
    getTemplateTypes,
    getTemplateVariables,
} from '../utils/template-defaults';
import { NotificationPriority } from '../models/NotificationQueue';

// ============================================
// Notification Queue Controller
// ============================================

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notification queue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 */
export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        page = 1,
        limit = 20,
        status,
        channel,
        type,
        priority,
        search,
        startDate,
        endDate,
        storeId = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const filter: any = {};

    if (status) filter.status = status;
    if (channel) filter.channel = channel;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (storeId) filter.storeId = storeId;
    if (search) {
        filter.$or = [
            { recipient: { $regex: search, $options: 'i' } },
            { recipientName: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
        ];
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(String(startDate));
        if (endDate) filter.createdAt.$lte = new Date(String(endDate));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const [notifications, total] = await Promise.all([
        NotificationQueue.find(filter)
            .populate('storeId', 'name')
            .sort({ [String(sortBy)]: sortDirection })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
        NotificationQueue.countDocuments(filter),
    ]);

    res.json({
        success: true,
        notifications,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get single notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification retrieved successfully
 *       404:
 *         description: Notification not found
 */
export const getNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await NotificationQueue.findById(req.params.id)
        .populate('storeId', 'name')
        .populate('templateId', 'name type');

    if (!notification) {
        throw new AppError('Notification not found', 404);
    }

    res.json({ success: true, notification });
});

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get queue statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Queue statistics retrieved successfully
 */
export const getQueueStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const storeId = (req.query.storeId || req.user?.storeIds?.[0]) as string | undefined;
    const stats = await notificationService.getQueueStats(storeId);

    res.json({ success: true, stats });
});

/**
 * @swagger
 * /api/notifications/process:
 *   post:
 *     summary: Process queue (manual trigger)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority: { type: string, enum: [high, normal, low] }
 *               limit: { type: number }
 *     responses:
 *       200:
 *         description: Queue processed successfully
 */
export const processQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { priority = 'normal', limit = 30 } = req.body;

    const result = await notificationService.processQueue(priority, Number(limit));

    res.json({
        success: true,
        message: `Processed ${result.processed} notifications, ${result.failed} failed`,
        ...result,
    });
});

/**
 * Process notification queue (Automated/Cron)
 * GET /api/notifications/processQueue
 * 
 * Processes high, normal, and low priority notifications.
 * Should be called by a frequent cron job (e.g., every 5 minutes).
 */
export const processQueueAutomated = asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = Number(req.query.limit) || 30;

    // Process all priorities: high, then normal, then low
    const results = await Promise.all([
        notificationService.processQueue('high' as NotificationPriority, limit),
        notificationService.processQueue('normal' as NotificationPriority, limit),
        notificationService.processQueue('low' as NotificationPriority, limit)
    ]);

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

    console.log(`[Cron] Processed ${totalProcessed} notifications (${totalFailed} failed)`);

    res.json({
        success: true,
        message: 'Notification queue processed',
        processed: totalProcessed,
        failed: totalFailed,
        details: {
            high: results[0],
            normal: results[1],
            low: results[2]
        }
    });
});

/**
 * @swagger
 * /api/notifications/{id}/retry:
 *   post:
 *     summary: Retry a failed notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification queued for retry
 */
export const retryNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const success = await notificationService.retryNotification(req.params.id);

    res.json({
        success,
        message: success ? 'Notification queued for retry' : 'Failed to retry notification',
    });
});

/**
 * @swagger
 * /api/notifications/{id}/cancel:
 *   post:
 *     summary: Cancel a pending notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification cancelled
 */
export const cancelNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await notificationService.cancelNotification(req.params.id);

    res.json({
        success: true,
        message: 'Notification cancelled',
        notification,
    });
});

// ============================================
// Template Controller
// ============================================

/**
 * @swagger
 * /api/notifications/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: channel
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 */
export const getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, type, channel, page = 1, limit = 20, search } = req.query;

    const filter: any = {};

    // If storeId provided, find templates that include this store
    if (storeId) {
        filter.storeIds = new mongoose.Types.ObjectId(storeId as string);
    }

    if (type) filter.type = type;
    if (channel) filter.channel = channel;

    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } },
        ];
    }

    const [templates, total] = await Promise.all([
        NotificationTemplate.find(filter)
            .sort({ type: 1, channel: 1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean(),
        NotificationTemplate.countDocuments(filter),
    ]);

    // Populate store names for display
    const storeIds = [...new Set(templates.flatMap(t => t.storeIds.map(id => id.toString())))];
    const stores = await Store.find({ _id: { $in: storeIds } }).select('_id name').lean();
    const storeMap = new Map(stores.map(s => [s._id.toString(), s.name]));

    const templatesWithStoreNames = templates.map(t => ({
        ...t,
        storeNames: t.storeIds.map(id => storeMap.get(id.toString()) || 'Unknown'),
    }));

    res.json({
        success: true,
        templates: templatesWithStoreNames,
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
 * /api/notifications/templates/{id}:
 *   get:
 *     summary: Get single template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 */
export const getTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await NotificationTemplate.findById(req.params.id);

    if (!template) {
        throw new AppError('Template not found', 404);
    }

    res.json({ success: true, template });
});

/**
 * Get default template content (static, not from DB)
 */
export const getDefaultTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, channel } = req.query;

    if (!type || !channel) {
        throw new AppError('Type and channel are required', 400);
    }

    const defaultTemplate = getDefaultTemplateContent(
        type as string,
        channel as 'email' | 'sms' | 'whatsapp'
    );

    if (!defaultTemplate) {
        throw new AppError('No default template found for this type and channel', 404);
    }

    res.json({ success: true, template: defaultTemplate });
});

/**
 * Get available template types
 */
export const getTemplateTypesList = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const types = getTemplateTypes();
    res.json({ success: true, types });
});

/**
 * Create new template with uniqueness validation
 * 
 * UNIQUENESS RULE: Only ONE active template per (storeId, type, channel) combination.
 * - If trying to create an active template where one already exists for the same
 *   store+type+channel, it will fail.
 * - Inactive templates can be created without restriction.
 */
export const createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeIds, type, channel, name, subject, htmlContent, textContent, isActive = true } = req.body;

    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
        throw new AppError('At least one store must be selected', 400);
    }

    // Validate stores exist
    const storeObjectIds = storeIds.map((id: string) => new mongoose.Types.ObjectId(id));
    const existingStores = await Store.find({ _id: { $in: storeObjectIds } }).select('_id name').lean();
    if (existingStores.length !== storeIds.length) {
        throw new AppError('One or more stores not found', 400);
    }

    // Check uniqueness constraint if template is active
    if (isActive) {
        // For each store, check if an active template already exists
        const existingActiveTemplates = await NotificationTemplate.find({
            storeIds: { $in: storeObjectIds },
            type,
            channel,
            isActive: true,
        }).lean();

        if (existingActiveTemplates.length > 0) {
            // Find which stores have conflicts
            const conflictingStoreIds = new Set<string>();
            for (const existing of existingActiveTemplates) {
                for (const existingStoreId of existing.storeIds) {
                    if (storeIds.includes(existingStoreId.toString())) {
                        conflictingStoreIds.add(existingStoreId.toString());
                    }
                }
            }

            const conflictingStoreNames = existingStores
                .filter(s => conflictingStoreIds.has(s._id.toString()))
                .map(s => s.name);

            throw new AppError(
                `An active ${type} (${channel}) template already exists for: ${conflictingStoreNames.join(', ')}. ` +
                `Deactivate the existing template first or create this one as inactive.`,
                400
            );
        }
    }

    // Get variables for this template type
    const variables = getTemplateVariables(type);

    const template = await NotificationTemplate.create({
        storeIds: storeObjectIds,
        type,
        channel,
        name,
        subject,
        htmlContent,
        textContent,
        variables,
        isActive,
    });

    res.status(201).json({
        success: true,
        message: 'Template created successfully',
        template,
    });
});

/**
 * @swagger
 * /api/notifications/templates/{id}:
 *   put:
 *     summary: Update existing template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Validation error or conflict
 */
export const updateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { storeIds, name, subject, htmlContent, textContent, isActive } = req.body;

    const template = await NotificationTemplate.findById(id);
    if (!template) {
        throw new AppError('Template not found', 404);
    }

    // If changing storeIds or activating, validate uniqueness
    if (storeIds || isActive === true) {
        const newStoreIds = storeIds
            ? storeIds.map((sid: string) => new mongoose.Types.ObjectId(sid))
            : template.storeIds;
        const newIsActive = isActive !== undefined ? isActive : template.isActive;

        if (newIsActive) {
            // Validate stores exist
            if (storeIds) {
                const existingStores = await Store.find({ _id: { $in: newStoreIds } }).select('_id name').lean();
                if (existingStores.length !== storeIds.length) {
                    throw new AppError('One or more stores not found', 400);
                }
            }

            // Check for conflicts (excluding current template)
            const existingActiveTemplates = await NotificationTemplate.find({
                _id: { $ne: id },
                storeIds: { $in: newStoreIds },
                type: template.type,
                channel: template.channel,
                isActive: true,
            }).lean();

            if (existingActiveTemplates.length > 0) {
                const storeIdsArray = newStoreIds.map((sid: mongoose.Types.ObjectId) => sid.toString());
                const conflictingStoreIds = new Set<string>();
                for (const existing of existingActiveTemplates) {
                    for (const existingStoreId of existing.storeIds) {
                        if (storeIdsArray.includes(existingStoreId.toString())) {
                            conflictingStoreIds.add(existingStoreId.toString());
                        }
                    }
                }

                const stores = await Store.find({ _id: { $in: Array.from(conflictingStoreIds) } }).select('name').lean();
                const conflictingStoreNames = stores.map(s => s.name);

                throw new AppError(
                    `An active ${template.type} (${template.channel}) template already exists for: ${conflictingStoreNames.join(', ')}. ` +
                    `Deactivate the existing template first.`,
                    400
                );
            }
        }

        if (storeIds) {
            template.storeIds = newStoreIds;
        }
    }

    // Update fields
    if (name !== undefined) template.name = name;
    if (subject !== undefined) template.subject = subject;
    if (htmlContent !== undefined) template.htmlContent = htmlContent;
    if (textContent !== undefined) template.textContent = textContent;
    if (isActive !== undefined) template.isActive = isActive;

    await template.save();

    res.json({
        success: true,
        message: 'Template updated successfully',
        template,
    });
});

/**
 * @swagger
 * /api/notifications/templates/{id}:
 *   delete:
 *     summary: Delete template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template deleted successfully
 */
export const deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const template = await NotificationTemplate.findByIdAndDelete(id);
    if (!template) {
        throw new AppError('Template not found', 404);
    }

    res.json({
        success: true,
        message: 'Template deleted successfully',
    });
});

/**
 * @swagger
 * /api/notifications/templates/{id}/toggle:
 *   patch:
 *     summary: Toggle template active status
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template status toggled successfully
 */
export const toggleTemplateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const template = await NotificationTemplate.findById(id);
    if (!template) {
        throw new AppError('Template not found', 404);
    }

    // If activating, check uniqueness constraint
    if (!template.isActive) {
        const existingActiveTemplates = await NotificationTemplate.find({
            _id: { $ne: id },
            storeIds: { $in: template.storeIds },
            type: template.type,
            channel: template.channel,
            isActive: true,
        }).lean();

        if (existingActiveTemplates.length > 0) {
            const conflictingStoreIds = new Set<string>();
            const templateStoreIdStrings = template.storeIds.map(sid => sid.toString());

            for (const existing of existingActiveTemplates) {
                for (const existingStoreId of existing.storeIds) {
                    if (templateStoreIdStrings.includes(existingStoreId.toString())) {
                        conflictingStoreIds.add(existingStoreId.toString());
                    }
                }
            }

            const stores = await Store.find({ _id: { $in: Array.from(conflictingStoreIds) } }).select('name').lean();
            const conflictingStoreNames = stores.map(s => s.name);

            throw new AppError(
                `Cannot activate: An active ${template.type} (${template.channel}) template already exists for: ${conflictingStoreNames.join(', ')}. ` +
                `Deactivate the existing template first.`,
                400
            );
        }
    }

    template.isActive = !template.isActive;
    await template.save();

    res.json({
        success: true,
        message: `Template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
        template,
    });
});

// ============================================
// Validation Rules
// ============================================

export const getNotificationsValidation = [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'processing', 'sent', 'failed', 'cancelled']),
    query('channel').optional().isIn(['email', 'sms', 'whatsapp', 'telegram']),
    query('priority').optional().isIn(['high', 'normal', 'low']),
];

export const processQueueValidation = [
    body('priority').optional().isIn(['high', 'normal', 'low']),
    body('limit').optional().isInt({ min: 1, max: 100 }),
];

export const createTemplateValidation = [
    body('storeIds').isArray({ min: 1 }).withMessage('At least one store must be selected'),
    body('storeIds.*').isMongoId().withMessage('Invalid store ID'),
    body('type').notEmpty().withMessage('Type is required'),
    body('channel').isIn(['email', 'sms', 'whatsapp', 'telegram']).withMessage('Valid channel is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('textContent').notEmpty().withMessage('Text content is required'),
];

export const updateTemplateValidation = [
    param('id').isMongoId().withMessage('Invalid template ID'),
    body('storeIds').optional().isArray({ min: 1 }).withMessage('At least one store must be selected'),
    body('storeIds.*').optional().isMongoId().withMessage('Invalid store ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('textContent').optional().notEmpty().withMessage('Text content cannot be empty'),
];

// ============================================
// Admin Notification Controller
// ============================================

/**
 * @swagger
 * /api/notifications/admin:
 *   get:
 *     summary: Get admin notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Admin notifications retrieved successfully
 */
export const getAdminNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, unreadOnly, recipient } = req.query;

    const result = await notificationService.getAdminNotifications({
        page: Number(page),
        limit: Number(limit),
        unreadOnly: unreadOnly === 'true',
        recipient: recipient as string,
    });

    res.json({
        success: true,
        ...result,
    });
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const success = await notificationService.markAsRead(req.params.id);
    res.json({ success });
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipient } = req.body; // Optional: mark only for specific recipient
    const success = await notificationService.markAllAsRead(recipient);
    res.json({ success });
});

/**
 * Create admin notification (Manual/Test)
 */
export const createAdminNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const notification = await notificationService.createAdminNotification(req.body);
    res.status(201).json({ success: true, notification });
});

export const createAdminNotificationValidation = [
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('recipient').optional().isMongoId().withMessage('Invalid recipient ID'),
];
