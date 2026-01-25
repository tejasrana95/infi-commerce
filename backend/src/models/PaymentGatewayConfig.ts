import mongoose, { Schema, Document } from 'mongoose';

/**
 * Payment Gateway Configuration Model
 * Stores payment gateway settings per store with geo-based routing
 */
export interface IPaymentGatewayConfig extends Document {
    storeId: mongoose.Types.ObjectId;
    gatewayType: string; // 'razorpay' | 'stripe' | 'paypal' | 'cod' | custom
    gatewayName: string; // Display name
    displayName?: string; // Custom display name for frontend
    icon?: string; // Icon URL
    geoGroupId?: mongoose.Types.ObjectId; // Which countries use this gateway
    geoRestrictions?: {
        countries?: string[];
    };
    minAmount?: number; // Minimum transaction amount
    maxAmount?: number; // Maximum transaction amount
    extraCharge?: number; // Extra charge (e.g., COD fee)
    order?: number; // Display order priority

    // Flexible credentials - each gateway has different requirements
    credentials: {
        // Razorpay
        keyId?: string;
        keySecret?: string;

        // Stripe
        secretKey?: string;
        publishableKey?: string;

        // PayPal
        clientId?: string;
        clientSecret?: string;
        mode?: 'sandbox' | 'live';

        // Webhook secrets
        webhookSecret?: string;

        // Any custom fields for future gateways
        [key: string]: any;
    };

    // Configuration
    isActive: boolean;
    isTestMode: boolean;
    priority: number; // Higher priority selected first if multiple match

    // Supported features
    features: {
        supportsRefund: boolean;
        supportsPartialRefund: boolean;
        supportsRecurring: boolean;
        supportedCurrencies: string[];
    };

    // Metadata
    description?: string;
    channels?: string[]; // Channels where this gateway is available
    createdAt: Date;
    updatedAt: Date;
}

const PaymentGatewayConfigSchema = new Schema<IPaymentGatewayConfig>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        gatewayType: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        gatewayName: {
            type: String,
            required: true,
            trim: true,
        },
        displayName: {
            type: String,
            trim: true,
        },
        icon: {
            type: String,
            trim: true,
        },
        geoGroupId: {
            type: Schema.Types.ObjectId,
            ref: 'GeoGroup',
            index: true,
        },
        geoRestrictions: {
            countries: [String],
        },
        minAmount: {
            type: Number,
            min: 0,
        },
        maxAmount: {
            type: Number,
            min: 0,
        },
        extraCharge: {
            type: Number,
            default: 0,
            min: 0,
        },
        order: {
            type: Number,
            default: 999,
            comment: 'Display order priority (lower number = higher priority)',
        },
        credentials: {
            type: Schema.Types.Mixed,
            required: true,
            // Credentials are encrypted at application level before saving
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        isTestMode: {
            type: Boolean,
            default: false,
        },
        priority: {
            type: Number,
            default: 0,
            comment: 'Higher priority gateways are selected first',
        },
        features: {
            supportsRefund: {
                type: Boolean,
                default: true,
            },
            supportsPartialRefund: {
                type: Boolean,
                default: true,
            },
            supportsRecurring: {
                type: Boolean,
                default: false,
            },
            supportedCurrencies: {
                type: [String],
                default: ['USD'],
            },
        },
        description: {
            type: String,
            trim: true,
        },
        channels: {
            type: [String],
            index: true,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
PaymentGatewayConfigSchema.index({ storeId: 1, isActive: 1 });
PaymentGatewayConfigSchema.index({ storeId: 1, geoGroupId: 1, isActive: 1 });


// Ensure at least one active gateway per store
PaymentGatewayConfigSchema.pre('save', async function (next) {
    if (!this.isActive) {
        // Check if there's at least one other active gateway for this store
        const activeCount = await PaymentGatewayConfig.countDocuments({
            storeId: this.storeId,
            isActive: true,
            _id: { $ne: this._id },
        });

        if (activeCount === 0) {
            throw new Error('Cannot deactivate the last payment gateway for this store');
        }
    }
    next();
});

const PaymentGatewayConfig = mongoose.model<IPaymentGatewayConfig>(
    'PaymentGatewayConfig',
    PaymentGatewayConfigSchema
);

export default PaymentGatewayConfig;
