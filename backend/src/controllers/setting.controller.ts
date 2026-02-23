import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Setting from '../models/Setting';
import { asyncHandler, AppError } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';

interface SearchReplaceTableConfig {
    key: string;
    label: string;
    collection: string;
}

const SEARCH_REPLACE_TABLES: SearchReplaceTableConfig[] = [
    { key: 'products', label: 'Products', collection: 'products' },
    { key: 'categories', label: 'Categories', collection: 'categories' },
    { key: 'pages', label: 'Pages', collection: 'pages' },
    { key: 'blogPosts', label: 'Blog Posts', collection: 'blogposts' },
    { key: 'blogCategories', label: 'Blog Categories', collection: 'blogcategories' },
    { key: 'brands', label: 'Brands', collection: 'brands' },
    { key: 'layouts', label: 'Layouts', collection: 'layouts' },
    { key: 'menus', label: 'Menus', collection: 'menus' },
    { key: 'forms', label: 'Forms', collection: 'forms' },
    { key: 'bannerSliders', label: 'Banner Sliders', collection: 'bannersliders' },
    { key: 'heroSliders', label: 'Hero Sliders', collection: 'herosliders' },
    { key: 'contentCards', label: 'Content Cards', collection: 'contentcards' },
    { key: 'contentCardCategories', label: 'Content Card Categories', collection: 'contentcardcategories' },
    { key: 'productOptions', label: 'Product Options', collection: 'productoptions' },
    { key: 'attributes', label: 'Attributes', collection: 'attributes' },
    { key: 'coupons', label: 'Coupons', collection: 'coupons' },
    { key: 'testimonials', label: 'Testimonials', collection: 'testimonials' },
];

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    res.json({
        success: true,
        tables: SEARCH_REPLACE_TABLES.map((t) => ({ key: t.key, label: t.label })),
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

    const requestedTableKeys =
        tables === 'all'
            ? SEARCH_REPLACE_TABLES.map((t) => t.key)
            : Array.isArray(tables)
                ? tables
                : [];

    if (requestedTableKeys.length === 0) {
        throw new AppError('Please select at least one table or use "all"', 400);
    }

    const tableMap = new Map(SEARCH_REPLACE_TABLES.map((t) => [t.key, t]));
    const selectedTables = requestedTableKeys
        .map((key: string) => tableMap.get(key))
        .filter(Boolean) as SearchReplaceTableConfig[];

    if (selectedTables.length === 0) {
        throw new AppError('No valid tables selected', 400);
    }

    const regex = new RegExp(escapeRegex(find), caseSensitive ? 'g' : 'gi');
    const storeObjectId = new mongoose.Types.ObjectId(storeId);
    const query = {
        $or: [
            { storeId: storeObjectId },
            { storeId },
            { store: storeObjectId },
            { store: storeId },
        ],
    };

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
