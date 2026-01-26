import { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';
import Store from '../models/Store';
import Order from '../models/Order';
import PaymentGatewayConfig from '../models/PaymentGatewayConfig';
import { QRGatewayFactory } from '../services/payment/qr-gateway.factory';
import { QRGenerationParams } from '../services/payment/pos-payment.interface';

/**
 * Generate a QR Code for POS Payment
 */
export const generateQR = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, amount, currency, description, customerDetails } = req.body;
    const storeId = req.headers['x-store-id'] as string;

    if (!storeId) {
        throw new AppError('Store ID header (x-store-id) is missing', 400);
    }

    // 1. Get Store to find Gateway Config
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    let order = null;
    if (orderId) {
        order = await Order.findById(orderId);
    }

    const posSettings = store.posPaymentSettings;
    if (!posSettings || !posSettings.enabledMethods.qr) {
        throw new AppError('QR payments are not enabled for this store', 400);
    }

    const qrSettings = posSettings.qrSettings;

    // 2. Handle Custom QR (Static)
    // If mode is custom, we don't generate Dynamic QR via Gateway usually.
    // We just return the static image URL configured.
    if (qrSettings.mode === 'custom') {
        return res.json({
            success: true,
            data: {
                type: 'custom',
                qrCodeUrl: qrSettings.customConfig?.qrCodeImage,
                instructions: qrSettings.displaySettings.instructions,
                isDynamic: false
            }
        });
    }

    // 3. Handle Gateway QR (Dynamic)
    if (qrSettings.mode === 'gateway') {
        const gatewayConfigId = qrSettings.gatewayConfig?.gatewayId;

        if (!gatewayConfigId) {
            throw new AppError('Gateway configuration is missing for QR payments', 500);
        }

        const gatewayConfig = await PaymentGatewayConfig.findById(gatewayConfigId);
        if (!gatewayConfig) {
            throw new AppError('Gateway configuration not found', 404);
        }
        const gatewayType = gatewayConfig.gatewayType;

        // Get Service
        const qrService = await QRGatewayFactory.getService(gatewayConfig, gatewayType);

        const params: QRGenerationParams = {
            orderId: order ? order._id.toString() : `POS_TEMP_${Date.now()}`,
            storeId: store._id.toString(),
            storeDomain: store.domains?.[0],
            amount: amount || (order ? order.total : 0),
            currency: currency || (order ? order.currency : 'INR'),
            description: description || `POS Order ${order ? order.orderNumber : 'Payment'}`,
            customerDetails: customerDetails || {
                name: 'Guest',
                email: 'guest@pos.local'
            },
            metadata: {
                source: 'pos',
                posUserId: req.user?.id,
                storeName: store.name,
                storeDomain: store.domains?.[0]
            }
        };

        const result = await qrService.generateQR(params);

        // Update Order with QR Details if order exists
        if (order) {
            order.posPaymentDetails = {
                method: 'qr',
                qrDetails: {
                    mode: 'gateway',
                    paymentType: gatewayType || 'unknown',
                    gatewayDetails: {
                        gatewayType: gatewayType || 'unknown',
                        gatewayOrderId: result.gatewayReferenceId || '',
                        gatewayPaymentId: '',
                        qrCodeId: result.qrCodeId,
                        status: 'pending'
                    }
                }
            };
            await order.save(); // Save the initial intent
        }

        return res.json({
            success: true,
            data: {
                type: 'gateway',
                ...result,
                isDynamic: true,
                pollingUrl: `/api/pos-payment/qr/${result.qrCodeId}/status?gateway=${gatewayType}&configId=${gatewayConfigId}`,
                gateway: gatewayType,
                configId: gatewayConfigId
            }
        });
    }

    throw new AppError('Invalid QR configuration', 400);
});

/**
 * Check Status of a QR Payment
 */
export const checkStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // QR Code ID (or Session ID)
    const { gateway, configId, orderId } = req.query;

    if (!configId || !gateway) {
        throw new AppError('Gateway configuration ID and type are required', 400);
    }

    const qrService = await QRGatewayFactory.getService(configId.toString(), gateway.toString());
    const status = await qrService.getQRPaymentStatus(id);
    // If completed, update order
    if (status.status === 'completed' && orderId) {
        const order = await Order.findById(orderId);
        if (order) {
            order.paymentStatus = 'paid';
            order.paymentId = status.paymentId;
            order.paymentMethod = gateway.toString() as any; // Update to actual gateway (stripe, razorpay)

            if (order.posPaymentDetails?.qrDetails?.gatewayDetails) {
                order.posPaymentDetails.qrDetails.gatewayDetails.status = 'completed';
                order.posPaymentDetails.qrDetails.gatewayDetails.gatewayPaymentId = status.paymentId || '';
            }
            await order.save();
        }
    }

    res.json({
        success: true,
        data: status
    });
});

/**
 * Manually Verify a Custom QR Payment
 */
export const verifyManual = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const { referenceNumber, notes } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Ensure it's a POS order intent
    if (!order.posPaymentDetails) {
        order.posPaymentDetails = { method: 'qr' };
    }

    order.posPaymentDetails.method = 'qr'; // Ensure method set
    order.posPaymentDetails.qrDetails = {
        mode: 'custom',
        paymentType: 'manual_qr',
        manualEntry: {
            referenceNumber,
            verifiedBy: req.user?.id as any,
            verifiedAt: new Date(),
            notes
        }
    };

    order.paymentStatus = 'paid';
    order.paymentMethod = 'qr';
    order.paymentId = referenceNumber; // Use reference number as paymentId for manual verification

    await order.save();

    res.json({
        success: true,
        data: order
    });
});

/**
 * Cancel a QR Code (if supported)
 */
export const cancelQR = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { gateway, configId } = req.query;

    if (!configId || !gateway) {
        // If details missing, we just return success as we can't do much upstream
        return res.json({ success: true, message: 'Local cancel only' });
    }

    try {
        const qrService = await QRGatewayFactory.getService(configId.toString(), gateway.toString());
        await qrService.cancelQR(id);
    } catch (e) {
        console.warn('Failed to cancel upstream QR', e);
    }

    return res.json({ success: true });
});
