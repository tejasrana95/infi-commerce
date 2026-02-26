import dotenv from 'dotenv';

dotenv.config();

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    staticUrl: process.env.STATIC_URL || 'http://localhost:3003',
    posUrl: process.env.POS_URL || 'http://localhost:3004',
    mfaIssuer: process.env.MFA_ISSUER || 'InfiCommerce',

    database: {
        mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/infi_commerce',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'change_this_secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_this_refresh_secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    cors: {
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',
        posUrl: process.env.POS_URL || 'http://localhost:3004',
    },

    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
        s3Bucket: process.env.AWS_S3_BUCKET || 'infi-commerce-uploads',
    },

    paymentGateways: {
        razorpay: {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        },
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY || '',
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        },
        paypal: {
            clientId: process.env.PAYPAL_CLIENT_ID || '',
            clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
            mode: process.env.PAYPAL_MODE || 'sandbox',
        },
    },

    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
    },

    exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY || '',

    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'infi:',
    },

    memcached: {
        enabled: process.env.MEMCACHED_ENABLED === 'true',
        // Comma-separated list of server:port pairs for cluster support
        servers: process.env.MEMCACHED_SERVERS || '127.0.0.1:11211',
        keyPrefix: process.env.MEMCACHED_KEY_PREFIX || 'infi:',
        // Default item lifetime in seconds
        lifetime: parseInt(process.env.MEMCACHED_LIFETIME || '300', 10),
    },

    categoryCache: {
        enabled: process.env.CATEGORY_API_CACHE_ENABLED !== 'false',
        ttlDays: Math.min(Math.max(parseInt(process.env.CATEGORY_API_CACHE_TTL_DAYS || '7', 10) || 7, 1), 365),
    },

    appName: 'Infi Commerce POS',
};
