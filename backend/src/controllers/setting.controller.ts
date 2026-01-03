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
