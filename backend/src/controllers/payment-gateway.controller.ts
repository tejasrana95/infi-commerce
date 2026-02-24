import { Response } from 'express';
import { body, param } from 'express-validator';
import PaymentGatewayConfig from '../models/PaymentGatewayConfig';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';
import { PaymentGatewayFactory } from '../services/payment/payment-gateway.factory';
import { decrypt, encrypt } from '../utils/encryption.utils';

/**
 * Validation rules
 */
export const createGatewayConfigValidation = [
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('gatewayType').trim().notEmpty().withMessage('Gateway type is required'),
    body('gatewayName').trim().notEmpty().withMessage('Gateway name is required'),
    body('credentials').isObject().withMessage('Credentials object is required'),
];

export const updateGatewayConfigValidation = [
    param('id').isMongoId().withMessage('Valid gateway config ID is required'),
];

/**
 * Simple encryption for credentials (use proper encryption in production)
 */
const encryptCredentials = (credentials: any): string => {
    return encrypt(credentials);
};

/**
 * @route   POST /api/payment-gateways
 * @desc    Create payment gateway configuration
 * @access  Private (Admin/Store Admin)
 */
export const createGatewayConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId,
        gatewayType,
        gatewayName,
        geoGroupId,
        credentials,
        isTestMode,
        priority,
        features,
        description,
    } = req.body;
    const parsedIsTestMode = typeof isTestMode === 'string'
        ? isTestMode.toLowerCase() === 'true'
        : Boolean(isTestMode);

    // Validate gateway type
    if (!PaymentGatewayFactory.isSupported(gatewayType)) {
        throw new AppError(
            `Unsupported gateway type. Supported: ${PaymentGatewayFactory.getSupportedGateways().join(', ')}`,
            400
        );
    }

    // Encrypt credentials before saving
    const encryptedCredentials = encryptCredentials(credentials);

    // Create configuration
    const config = await PaymentGatewayConfig.create({
        storeId,
        gatewayType: gatewayType.toLowerCase(),
        gatewayName,
        geoGroupId,
        credentials: encryptedCredentials,
        isTestMode: parsedIsTestMode,
        priority: priority || 0,
        features: features || {
            supportsRefund: true,
            supportsPartialRefund: true,
            supportsRecurring: false,
            supportedCurrencies: ['USD'],
        },
        description,
    });

    // Don't return credentials in response
    const response: any = config.toObject();
    delete response.credentials;

    res.status(201).json({
        success: true,
        message: 'Payment gateway configured successfully',
        data: response,
    });
});

/**
 * @route   GET /api/payment-gateways
 * @desc    Get all payment gateway configurations
 * @access  Private (Admin/Store Admin)
 */
export const getGatewayConfigs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, isActive, gatewayType, page = 1, limit = 20, search } = req.query;

    const filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (gatewayType) filter.gatewayType = gatewayType;

    if (search) {
        filter.$or = [
            { gatewayName: { $regex: search, $options: 'i' } },
            { gatewayType: { $regex: search, $options: 'i' } },
        ];
    }

    // Channel filter
    if (req.channel) {
        const channelFilter = {
            $or: [
                { channels: req.channel },
                { channels: { $exists: false } },
                { channels: { $size: 0 } }
            ]
        };

        if (filter.$or) {
            filter.$and = filter.$and || [];
            filter.$and.push(channelFilter);
        } else {
            filter.$and = filter.$and || [];
            filter.$and.push(channelFilter);
        }
    }

    const [configs, total] = await Promise.all([
        PaymentGatewayConfig.find(filter)
            .populate('storeId', 'name') // Add store name
            .populate('geoGroupId', 'name countries')
            .select('-credentials') // Don't return credentials
            .sort({ priority: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit)),
        PaymentGatewayConfig.countDocuments(filter),
    ]);

    res.json({
        success: true,
        data: configs,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
});

/**
 * @route   GET /api/payment-gateways/:id
 * @desc    Get payment gateway configuration by ID
 * @access  Private (Admin/Store Admin)
 */
export const getGatewayConfigById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const config = await PaymentGatewayConfig.findById(id)
        .populate('geoGroupId', 'name countries')
        .select('storeId gatewayType gatewayName displayName icon geoGroupId geoRestrictions minAmount maxAmount extraCharge order isActive isTestMode priority features description channels createdAt updatedAt')
        .lean();

    if (!config) {
        throw new AppError('Payment gateway configuration not found', 404);
    }

    res.json({
        success: true,
        data: config,
    });
});

/**
 * @route   PUT /api/payment-gateways/:id
 * @desc    Update payment gateway configuration
 * @access  Private (Admin/Store Admin)
 */
