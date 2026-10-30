import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Setting from '../models/Setting';
import Store from '../models/Store';
import PaymentGatewayConfig from '../models/PaymentGatewayConfig';
import ShippingRule from '../models/ShippingRule';
import ApiKey from '../models/ApiKey';
import { asyncHandler, AppError } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';
import { decryptCredentials } from '../utils/encryption.utils';

interface SearchReplaceTableConfig {
    key: string;
    label: string;
    collection: string;
}

const SEARCH_REPLACE_EXCLUDED_COLLECTIONS = new Set([
    'apikey',
    'apikeys',
    'user',
    'users',
    'customer',
    'customers',
]);

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toTitleCase(value: string): string {
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function humanizeCollectionName(name: string): string {
    const spaced = name
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2');
    return toTitleCase(spaced);
}

async function getSearchReplaceTableConfigs(): Promise<SearchReplaceTableConfig[]> {
    const db = mongoose.connection.db;
    if (!db) {
        throw new AppError('Database connection is not available', 500);
    }

    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    return collections
        .map((c) => c.name || '')
        .filter(Boolean)
        .filter((name) => !name.startsWith('system.'))
        .filter((name) => !SEARCH_REPLACE_EXCLUDED_COLLECTIONS.has(name.toLowerCase()))
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({
            key: name,
            label: humanizeCollectionName(name),
            collection: name,
        }));
}

async function getCollectionQueryForStore(
    collection: mongoose.mongo.Collection,
    storeObjectId: mongoose.Types.ObjectId,
    storeId: string
): Promise<Record<string, any>> {
    const [hasStoreIdField, hasStoreField] = await Promise.all([
        collection.countDocuments({ storeId: { $exists: true } }, { limit: 1 }),
        collection.countDocuments({ store: { $exists: true } }, { limit: 1 }),
    ]);

    if (!hasStoreIdField && !hasStoreField) {
        // Collection is not store-scoped; ignore store filter as requested
        return {};
    }

    return {
        $or: [
            { storeId: storeObjectId },
            { storeId },
            { store: storeObjectId },
            { store: storeId },
        ],
    };
}

function isPlainObject(value: any): value is Record<string, any> {
    return Object.prototype.toString.call(value) === '[object Object]';
}

function replaceTextDeep(
    value: any,
    regex: RegExp,
    replaceValue: string
): { value: any; replacements: number } {
    if (typeof value === 'string') {
        const matches = value.match(regex);
        const count = matches ? matches.length : 0;
        if (count === 0) {
            return { value, replacements: 0 };
        }
        return {
            value: value.replace(regex, replaceValue),
            replacements: count,
        };
    }

    if (Array.isArray(value)) {
        let replacements = 0;
        let changed = false;
        const next = value.map((item) => {
            const result = replaceTextDeep(item, regex, replaceValue);
            if (result.replacements > 0 || result.value !== item) {
                changed = true;
            }
            replacements += result.replacements;
            return result.value;
        });
        return { value: changed ? next : value, replacements };
    }

    if (value instanceof Date || value instanceof mongoose.Types.ObjectId || Buffer.isBuffer(value)) {
        return { value, replacements: 0 };
    }

    if (!isPlainObject(value)) {
        return { value, replacements: 0 };
    }

    let replacements = 0;
    let changed = false;
    const next: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
        const result = replaceTextDeep(val, regex, replaceValue);
        if (result.replacements > 0 || result.value !== val) {
            changed = true;
        }
        replacements += result.replacements;
        next[key] = result.value;
    }

    return { value: changed ? next : value, replacements };
}

/**
 * @swagger
 * /api/settings/admin-branding:
 *   get:
 *     summary: Get admin branding settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Branding settings
 */
export const getAdminBranding = asyncHandler(async (_req: Request, res: Response) => {
    const branding = await Setting.findOne({ key: 'adminBranding' });

    // Default values if not set
    const defaultBranding = {
        name: 'Infi Commerce',
        logo: '',
        favicon: ''
    };

    res.json({
        success: true,
        branding: branding ? branding.value : defaultBranding
    });
});

