import { Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';
import Store from '../models/Store';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import googleMerchantService from '../services/google-merchant.service';

/**
 * Get Google Merchant account status & diagnostics for a store
 */
export const getAccountStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) throw new AppError('Store not found', 404);

    const gmcSettings = store.googleMerchantSettings;
    if (!gmcSettings?.enabled) {
        return res.json({
            enabled: false,
            message: 'Google Merchant is not enabled for this store',
        });
    }

    const diagnostics = await googleMerchantService.getFeedDiagnostics(storeId);

    return res.json({
        enabled: true,
        merchantId: gmcSettings.merchantId,
        autoSync: gmcSettings.autoSync,
        syncFrequency: gmcSettings.syncFrequency,
        lastSyncedAt: gmcSettings.lastSyncedAt,
        diagnostics,
    });
});

/**
 * List products with their Google Merchant status
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const readinessFilter = req.query.readiness as string; // 'ready' | 'not_ready'

    const store = await Store.findById(storeId);
    if (!store) throw new AppError('Store not found', 404);

    const filter: any = { storeId: new mongoose.Types.ObjectId(storeId) };

    // Filter by GMC status
    if (status && status !== 'all') {
        filter['googleMerchant.status'] = status;
    }

    // Search by name or SKU
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
        ];
    }

    // Filter by Category
    const categoryId = req.query.categoryId as string;
    if (categoryId) {
        filter.categoryIds = new mongoose.Types.ObjectId(categoryId);
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .select('name slug sku price salePrice isOnSale stock stockStatus featuredImage images brand isActive googleMerchant')
            .populate('brand', 'name')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filter),
    ]);

    // Check readiness for each product
    const productsWithReadiness = products.map((product: any) => {
        const readiness = googleMerchantService.validateProductReadiness(product, store);
        return {
            ...product,
            readinessScore: readiness.score,
            readinessIssueCount: readiness.issues.length,
            isReady: readiness.ready,
        };
    });

    // Apply readiness filter in-memory (after validation)
    let filteredProducts = productsWithReadiness;
    if (readinessFilter === 'ready') {
        filteredProducts = productsWithReadiness.filter((p: any) => p.isReady);
    } else if (readinessFilter === 'not_ready') {
        filteredProducts = productsWithReadiness.filter((p: any) => !p.isReady);
    }

    res.json({
        products: filteredProducts,
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});

/**
 * Check readiness for a single product
 */
export const checkProductReadiness = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, productId } = req.params;

    const [product, store] = await Promise.all([
        Product.findOne({ _id: productId, storeId }).populate('brand', 'name').lean(),
        Store.findById(storeId).lean(),
    ]);

    if (!product) throw new AppError('Product not found', 404);
    if (!store) throw new AppError('Store not found', 404);

    const readiness = googleMerchantService.validateProductReadiness(product, store);

    res.json({ readiness });
});

/**
 * Submit a single product to Google Merchant Center
 */
export const submitProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, productId } = req.params;

    const result = await googleMerchantService.submitProduct(productId, storeId);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.json({ message: result.message });
});

/**
 * Batch submit products to Google Merchant Center
 */
export const batchSubmitProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError('productIds array is required', 400);
    }

    if (productIds.length > 500) {
        throw new AppError('Maximum 500 products can be submitted at once', 400);
    }

    const result = await googleMerchantService.batchSubmitProducts(productIds, storeId);

    res.json({
        message: `Submitted ${result.submitted} products, ${result.failed} failed`,
        ...result,
    });
});

/**
 * Remove a product from Google Merchant Center
 */
export const removeProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, productId } = req.params;

    const result = await googleMerchantService.removeProduct(productId, storeId);

    if (!result.success) {
        throw new AppError(result.message, 400);
    }

    res.json({ message: result.message });
});

/**
 * Update supplemental data for a product
 */
export const updateSupplementalData = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, productId } = req.params;

    const product = await googleMerchantService.updateSupplementalData(productId, storeId, req.body);

    if (!product) {
        throw new AppError('No valid fields provided or product not found', 400);
    }

    res.json({
        message: 'Supplemental data updated successfully',
        product,
    });
});

/**
 * Batch update supplemental data for multiple products
 */
export const batchUpdateSupplementalData = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;
    const { productIds, data } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError('productIds array is required', 400);
    }

    if (!data) {
        throw new AppError('data object is required', 400);
    }

    const result = await googleMerchantService.batchUpdateSupplementalData(productIds, storeId, data);

    res.json({
        message: `Updated ${result.modifiedCount} products successfully`,
        modifiedCount: result.modifiedCount,
    });
});

/**
 * Get feed diagnostics summary
 */
export const getFeedDiagnostics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) throw new AppError('Store not found', 404);

    const diagnostics = await googleMerchantService.getFeedDiagnostics(storeId);

    res.json({ diagnostics });
});
