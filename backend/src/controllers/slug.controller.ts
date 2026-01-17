import { Response } from 'express';
import slugService from '../services/slug.service';
import { AuthRequest } from '../middleware/auth';

/**
 * Resolve a slug to an entity
 * GET /api/slug/resolve/:storeId/:slug
 */
export const resolveSlug = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId, slug } = req.params;

        if (!storeId || !slug) {
            res.status(400).json({
                success: false,
                message: 'Store ID and slug are required'
            });
            return;
        }

        const resolved = await slugService.resolveSlug(storeId, slug);

        if (!resolved) {
            res.status(404).json({
                success: false,
                message: 'Slug not found'
            });
            return;
        }

        if (resolved.type === 'redirect') {
            res.status(200).json({
                success: true,
                data: {
                    type: 'redirect',
                    destination_url: resolved.destination_url
                }
            });
            return;
        }

        // Otherwise it's a slug registry entry (resolved.type === 'registry')
        res.status(200).json({
            success: true,
            data: {
                entityType: resolved.entityType,
                entityId: resolved.entityId,
                slug: resolved.slug
            }
        });
    } catch (error: any) {
        console.error('Resolve slug error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve slug',
            error: error.message
        });
    }
};

/**
 * Check if a slug is available
 * GET /api/slug/check/:storeId/:slug?type=product&id=xyz (optional)
 */
export const checkSlugAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { storeId, slug } = req.params;
        const { type, id } = req.query;

        if (!storeId || !slug) {
            res.status(400).json({
                success: false,
                message: 'Store ID and slug are required'
            });
            return;
        }

        // Cast query params to expected types
        const entityType = type as 'product' | 'category' | 'page';

        if (type && !['product', 'category', 'page'].includes(entityType)) {
            res.status(400).json({
                success: false,
                message: 'Invalid entity type. Must be product, category, or page.'
            });
            return;
        }

        const result = await slugService.checkSlugAvailability(
            storeId,
            slug,
            entityType || 'page',
            id as string
        );

        res.status(200).json({
            success: true,
            isAvailable: result.isAvailable,
            isReserved: result.isReserved,
            suggestedSlug: result.suggestedSlug,
            message: result.message || ''
        });
    } catch (error: any) {
        console.error('Check slug availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check slug availability',
            error: error.message
        });
    }
};