/**
 * @swagger
 * /api/settings/admin-branding:
 *   put:
 *     summary: Update admin branding settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
export const updateAdminBranding = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, logo, favicon } = req.body;

    const branding = await Setting.findOneAndUpdate(
        { key: 'adminBranding' },
        {
            key: 'adminBranding',
            value: { name, logo, favicon },
            isPublic: true,
            description: 'Global Admin Panel Branding'
        },
        { upsert: true, new: true }
    );

    res.json({
        success: true,
        message: 'Admin branding updated successfully',
        branding: branding.value
    });
});

/**
 * @swagger
 * /api/settings/admin-ai:
 *   get:
 *     summary: Get admin AI settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: AI settings
 *   put:
 *     summary: Update admin AI settings
 *     tags: [Settings]
 */
export const getAdminAiSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await Setting.findOne({ key: 'adminAiSettings' });

    const defaultSettings = {
        enabled: false,
        openaiKey: '',
        model: 'gpt-4o-mini'
    };

    const responseData = settings ? settings.value : defaultSettings;

    // Mask the key for security
    if (responseData.openaiKey) {
        responseData.openaiKey = '********';
    }

    res.json({
        success: true,
        settings: responseData
    });
});

export const updateAdminAiSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { enabled, openaiKey, model } = req.body;

    const existingSettings = await Setting.findOne({ key: 'adminAiSettings' });
    let finalOpenaiKey = openaiKey;

    // If the received key is the mask, use the existing key from DB
    if (openaiKey === '********' && existingSettings?.value?.openaiKey) {
        finalOpenaiKey = existingSettings.value.openaiKey;
    }

    const settings = await Setting.findOneAndUpdate(
        { key: 'adminAiSettings' },
        {
            key: 'adminAiSettings',
            value: { enabled, openaiKey: finalOpenaiKey, model: model || 'gpt-4o-mini' },
            isPublic: false, // AI settings should not be public
            description: 'Global Admin AI Assistant Configuration'
        },
        { upsert: true, new: true }
    );

    res.json({
        success: true,
        message: 'Admin AI settings updated successfully',
        settings: settings.value
    });
});

/**
 * @swagger
 * /api/settings/pos-pwa:
 *   get:
 *     summary: Get POS PWA settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: POS PWA settings
 */
export const getPosPwaSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await Setting.findOne({ key: 'posPwaSettings' });

    const defaultSettings = {
        enabled: false,
        appName: 'POS System',
        appShortName: 'POS',
        themeColor: '#1a1a2e',
        backgroundColor: '#0f0f23',
        icons: {
            icon192: '',
            icon512: '',
            appleTouchIcon: '',
        },
        offlineSettings: {
            cacheTTL: 24,
            precacheProducts: false,
            offlineMessage: 'You are currently offline. Some features may be limited.',
        },
        installPromptStyle: 'toast',
    };

    res.json({
        success: true,
        settings: settings ? settings.value : defaultSettings
    });
});

/**
 * @swagger
 * /api/settings/pos-pwa:
 *   put:
 *     summary: Update POS PWA settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
export const updatePosPwaSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        enabled,
        appName,
        appShortName,
        themeColor,
        backgroundColor,
        icons,
        offlineSettings,
        installPromptStyle
    } = req.body;

    const settings = await Setting.findOneAndUpdate(
        { key: 'posPwaSettings' },
        {
            key: 'posPwaSettings',
            value: {
                enabled,
                appName,
                appShortName,
                themeColor,
                backgroundColor,
                icons,
                offlineSettings,
                installPromptStyle
            },
            isPublic: true, // POS app needs to access this without auth
            description: 'Global POS PWA Configuration'
        },
        { upsert: true, new: true }
    );

    res.json({
        success: true,
        message: 'POS PWA settings updated successfully',
        settings: settings.value
    });
});

/**
 * @swagger
 * /api/settings/search-replace/tables:
 *   get:
 *     summary: Get supported tables for search and replace
 *     tags: [Settings]
 */
export const getSearchReplaceTables = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const tables = await getSearchReplaceTableConfigs();
    res.json({
        success: true,
        tables: tables.map((t) => ({ key: t.key, label: t.label })),
    });
});

