import { Response } from 'express';
import { body, param } from 'express-validator';
import PaymentGatewayConfig from '../models/PaymentGatewayConfig';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { PaymentService } from '../services/payment/payment.service';
import { PaymentGatewayFactory } from '../services/payment/payment-gateway.factory';

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
const encryptCredentials = (credentials: any): any => {
    // TODO: Implement proper encryption using crypto
    // For now, just return as-is (should use AES-256 encryption)
    return credentials;
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
        isTestMode: isTestMode || false,
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
    const { storeId, isActive, gatewayType } = req.query;

    const filter: any = {};
    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (gatewayType) filter.gatewayType = gatewayType;

    const configs = await PaymentGatewayConfig.find(filter)
        .populate('geoGroupId', 'name countries')
        .select('-credentials') // Don't return credentials
        .sort({ priority: -1 });

    res.json({
        success: true,
        data: configs,
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
        .select('-credentials'); // Don't return credentials

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

    // Encrypt credentials if provided
    if (updateData.credentials) {
        updateData.credentials = encryptCredentials(updateData.credentials);
    }

    const config = await PaymentGatewayConfig.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate('geoGroupId', 'name countries')
        .select('-credentials');

    if (!config) {
        throw new AppError('Payment gateway configuration not found', 404);
    }

    res.json({
        success: true,
        message: 'Payment gateway configuration updated successfully',
        data: config,
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
    const { storeId, country, currency } = req.body;

    if (!storeId || !country) {
        throw new AppError('Store ID and country are required', 400);
    }

    const gateways = await PaymentService.getAvailableGateways({
        storeId,
        country,
        currency,
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
