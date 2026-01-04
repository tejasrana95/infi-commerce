import { Request, Response } from 'express';
import Setting from '../models/Setting';
import { asyncHandler } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';

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