/**
 * @swagger
 * /api/settings/search-replace:
 *   post:
 *     summary: Run store-scoped search and replace
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 */
export const runSearchReplace = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        find,
        replace = '',
        storeId,
        tables = 'all',
        dryRun = true,
        caseSensitive = false,
    } = req.body || {};

    if (!find || typeof find !== 'string') {
        throw new AppError('Find text is required', 400);
    }
    if (!storeId || typeof storeId !== 'string' || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw new AppError('Valid storeId is required', 400);
    }

    const availableTables = await getSearchReplaceTableConfigs();

    const requestedTableKeys =
        tables === 'all'
            ? availableTables.map((t) => t.key)
            : Array.isArray(tables)
                ? tables
                : [];

    if (requestedTableKeys.length === 0) {
        throw new AppError('Please select at least one table or use "all"', 400);
    }

    const tableMap = new Map(availableTables.map((t) => [t.key, t]));
    const selectedTables = requestedTableKeys
        .map((key: string) => tableMap.get(key))
        .filter(Boolean) as SearchReplaceTableConfig[];

    if (selectedTables.length === 0) {
        throw new AppError('No valid tables selected', 400);
    }

    const regex = new RegExp(escapeRegex(find), caseSensitive ? 'g' : 'gi');
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const db = mongoose.connection.db;
    if (!db) {
        throw new AppError('Database connection is not available', 500);
    }

    const tableResults: Array<{
        table: string;
        label: string;
        scanned: number;
        matchedRecords: number;
        replacements: number;
        updatedRecords: number;
    }> = [];

    for (const table of selectedTables) {
        const collection = db.collection(table.collection);
        const query = await getCollectionQueryForStore(collection, storeObjectId, storeId);
        const cursor = collection.find(query);

        let scanned = 0;
        let matchedRecords = 0;
        let replacements = 0;
        let updatedRecords = 0;

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            if (!doc) continue;
            scanned++;

            const result = replaceTextDeep(doc, regex, String(replace));
            if (result.replacements <= 0) continue;

            matchedRecords++;
            replacements += result.replacements;

            if (!dryRun) {
                const updatedDoc = result.value;
                const { _id, ...updatePayload } = updatedDoc;
                await collection.updateOne({ _id: doc._id }, { $set: updatePayload });
                updatedRecords++;
            }
        }

        tableResults.push({
            table: table.key,
            label: table.label,
            scanned,
            matchedRecords,
            replacements,
            updatedRecords,
        });
    }

    const summary = tableResults.reduce(
        (acc, item) => {
            acc.scanned += item.scanned;
            acc.matchedRecords += item.matchedRecords;
            acc.replacements += item.replacements;
            acc.updatedRecords += item.updatedRecords;
            return acc;
        },
        { scanned: 0, matchedRecords: 0, replacements: 0, updatedRecords: 0 }
    );

    res.json({
        success: true,
        mode: dryRun ? 'dry-run' : 'live',
        find,
        replace: String(replace),
        caseSensitive: Boolean(caseSensitive),
        tableCount: selectedTables.length,
        summary,
        results: tableResults,
    });
});

/**
 * Get comprehensive store configuration status (read-only, sanitized)
 * Accessible only to authenticated admin/store_admin/super_admin
 */
