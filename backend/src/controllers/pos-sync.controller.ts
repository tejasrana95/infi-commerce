import { Request, Response } from 'express';
import Store from '../models/Store';
import Product from '../models/Product';
import Category from '../models/Category';

class POSSyncController {
    async getSyncStatus(req: Request, res: Response) {
        try {
            const storeId = req.headers['x-store-id'] as string;

            if (!storeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Store ID is required in x-store-id header',
                });
            }

            // Get store's sync timestamps
            const store = await Store.findById(storeId).select(
                'lastProductModified lastCategoryModified'
            );

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'Store not found',
                });
            }

            // Get counts
            const [productCount, categoryCount] = await Promise.all([
                Product.countDocuments({ storeId, isActive: true }),
                Category.countDocuments({ storeId, status: 'active' }),
            ]);

            return res.status(200).json({
                success: true,
                data: {
                    lastProductModified: store.lastProductModified?.toISOString() || new Date().toISOString(),
                    lastCategoryModified: store.lastCategoryModified?.toISOString() || new Date().toISOString(),
                    counts: {
                        products: productCount,
                        categories: categoryCount,
                    },
                },
            });
        } catch (error: any) {
            console.error('Get sync status error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get sync status',
            });
        }
    }
}

export default new POSSyncController();