export const updateGatewayConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating storeId or gatewayType
    delete updateData.storeId;
    delete updateData.gatewayType;

    if (updateData.isTestMode !== undefined) {
        updateData.isTestMode = typeof updateData.isTestMode === 'string'
            ? updateData.isTestMode.toLowerCase() === 'true'
            : Boolean(updateData.isTestMode);
    }

    const config = await PaymentGatewayConfig.findById(id);

    if (!config) {
        throw new AppError('Payment gateway configuration not found', 404);
    }

    // Handle credentials merge
    if (updateData.credentials && Object.keys(updateData.credentials).length > 0) {
        let existingCredentials: any = {};
        if (typeof config.credentials === 'string') {
            const decrypted = decrypt(config.credentials);
            existingCredentials = (decrypted && typeof decrypted === 'object') ? decrypted : {};
        } else if (config.credentials && typeof config.credentials === 'object') {
            existingCredentials = config.credentials;
        }

        // Merge with existing credentials to prevent data loss on partial updates
        const mergedCredentials = {
            ...existingCredentials,
            ...updateData.credentials
        };
        updateData.credentials = encryptCredentials(mergedCredentials);
    } else {
        // If credentials are empty, don't update/overwrite them
        delete updateData.credentials;
    }

    // Update fields
    Object.assign(config, updateData);

    // Explicitly mark credentials as modified if they were updated
    if (updateData.credentials) {
        config.markModified('credentials');
    }

    await config.save();

    // Re-populate for response
    await config.populate('geoGroupId', 'name countries');

    // Remove credentials from response for security
    const configObj = config.toObject();
    delete (configObj as any).credentials;

    res.json({
        success: true,
        message: 'Payment gateway configuration updated successfully',
        data: configObj,
    });
});

/**
 * @route   DELETE /api/payment-gateways/:id
 * @desc    Delete payment gateway configuration
 * @access  Private (Admin/Store Admin)
 */
export const deleteGatewayConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const config = await PaymentGatewayConfig.findByIdAndDelete(id);

    if (!config) {
        throw new AppError('Payment gateway configuration not found', 404);
    }

    res.json({
        success: true,
        message: 'Payment gateway configuration deleted successfully',
    });
});

/**
 * @route   POST /api/payment-gateways/available
 * @desc    Get available payment gateways for checkout
 * @access  Public
 */
export const getAvailableGateways = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, country, currency, amount } = req.body;

    if (!storeId || !country) {
        throw new AppError('Store ID and country are required', 400);
    }

    // We can't directly filter by channel in getAvailableGateways service method effectively 
    // unless we update the service signature.
    // However, PaymentService.getAvailableGateways uses PaymentGatewayConfig.find().
    // Ideally we should pass the channel down.

    // For now, let's just make sure we are not calling this yet before updating the service
    // Wait, the service call is next. I need to check PaymentService.

    // Let's defer this specific replacement until I check PaymentService.
    // Actually, I can update the controller to fetch configs first or update the service.
    // Let's assume for now I will update the service too.

    const gateways = await PaymentService.getAvailableGateways({
        storeId,
        country,
        currency,
        amount,
        channel: req.channel
    });

    res.json({
        success: true,
        data: gateways,
    });
});

/**
 * @route   POST /api/payment-gateways/test-connection
 * @desc    Test payment gateway connection
 * @access  Private (Admin/Store Admin)
 */
export const testGatewayConnection = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, gatewayType } = req.body;

    try {
        const gateway = await PaymentService.getGatewayInstance({
            storeId,
            gatewayType,
        });

        // Try to get payment status for a dummy ID (will fail but tests connection)
        await gateway.getPaymentStatus('test_payment_id');

        res.json({
            success: true,
            message: 'Gateway connection successful',
        });
    } catch (error: any) {
        // If it's a "not found" error, connection is working
        if (error.message?.includes('not found') || error.statusCode === 404) {
            res.json({
                success: true,
                message: 'Gateway connection successful',
            });
        } else {
            throw new AppError(`Gateway connection failed: ${error.message}`, 400);
        }
    }
});

/**
 * @route   GET /api/payment-gateways/supported
 * @desc    Get list of supported payment gateways
 * @access  Public
 */
export const getSupportedGateways = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const gateways = PaymentGatewayFactory.getSupportedGateways();

    const gatewayInfo = gateways.map((type) => ({
        type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        requiredCredentials: getRequiredCredentials(type),
    }));

    res.json({
        success: true,
        data: gatewayInfo,
    });
});

/**
 * Helper to get required credentials for each gateway type
 */
const getRequiredCredentials = (gatewayType: string): string[] => {
    switch (gatewayType.toLowerCase()) {
        case 'razorpay':
            return ['keyId', 'keySecret', 'webhookSecret'];
        case 'stripe':
            return ['secretKey', 'publishableKey', 'webhookSecret'];
        case 'paypal':
            return ['clientId', 'clientSecret', 'mode'];
        default:
            return [];
    }
};
