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
    body('logo').optional().isURL({ require_tld: false }).withMessage('Logo must be a valid URL'),
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
    body('logo').optional().isURL({ require_tld: false }).withMessage('Logo must be a valid URL'),
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
    const { settings, ...otherUpdates } = updates;

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

    // Flatten settings to avoid overwriting the whole object
    const finalUpdates: any = { ...otherUpdates };
    if (settings && typeof settings === 'object') {
        const flattenObject = (obj: any, prefix = 'settings') => {
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                const path = `${prefix}.${key}`;
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    flattenObject(value, path);
                } else {
                    finalUpdates[path] = value;
                }
            });
        };
        flattenObject(settings);
    }

    const store = await Store.findByIdAndUpdate(id, finalUpdates, {
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

// ============================================
// Email Settings Endpoints
// ============================================

/**
 * @swagger
 * /api/stores/{id}/email-settings:
 *   get:
 *     summary: Get store email settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const getEmailSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Return email settings (mask sensitive credentials)
    const settings = store.settings?.emailSettings || null;

    if (settings) {
        // Mask passwords/secrets
        const masked = { ...settings };
        if (masked.smtp?.password) masked.smtp.password = '••••••••';
        if (masked.ses?.secretAccessKey) masked.ses.secretAccessKey = '••••••••';
        if (masked.sendgrid?.apiKey) masked.sendgrid.apiKey = '••••••••';
        if (masked.mailjet?.secretKey) masked.mailjet.secretKey = '••••••••';

        res.json({ success: true, emailSettings: masked });
    } else {
        res.json({ success: true, emailSettings: null });
    }
});

/**
 * @swagger
 * /api/stores/{id}/email-settings:
 *   put:
 *     summary: Update store email settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const updateEmailSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const { provider, fromEmail, fromName, replyTo, rateLimit, smtp, ses, sendgrid, mailjet } = req.body;

    // Validate provider-specific settings
    if (!provider) {
        throw new AppError('Email provider is required', 400);
    }

    if (!fromEmail) {
        throw new AppError('From email is required', 400);
    }

    // Build email settings object
    const emailSettings: any = {
        provider,
        fromEmail,
        fromName: fromName || fromEmail.split('@')[0],
        replyTo: replyTo || fromEmail,
        rateLimit: rateLimit || 30,
    };

    // Add provider-specific settings
    switch (provider) {
        case 'smtp':
            if (!smtp?.host || !smtp?.port || !smtp?.user) {
                throw new AppError('SMTP host, port, and user are required', 400);
            }
            // Preserve existing password if not provided (masked in GET)
            const existingSmtp = store.settings?.emailSettings?.smtp;
            emailSettings.smtp = {
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure ?? true,
                user: smtp.user,
                password: smtp.password === '••••••••' ? existingSmtp?.password : smtp.password,
            };
            break;
        case 'ses':
            if (!ses?.region || !ses?.accessKeyId) {
                throw new AppError('SES region and access key ID are required', 400);
            }
            const existingSes = store.settings?.emailSettings?.ses;
            emailSettings.ses = {
                region: ses.region,
                accessKeyId: ses.accessKeyId,
                secretAccessKey: ses.secretAccessKey === '••••••••' ? existingSes?.secretAccessKey : ses.secretAccessKey,
            };
            break;
        case 'sendgrid':
            const existingSendgrid = store.settings?.emailSettings?.sendgrid;
            emailSettings.sendgrid = {
                apiKey: sendgrid?.apiKey === '••••••••' ? existingSendgrid?.apiKey : sendgrid?.apiKey,
            };
            if (!emailSettings.sendgrid.apiKey) {
                throw new AppError('SendGrid API key is required', 400);
            }
            break;
        case 'mailjet':
            if (!mailjet?.apiKey) {
                throw new AppError('Mailjet API key is required', 400);
            }
            const existingMailjet = store.settings?.emailSettings?.mailjet;
            emailSettings.mailjet = {
                apiKey: mailjet.apiKey,
                secretKey: mailjet.secretKey === '••••••••' ? existingMailjet?.secretKey : mailjet.secretKey,
            };
            break;
        default:
            throw new AppError(`Invalid email provider: ${provider}`, 400);
    }

    // Update store settings
    store.settings = {
        ...store.settings,
        emailSettings,
    };
    await store.save();

    res.json({
        success: true,
        message: 'Email settings updated successfully',
    });
});

/**
 * @swagger
 * /api/stores/{id}/email-settings/test:
 *   post:
 *     summary: Send test email
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const testEmailSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const emailSettings = store.settings?.emailSettings;
    if (!emailSettings) {
        throw new AppError('Email settings not configured', 400);
    }

    const { testEmail } = req.body;
    if (!testEmail) {
        throw new AppError('Test email address is required', 400);
    }

    // Import notification service dynamically to avoid circular deps
    const { notificationService } = await import('../services/notification.service');

    try {
        // Create a test notification and process it immediately
        const notification = await notificationService.queueNotification({
            storeId: store._id.toString(),
            channel: 'email',
            priority: 'high',
            type: 'custom',
            recipient: testEmail,
            recipientName: 'Test User',
            subject: `Test Email from ${store.name}`,
            content: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; margin-bottom: 24px;">Email Configuration Test</h1>
        <p style="color: #666; line-height: 1.6;">Hi {{firstName}},</p>
        <p style="color: #666; line-height: 1.6;">This is a test email from <strong>{{storeName}}</strong>.</p>
        <p style="color: #666; line-height: 1.6;">If you received this email, your email settings are configured correctly!</p>
        <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="margin: 0; color: #0369a1; font-size: 14px;">SMTP/Email provider is working properly</p>
        </div>
       <p style="text-align: center;"><u><small>Powered By Infi Commerce</small></u></p>
    </div>
</body>
</html>`,
            templateData: {
                firstName: 'Test User',
                storeName: store.name,
            },
        });

        // Wait for processing (increased for slow SMTP servers)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Check if sent
        const updated = await (await import('../models/NotificationQueue')).default.findById(notification._id);

        if (updated?.status === 'sent') {
            res.json({
                success: true,
                message: `Test email sent successfully to ${testEmail}`,
            });
        } else if (updated?.status === 'failed') {
            throw new AppError(`Email sending failed: ${updated?.error || 'Unknown error'}`, 500);
        } else if (updated?.status === 'pending' || updated?.status === 'processing') {
            // Still processing - might be slow
            throw new AppError(`Email is still being processed. Status: ${updated?.status}. Please check notification logs.`, 500);
        } else {
            throw new AppError(`Unexpected status: ${updated?.status}. Error: ${updated?.error || 'None'}`, 500);
        }
    } catch (error: any) {
        throw new AppError(`Test email failed: ${error.message}`, 500);
    }
});

// ============================================
// SMS Settings Endpoints
// ============================================

/**
 * @swagger
 * /api/stores/{id}/sms-settings:
 *   get:
 *     summary: Get store SMS settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const getSmsSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const settings = store.settings?.smsSettings || null;

    if (settings) {
        const masked = { ...settings };
        if (masked.twilio?.authToken) masked.twilio.authToken = '••••••••';
        if (masked.msg91?.apiKey) masked.msg91.apiKey = '••••••••';
        if (masked.d7networks?.token) masked.d7networks.token = '••••••••';

        res.json({ success: true, smsSettings: masked });
    } else {
        res.json({ success: true, smsSettings: null });
    }
});

/**
 * @swagger
 * /api/stores/{id}/sms-settings:
 *   put:
 *     summary: Update store SMS settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const updateSmsSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const { enabled, provider, twilio, msg91, d7networks } = req.body;

    if (!provider && enabled) {
        throw new AppError('SMS provider is required when enabled', 400);
    }

    const smsSettings: any = {
        enabled: enabled ?? false,
        provider,
    };

    if (provider === 'twilio') {
        if (!twilio?.accountSid || !twilio?.authToken || !twilio?.fromNumber) {
            throw new AppError('Twilio accountSid, authToken, and fromNumber are required', 400);
        }
        const existingTwilio = store.settings?.smsSettings?.twilio;
        smsSettings.twilio = {
            accountSid: twilio.accountSid,
            authToken: twilio.authToken === '••••••••' ? existingTwilio?.authToken : twilio.authToken,
            fromNumber: twilio.fromNumber,
        };
    } else if (provider === 'msg91') {
        if (!msg91?.apiKey || !msg91?.senderId) {
            throw new AppError('MSG91 apiKey and senderId are required', 400);
        }
        const existingMsg91 = store.settings?.smsSettings?.msg91;
        smsSettings.msg91 = {
            apiKey: msg91.apiKey === '••••••••' ? existingMsg91?.apiKey : msg91.apiKey,
            senderId: msg91.senderId,
            templateId: msg91.templateId,
        };
    } else if (provider === 'd7networks') {
        if (!d7networks?.token || !d7networks?.originator) {
            throw new AppError('D7Networks token and originator are required', 400);
        }
        const existingD7 = store.settings?.smsSettings?.d7networks;
        smsSettings.d7networks = {
            token: d7networks.token === '••••••••' ? existingD7?.token : d7networks.token,
            originator: d7networks.originator,
        };
    }

    store.settings = {
        ...store.settings,
        smsNotifications: enabled,
        smsSettings,
    };
    await store.save();

    res.json({
        success: true,
        message: 'SMS settings updated successfully',
    });
});

// ============================================
// WhatsApp Settings Endpoints
// ============================================

/**
 * @swagger
 * /api/stores/{id}/whatsapp-settings:
 *   get:
 *     summary: Get store WhatsApp settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const getWhatsappSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const settings = store.settings?.whatsappSettings || null;

    if (settings) {
        const masked = { ...settings };
        if (masked.meta?.accessToken) masked.meta.accessToken = '••••••••';
        if (masked.twilio?.authToken) masked.twilio.authToken = '••••••••';
        if (masked.d7networks?.token) masked.d7networks.token = '••••••••';

        res.json({ success: true, whatsappSettings: masked });
    } else {
        res.json({ success: true, whatsappSettings: null });
    }
});

/**
 * @swagger
 * /api/stores/{id}/whatsapp-settings:
 *   put:
 *     summary: Update store WhatsApp settings
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 */
export const updateWhatsappSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const store = await Store.findById(req.params.id);

    if (!store) {
        throw new AppError('Store not found', 404);
    }

    const { enabled, provider, meta, twilio, d7networks } = req.body;

    if (!provider && enabled) {
        throw new AppError('WhatsApp provider is required when enabled', 400);
    }

    const whatsappSettings: any = {
        enabled: enabled ?? false,
        provider,
    };

    if (provider === 'meta') {
        if (!meta?.phoneNumberId || !meta?.accessToken) {
            throw new AppError('Meta phoneNumberId and accessToken are required', 400);
        }
        const existingMeta = store.settings?.whatsappSettings?.meta;
        whatsappSettings.meta = {
            phoneNumberId: meta.phoneNumberId,
            accessToken: meta.accessToken === '••••••••' ? existingMeta?.accessToken : meta.accessToken,
            businessAccountId: meta.businessAccountId,
        };
    } else if (provider === 'twilio') {
        if (!twilio?.accountSid || !twilio?.authToken || !twilio?.fromWhatsAppNumber) {
            throw new AppError('Twilio accountSid, authToken, and fromWhatsAppNumber are required', 400);
        }
        const existingTwilio = store.settings?.whatsappSettings?.twilio;
        whatsappSettings.twilio = {
            accountSid: twilio.accountSid,
            authToken: twilio.authToken === '••••••••' ? existingTwilio?.authToken : twilio.authToken,
            fromWhatsAppNumber: twilio.fromWhatsAppNumber,
        };
    } else if (provider === 'd7networks') {
        if (!d7networks?.token || !d7networks?.originator) {
            throw new AppError('D7Networks token and originator are required', 400);
        }
        const existingD7 = store.settings?.whatsappSettings?.d7networks;
        whatsappSettings.d7networks = {
            token: d7networks.token === '••••••••' ? existingD7?.token : d7networks.token,
            originator: d7networks.originator,
        };
    }

    store.settings = {
        ...store.settings,
        whatsappNotifications: enabled,
        whatsappSettings,
    };
    await store.save();

    res.json({
        success: true,
        message: 'WhatsApp settings updated successfully',
    });
});

// Validation for settings
export const updateSmsSettingsValidation = [
    param('id').isMongoId().withMessage('Invalid store ID'),
    body('enabled').optional().isBoolean(),
    body('provider').optional().isIn(['twilio', 'msg91', 'd7networks']).withMessage('Invalid SMS provider'),
];

export const updateWhatsappSettingsValidation = [
    param('id').isMongoId().withMessage('Invalid store ID'),
    body('enabled').optional().isBoolean(),
    body('provider').optional().isIn(['meta', 'twilio', 'd7networks']).withMessage('Invalid WhatsApp provider'),
];

// Validation for email settings
export const updateEmailSettingsValidation = [
    param('id').isMongoId().withMessage('Invalid store ID'),
    body('provider').isIn(['smtp', 'ses', 'sendgrid', 'mailjet']).withMessage('Invalid email provider'),
    body('fromEmail').isEmail().withMessage('Valid from email is required'),
    body('fromName').optional().isString(),
    body('rateLimit').optional().isInt({ min: 1, max: 100 }),
];

export const testEmailSettingsValidation = [
    param('id').isMongoId().withMessage('Invalid store ID'),
    body('testEmail').isEmail().withMessage('Valid test email is required'),
];
