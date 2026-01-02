import { Request } from 'express';

/**
 * Get effective store ID from multiple sources (for API key and regular requests)
 * Priority: x-store-id header > query param > body field
 */
export function getEffectiveStoreId(req: Request): string | undefined {
    const storeIdFromHeader = req.headers['x-store-id'] as string | undefined;
    const storeIdFromQuery = req.query.storeId as string | undefined;
    const storeIdFromBody = req.body?.storeId as string | undefined;

    return storeIdFromHeader || storeIdFromQuery || storeIdFromBody;
}
