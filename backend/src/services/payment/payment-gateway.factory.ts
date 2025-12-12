import { IPaymentGateway } from './payment-gateway.interface';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { PayPalService } from './paypal.service';

/**
 * Payment Gateway Factory
 * Returns the appropriate payment gateway service based on type
 */
export class PaymentGatewayFactory {
    /**
     * Create payment gateway instance
     */
    static create(
        gatewayType: string,
        credentials: any,
        isTestMode: boolean = false
    ): IPaymentGateway {
        switch (gatewayType.toLowerCase()) {
            case 'razorpay':
                return new RazorpayService(credentials, isTestMode);

            case 'stripe':
                return new StripeService(credentials, isTestMode);

            case 'paypal':
                return new PayPalService(credentials, isTestMode);

            // Add more gateways here in the future
            // case 'square':
            //     return new SquareService(credentials, isTestMode);
            // case 'braintree':
            //     return new BraintreeService(credentials, isTestMode);

            default:
                throw new Error(`Unsupported payment gateway: ${gatewayType}`);
        }
    }

    /**
     * Get list of supported gateways
     */
    static getSupportedGateways(): string[] {
        return ['razorpay', 'stripe', 'paypal'];
    }

    /**
     * Check if gateway is supported
     */
    static isSupported(gatewayType: string): boolean {
        return this.getSupportedGateways().includes(gatewayType.toLowerCase());
    }
}