export const getStoreConfigStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    let storeId = (req.params.storeId as string) || (req.query.storeId as string);

    // If store_admin is restricted to specific stores, restrict access
    if (req.user?.role === 'store_admin' && req.user.storeIds && req.user.storeIds.length > 0) {
        if (!storeId || !req.user.storeIds.includes(storeId)) {
            storeId = req.user.storeIds[0];
        }
    }

    let store = null;
    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
        store = await Store.findById(storeId);
    }

    if (!store) {
        // Fallback to active store or first store
        store = (await Store.findOne({ isActive: true })) || (await Store.findOne());
    }

    if (!store) {
        throw new AppError('No store found in the system', 404);
    }

    const currentStoreId = store._id;

    // Fetch related records in parallel
    const [
        paymentGateways,
        shippingRulesCount,
        activeShippingRulesCount,
        apiKeysCount,
        activeApiKeysCount,
        adminAiDoc,
    ] = await Promise.all([
        PaymentGatewayConfig.find({ storeId: currentStoreId }).sort({ priority: -1 }).lean(),
        ShippingRule.countDocuments({ storeId: currentStoreId }),
        ShippingRule.countDocuments({ storeId: currentStoreId, isActive: true }),
        ApiKey.countDocuments({ $or: [{ storeId: currentStoreId }, { storeScope: 'all' }] }),
        ApiKey.countDocuments({ $or: [{ storeId: currentStoreId }, { storeScope: 'all' }], isActive: true }),
        Setting.findOne({ key: 'adminAiSettings' }).lean(),
    ]);

    const sanitizeSecret = (val?: string | null): string | null => {
        if (!val || typeof val !== 'string') return null;
        const trimmed = val.trim();
        if (!trimmed) return null;
        if (trimmed.length <= 3) return '•••' + trimmed;
        return '••••••••••••' + trimmed.slice(-3);
    };

    const hasSecret = (val?: string | null): boolean => {
        return Boolean(val && typeof val === 'string' && val.trim().length > 0);
    };

    const storeData: any = store;
    const settings: any = storeData.settings || {};
    const aiSettings: any = settings.aiSettings || {};
    const telegramSettings: any = settings.telegramSettings || {};
    const whatsappSettings: any = settings.whatsappSettings || {};
    const smsSettings: any = settings.smsSettings || {};
    const emailSettings: any = settings.emailSettings || {};
    const adminNotifSettings: any = settings.adminNotificationSettings || {};
    const socialLogin: any = settings.socialLogin || {};
    const googleAnalytics: any = settings.googleAnalytics || {};
    const googleMerchant: any = storeData.googleMerchantSettings || {};
    const pwa: any = storeData.pwaSettings || {};
    const cookieConsent: any = storeData.cookieConsentSettings || {};
    const adminAiSettings: any = (adminAiDoc as any)?.value || {};

    // Payment Gateways Sanitization
    const sanitizedGateways = paymentGateways.map((g: any) => {
        const creds: any = decryptCredentials(g.credentials);
        const sanitizedCreds: Record<string, any> = {};

        if (typeof creds === 'object' && creds !== null && !Array.isArray(creds)) {
            Object.keys(creds).forEach((key) => {
                const val = creds[key];
                if (typeof val === 'string') {
                    const lowerK = key.toLowerCase();
                    if (lowerK.includes('mode') || lowerK.includes('environment')) {
                        sanitizedCreds[key] = val;
                    } else {
                        sanitizedCreds[key] = sanitizeSecret(val);
                    }
                } else if (typeof val === 'boolean' || typeof val === 'number') {
                    sanitizedCreds[key] = val;
                }
            });
        } else if (typeof creds === 'string' && creds.trim()) {
            sanitizedCreds['apiKey'] = sanitizeSecret(creds);
        }

        return {
            _id: g._id,
            gatewayType: g.gatewayType,
            gatewayName: g.gatewayName,
            displayName: g.displayName || g.gatewayName,
            isActive: Boolean(g.isActive),
            isTestMode: Boolean(g.isTestMode),
            priority: g.priority || 0,
            features: g.features || {},
            currencies: g.features?.supportedCurrencies || [],
            credentials: sanitizedCreds,
            hasCredentials: Object.values(sanitizedCreds).some((v) => Boolean(v && typeof v === 'string' && v.trim())),
        };
    });

    // Health score checks
    const integrationChecks = [
        { name: 'AI Assistant', configured: Boolean(aiSettings.enabled && hasSecret(aiSettings.openaiKey)) },
        { name: 'Telegram Alerts', configured: Boolean(telegramSettings.enabled && hasSecret(telegramSettings.botToken) && hasSecret(telegramSettings.chatId)) },
        { name: 'Payment Gateways', configured: paymentGateways.some((g: any) => g.isActive) },
        { name: 'Email / SMTP', configured: Boolean(emailSettings?.fromEmail && emailSettings?.smtp?.host) },
        { name: 'WhatsApp', configured: Boolean(whatsappSettings.enabled) },
        { name: 'SMS', configured: Boolean(smsSettings.enabled) },
        { name: 'Google Analytics', configured: Boolean(googleAnalytics.enabled && hasSecret(googleAnalytics.trackingId)) },
        { name: 'Google Merchant', configured: Boolean(googleMerchant.enabled && hasSecret(googleMerchant.merchantId)) },
        { name: 'Social Login', configured: Boolean(socialLogin?.google?.enabled || socialLogin?.facebook?.enabled) },
        { name: 'PWA', configured: Boolean(pwa.enabled) },
    ];

    const configuredCount = integrationChecks.filter((c) => c.configured).length;
    const totalChecks = integrationChecks.length;

    res.json({
        success: true,
        data: {
            store: {
                _id: store._id,
                name: store.name,
                slug: store.slug,
                domains: store.domains || [],
                currency: store.currency,
                timezone: store.timezone,
                isActive: store.isActive,
                logo: store.logo,
                createdAt: store.createdAt,
            },
            overview: {
                configuredCount,
                totalChecks,
                healthScore: Math.round((configuredCount / totalChecks) * 100),
                activeGatewaysCount: paymentGateways.filter((g: any) => g.isActive).length,
                totalGatewaysCount: paymentGateways.length,
                shippingRulesCount,
                activeShippingRulesCount,
                apiKeysCount,
                activeApiKeysCount,
            },
            ai: {
                storeAi: {
                    enabled: Boolean(aiSettings.enabled),
                    model: aiSettings.model || 'gpt-5-mini',
                    hasKey: hasSecret(aiSettings.openaiKey),
                    tokenLast3: sanitizeSecret(aiSettings.openaiKey),
                },
                adminAi: {
                    enabled: Boolean(adminAiSettings.enabled),
                    model: adminAiSettings.model || 'gpt-4o-mini',
                    hasKey: hasSecret(adminAiSettings.openaiKey),
                    tokenLast3: sanitizeSecret(adminAiSettings.openaiKey),
                },
            },
            telegram: {
                enabled: Boolean(telegramSettings.enabled),
                hasBotToken: hasSecret(telegramSettings.botToken),
                botTokenLast3: sanitizeSecret(telegramSettings.botToken),
                hasChatId: hasSecret(telegramSettings.chatId),
                chatIdLast3: sanitizeSecret(telegramSettings.chatId),
                notifications: telegramSettings.notifications || {
                    newOrder: false,
                    orderStatus: false,
                    returnRequest: false,
                    orderCancel: false,
                    newCustomer: false,
                },
            },
            paymentGateways: {
                total: paymentGateways.length,
                active: paymentGateways.filter((g: any) => g.isActive).length,
                testMode: paymentGateways.filter((g: any) => g.isActive && g.isTestMode).length,
                live: paymentGateways.filter((g: any) => g.isActive && !g.isTestMode).length,
                list: sanitizedGateways,
            },
            email: {
                configured: Boolean(emailSettings?.fromEmail && emailSettings?.smtp?.host),
                provider: emailSettings.provider || 'smtp',
                fromEmail: emailSettings.fromEmail || '',
                fromName: emailSettings.fromName || '',
                replyTo: emailSettings.replyTo || '',
                rateLimit: emailSettings.rateLimit || 30,
                smtp: {
                    host: emailSettings.smtp?.host || '',
                    port: emailSettings.smtp?.port || 587,
                    secure: Boolean(emailSettings.smtp?.secure),
                    user: emailSettings.smtp?.user ? sanitizeSecret(emailSettings.smtp?.user) : '',
                    hasPassword: hasSecret(emailSettings.smtp?.password),
                    passwordLast3: sanitizeSecret(emailSettings.smtp?.password),
                },
            },
            whatsapp: {
                enabled: Boolean(whatsappSettings.enabled),
                provider: whatsappSettings.provider || 'meta',
                meta: {
                    phoneNumberId: sanitizeSecret(whatsappSettings.meta?.phoneNumberId),
                    hasAccessToken: hasSecret(whatsappSettings.meta?.accessToken),
                    accessTokenLast3: sanitizeSecret(whatsappSettings.meta?.accessToken),
                    businessAccountId: sanitizeSecret(whatsappSettings.meta?.businessAccountId),
                },
                twilio: {
                    accountSid: sanitizeSecret(whatsappSettings.twilio?.accountSid),
                    hasAuthToken: hasSecret(whatsappSettings.twilio?.authToken),
                    authTokenLast3: sanitizeSecret(whatsappSettings.twilio?.authToken),
                    fromWhatsAppNumber: whatsappSettings.twilio?.fromWhatsAppNumber || '',
                },
                d7networks: {
                    hasToken: hasSecret(whatsappSettings.d7networks?.token),
                    tokenLast3: sanitizeSecret(whatsappSettings.d7networks?.token),
                    originator: whatsappSettings.d7networks?.originator || '',
                },
            },
            sms: {
                enabled: Boolean(smsSettings.enabled),
                provider: smsSettings.provider || 'twilio',
                twilio: {
                    accountSid: sanitizeSecret(smsSettings.twilio?.accountSid),
                    hasAuthToken: hasSecret(smsSettings.twilio?.authToken),
                    authTokenLast3: sanitizeSecret(smsSettings.twilio?.authToken),
                    fromNumber: smsSettings.twilio?.fromNumber || '',
                },
            },
            adminNotifications: {
                emailEnabled: Boolean(adminNotifSettings.notifications?.emailEnabled),
                emails: adminNotifSettings.emails || '',
                notifications: adminNotifSettings.notifications || {
                    emailEnabled: false,
                    newOrder: false,
                    orderStatus: false,
                    returnRequest: false,
                    orderCancel: false,
                    newCustomer: false,
                },
            },
            socialLogin: {
                google: {
                    enabled: Boolean(socialLogin.google?.enabled),
                    clientIdLast3: sanitizeSecret(socialLogin.google?.clientId),
                    hasSecret: hasSecret(socialLogin.google?.clientSecret),
                    clientSecretLast3: sanitizeSecret(socialLogin.google?.clientSecret),
                },
                facebook: {
                    enabled: Boolean(socialLogin.facebook?.enabled),
                    clientIdLast3: sanitizeSecret(socialLogin.facebook?.clientId),
                    hasSecret: hasSecret(socialLogin.facebook?.clientSecret),
                    clientSecretLast3: sanitizeSecret(socialLogin.facebook?.clientSecret),
                },
            },
            googleAnalytics: {
                enabled: Boolean(googleAnalytics.enabled),
                trackingIdLast3: sanitizeSecret(googleAnalytics.trackingId),
            },
            googleMerchant: {
                enabled: Boolean(googleMerchant.enabled),
                merchantIdLast3: sanitizeSecret(googleMerchant.merchantId),
                hasServiceAccountKey: hasSecret(googleMerchant.serviceAccountKey),
                serviceAccountKeyLast3: sanitizeSecret(googleMerchant.serviceAccountKey),
                autoSync: Boolean(googleMerchant.autoSync),
                syncFrequency: googleMerchant.syncFrequency || 'manual',
                targetCountries: googleMerchant.targetCountries || [],
                lastSyncedAt: googleMerchant.lastSyncedAt || null,
            },
            pwa: {
                enabled: Boolean(pwa.enabled),
                appName: pwa.appName || '',
                appShortName: pwa.appShortName || '',
                themeColor: pwa.themeColor || '',
                installPromptStyle: pwa.installPromptStyle || '',
            },
            cookieConsent: {
                enabled: Boolean(cookieConsent.enabled),
                title: cookieConsent.title || '',
                position: cookieConsent.position || 'bottom-center',
                ctaText: cookieConsent.ctaText || 'Accept',
            },
            general: {
                maintenanceMode: Boolean(settings.maintenanceMode),
                allowCustomerLogin: settings.allowCustomerLogin !== false,
                allowCustomerSignup: settings.allowCustomerSignup !== false,
                allowGuestCheckout: Boolean(settings.allowGuestCheckout),
                requireEmailVerification: Boolean(settings.requireEmailVerification),
                shippingEnabled: settings.shippingEnabled !== false,
            },
        },
    });
});
