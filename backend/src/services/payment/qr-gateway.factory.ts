import { RazorpayService } from './razorpay.service';
import { PayPalService } from './paypal.service';
import { StripeService } from './stripe.service';
import PaymentGatewayConfig from '../../models/PaymentGatewayConfig';
import { IPosQRService } from './pos-payment.interface';
import { decrypt } from '../../utils/encryption.utils';

export class QRGatewayFactory {

    /**
     * Get the appropriate QR service based on store settings or gateway config
     */
    static async getService(gatewayConfigId: string | any, gatewayType?: string): Promise<IPosQRService> {
        let config;
        let type = gatewayType;

        // If ID provided, fetch config
        if (typeof gatewayConfigId === 'string') {
            config = await PaymentGatewayConfig.findById(gatewayConfigId);
            if (!config) throw new Error('Payment gateway configuration not found');
            type = config.gatewayType; // razorpay, stripes, paypal
        } else {
            // Assume full config object passed or we rely on type
            config = gatewayConfigId;
        }

        if (!type) {
            throw new Error('Gateway provider type is required');
        }

        const credentials = typeof config.credentials === 'string'
            ? decrypt(config.credentials)
            : config.credentials;

        const isTestMode = config.isTestMode || false;

        switch (type) {
            case 'razorpay':
                return new RazorpayService({
                    keyId: credentials.keyId,
                    keySecret: credentials.keySecret
                }, isTestMode);

            case 'stripe':
                return new StripeService({
                    secretKey: credentials.secretKey,
                    publishableKey: credentials.publishableKey
                }, isTestMode);

            case 'paypal':
                return new PayPalService({
                    clientId: credentials.clientId,
                    clientSecret: credentials.clientSecret,
                    mode: isTestMode ? 'sandbox' : 'live'
                }, isTestMode);

            default:
                throw new Error(`Unsupported payment gateway: ${type}`);
        }
    }
}
