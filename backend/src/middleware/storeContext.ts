/**
 * Store Context Middleware
 * 
 * Extracts store context from X-Store-ID header and attaches to request.
 * This enables multi-tenant functionality where each request is scoped to a specific store.
 */

import { Response, NextFunction } from 'express';
import Store from '../models/Store';
import { AuthRequest } from './auth';

// Extend AuthRequest to include store context
declare global {
    namespace Express {
        interface Request {
            storeId?: string;
            store?: {
                _id: string;
                name: string;
                slug: string;
                domains: string[];
                settings?: any;
            };
        }
    }
}

/**
 * Middleware to extract and validate store context from X-Store-ID header.
 * 
 * Usage:
 *   router.post('/register', storeContext, registerCustomer);
 *   router.post('/register', storeContext.required, registerCustomer); // throws if missing
 * 
 * Request properties set:
 *   - req.storeId: The store ID from header
 *   - req.store: The full store object (if found)
 */
export const storeContext = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const storeId = req.headers['x-store-id'] as string;

        if (!storeId) {
            // No store ID provided - continue without store context
            next();
            return;
        }

        // Validate store ID format
        if (!storeId.match(/^[a-f\d]{24}$/i)) {
            res.status(400).json({ error: 'Invalid store ID format' });
            return;
        }

        // Find store and attach to request
        const store = await Store.findById(storeId).select('_id name slug domain settings isActive');

        if (!store) {
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        if (!store.isActive) {
            res.status(403).json({ error: 'Store is not active' });
            return;
        }

        // Attach store context to request
        req.storeId = store._id.toString();
        req.store = {
            _id: store._id.toString(),
            name: store.name,
            slug: store.slug,
            domains: store.domains,
            settings: store.settings,
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Required variant - throws error if X-Store-ID header is missing
 */
storeContext.required = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const storeId = req.headers['x-store-id'] as string;

    if (!storeId) {
        res.status(400).json({ error: 'X-Store-ID header is required' });
        return;
    }

    // Delegate to main storeContext middleware
    return storeContext(req, res, next);
};

/**
 * Optional variant that doesn't fail if store not found (just doesn't attach)
 * Useful for endpoints that may or may not have store context
 */
storeContext.optional = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const storeId = req.headers['x-store-id'] as string;

        if (!storeId) {
            next();
            return;
        }

        // Validate store ID format
        if (!storeId.match(/^[a-f\d]{24}$/i)) {
            next(); // Invalid format - continue without store
            return;
        }

        // Find store and attach to request
        const store = await Store.findById(storeId).select('_id name slug domain settings isActive');

        if (store && store.isActive) {
            req.storeId = store._id.toString();
            req.store = {
                _id: store._id.toString(),
                name: store.name,
                slug: store.slug,
                domains: store.domains,
                settings: store.settings,
            };
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default storeContext;
