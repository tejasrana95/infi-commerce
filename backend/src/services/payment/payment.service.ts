import PaymentGatewayConfig from '../../models/PaymentGatewayConfig';
import GeoGroup from '../../models/GeoGroup';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { IPaymentGateway } from './payment-gateway.interface';

/**
 * Payment Service
 * Handles payment gateway selection and operations
 */
export class PaymentService {
    /**
     * Get available payment gateways for a store and country
     */
    static async getAvailableGateways(params: {
        storeId: string;
        country: string;
        currency?: string;
    }): Promise<Array<{
        gatewayType: string;
        gatewayName: string;
        priority: number;
    }>> {
        const { storeId, country, currency } = params;

        // Find geo groups that include this country
        const geoGroups = await GeoGroup.find({
            countries: country,
            isActive: true,
        });

        const geoGroupIds = geoGroups.map((g) => g._id);

        // Find payment gateway configs
        const query: any = {
            storeId,
            isActive: true,
            $or: [
                { geoGroupId: { $in: geoGroupIds } },
                { geoGroupId: { $exists: false } }, // Default gateway (no geo restriction)
            ],
        };

        // Filter by currency if provided
        if (currency) {
            query['features.supportedCurrencies'] = currency.toUpperCase();
        }

        const configs = await PaymentGatewayConfig.find(query)
            .sort({ priority: -1 })
            .select('gatewayType gatewayName priority');

        return configs.map((config) => ({
            gatewayType: config.gatewayType,
            gatewayName: config.gatewayName,
            priority: config.priority,
        }));
    }

    /**
     * Get payment gateway instance
     */
    static async getGatewayInstance(params: {
        storeId: string;
        gatewayType: string;
    }): Promise<IPaymentGateway> {
        const config = await PaymentGatewayConfig.findOne({
            storeId: params.storeId,
            gatewayType: params.gatewayType,
            isActive: true,
        });

        if (!config) {
            throw new Error(`Payment gateway ${params.gatewayType} not configured for this store`);
        }

        return PaymentGatewayFactory.create(
            config.gatewayType,
            config.credentials,
            config.isTestMode
        );
    }

    /**
     * Get gateway config (for webhook verification)
     */
    static async getGatewayConfig(params: {
        storeId: string;
        gatewayType: string;
    }): Promise<any> {
        const config = await PaymentGatewayConfig.findOne({
            storeId: params.storeId,
            gatewayType: params.gatewayType,
            isActive: true,
        });

        if (!config) {
            throw new Error(`Payment gateway ${params.gatewayType} not configured`);
        }

        return config;
    }

    /**
     * Select best payment gateway for order
     */
    static async selectGateway(params: {
        storeId: string;
        country: string;
        currency: string;
        preferredGateway?: string;
    }): Promise<{
        gatewayType: string;
        gatewayName: string;
        instance: IPaymentGateway;
    }> {
        const availableGateways = await this.getAvailableGateways({
            storeId: params.storeId,
            country: params.country,
            currency: params.currency,
        });

        if (availableGateways.length === 0) {
            throw new Error('No payment gateway available for this location');
        }

        // Use preferred gateway if available
        let selectedGateway = availableGateways[0];

        if (params.preferredGateway) {
            const preferred = availableGateways.find(
                (g) => g.gatewayType === params.preferredGateway
            );
            if (preferred) {
                selectedGateway = preferred;
            }
        }

        const instance = await this.getGatewayInstance({
            storeId: params.storeId,
            gatewayType: selectedGateway.gatewayType,
        });

        return {
            gatewayType: selectedGateway.gatewayType,
            gatewayName: selectedGateway.gatewayName,
            instance,
        };
    }
}
