import PaymentGatewayConfig from '../../models/PaymentGatewayConfig';
import GeoGroup from '../../models/GeoGroup';
import { PaymentGatewayFactory } from './payment-gateway.factory';
import { IPaymentGateway } from './payment-gateway.interface';
import { decrypt } from '../../utils/encryption.utils';

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
        amount?: number;
        channel?: string;
    }): Promise<Array<any>> {
        const { storeId, country, currency, amount, channel } = params;

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

        // Channel filter
        if (channel) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { channels: channel },
                    { channels: { $exists: false } },
                    { channels: { $size: 0 } }
                ]
            });
        }

        // Filter by currency if provided
        if (currency) {
            query['features.supportedCurrencies'] = currency.toUpperCase();
        }

        let configs = await PaymentGatewayConfig.find(query)
            .sort({ priority: -1 })
            .select('gatewayType gatewayName displayName icon description extraCharge minAmount maxAmount priority features geoRestrictions');

        // Post-filter for geo-restrictions (legacy array check) and amount limits
        configs = configs.filter(config => {
            // Check legacy geo-restrictions
            if (config.geoRestrictions?.countries && config.geoRestrictions.countries.length > 0) {
                if (!config.geoRestrictions.countries.includes(String(country).toUpperCase())) {
                    return false;
                }
            }

            // Check amount limits
            if (amount !== undefined) {
                if (config.minAmount && amount < config.minAmount) return false;
                if (config.maxAmount && amount > config.maxAmount) return false;
            }

            return true;
        });

        return configs.map((config) => ({
            id: config.gatewayType,
            gatewayType: config.gatewayType,
            gatewayName: config.gatewayType, // Internal ID usage
            name: config.displayName || config.gatewayName,
            type: config.gatewayType === 'cod' ? 'offline' : 'online',
            icon: config.icon,
            description: config.description,
            extraCharge: config.extraCharge || 0,
            available: true,
            supportedCurrencies: config.features?.supportedCurrencies || [],
            priority: config.priority,
        }));
    }

    /**
     * Get payment gateway instance
     */
    static async getGatewayInstance(params: {
        storeId: string;
        gatewayType: string;
        channel?: string;
    }): Promise<IPaymentGateway> {
        const configs = await PaymentGatewayConfig.find({
            storeId: params.storeId,
            gatewayType: params.gatewayType,
            isActive: true,
        }).sort({ priority: -1, isTestMode: 1, updatedAt: -1 });

        const normalizedChannel = params.channel?.toUpperCase();
        const channelMatchedConfigs = normalizedChannel
            ? configs.filter((c: any) => Array.isArray(c.channels) && c.channels.includes(normalizedChannel))
            : [];
        const channelNeutralConfigs = configs.filter(
            (c: any) => !Array.isArray(c.channels) || c.channels.length === 0
        );

        const config =
            channelMatchedConfigs[0] ||
            channelNeutralConfigs[0] ||
            configs[0];

        if (!config) {
            throw new Error(`Payment gateway ${params.gatewayType} not configured for this store`);
        }

        // Decrypt credentials before usage
        const decryptedCredentials = typeof config.credentials === 'string'
            ? decrypt(config.credentials)
            : config.credentials;

        // Guard against mode/credential mismatch that causes "always test" behavior.
        if (config.gatewayType === 'razorpay' && config.isTestMode === false) {
            const keyId = decryptedCredentials?.keyId || decryptedCredentials?.key_id || decryptedCredentials?.apiKey || '';
            if (typeof keyId === 'string' && keyId.startsWith('rzp_test_')) {
                throw new Error('Razorpay gateway is set to Live mode, but test credentials are configured (rzp_test_*). Please update to live keys.');
            }
        }

        return PaymentGatewayFactory.create(
            config.gatewayType,
            decryptedCredentials,
            Boolean(config.isTestMode)
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

        // Decrypt credentials before returning
        const decryptedCredentials = typeof config.credentials === 'string'
            ? decrypt(config.credentials)
            : config.credentials;

        // Return config with decrypted credentials
        return {
            ...config.toObject(),
            credentials: decryptedCredentials,
        };
    }

    /**
     * Select best payment gateway for order
     */
    static async selectGateway(params: {
        storeId: string;
        country: string;
        currency: string;
        preferredGateway?: string;
        channel?: string;
    }): Promise<{
        gatewayType: string;
        gatewayName: string;
        instance: IPaymentGateway;
    }> {
        const availableGateways = await this.getAvailableGateways({
            storeId: params.storeId,
            country: params.country,
            currency: params.currency,
            channel: params.channel,
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
            channel: params.channel,
        });

        return {
            gatewayType: selectedGateway.gatewayType,
            gatewayName: selectedGateway.gatewayName,
            instance,
        };
    }
}
