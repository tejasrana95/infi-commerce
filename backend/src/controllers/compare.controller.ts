import { Response, Request } from 'express';
import Product from '../models/Product';
import Store from '../models/Store';
import Attribute from '../models/Attribute';
import { asyncHandler, AppError } from '../middleware/validation';
import { calculatePricing } from '../utils/pricing.utils';

// Default compare configuration
const DEFAULT_COMPARE_CONFIG = {
    enabled: true,
    maxProducts: 4,
    maxProductsMobile: 2,
    requireSameCategory: true,
    showInProductCard: true,
    showInProductPage: true,
    widgetStyle: 'floating' as const,
    widgetPosition: 'bottom' as const,
};

/**
 * @swagger
 * /api/compare/products:
 *   post:
 *     summary: Get products for comparison with validation
 *     tags: [Compare]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - storeId
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to compare
 *               storeId:
 *                 type: string
 *                 description: Store ID for configuration
 *               isMobile:
 *                 type: boolean
 *                 description: Whether request is from mobile device
 *     responses:
 *       200:
 *         description: Products for comparison
 *       400:
 *         description: Validation error
 */
export const getCompareProducts = asyncHandler(async (req: Request, res: Response) => {
    const { productIds, storeId, isMobile = false } = req.body;

    // Validate required fields
    if (!productIds || !Array.isArray(productIds)) {
        throw new AppError('productIds must be an array', 400);
    }

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    // Get store and compare configuration
    const store = await Store.findById(storeId).lean();
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Access compare config from theme (using type assertion since schema is Mixed)
    const themeCompare = (store.theme as any)?.compare || {};
    const compareConfig = {
        ...DEFAULT_COMPARE_CONFIG,
        ...themeCompare,
    };

    // Check if compare feature is enabled
    if (!compareConfig.enabled) {
        throw new AppError('Compare feature is disabled for this store', 403);
    }

    // Validate max products
    const maxProducts = isMobile ? compareConfig.maxProductsMobile : compareConfig.maxProducts;
    if (productIds.length > maxProducts) {
        throw new AppError(
            `Maximum ${maxProducts} products can be compared${isMobile ? ' on mobile' : ''}`,
            400
        );
    }

    // Validate minimum products
    if (productIds.length < 2) {
        throw new AppError('At least 2 products are required for comparison', 400);
    }

    // Fetch products
    const products = await Product.find({
        _id: { $in: productIds },
        storeId,
        isActive: true,
    })
        .populate('brand', 'name slug')
        .populate('categoryIds', 'name slug')
        .lean();

    // Check if all products were found
    if (products.length !== productIds.length) {
        const foundIds = products.map((p) => p._id.toString());
        const missingIds = productIds.filter((id: string) => !foundIds.includes(id));
        throw new AppError(`Products not found or inactive: ${missingIds.join(', ')}`, 404);
    }

    // Validate same category requirement
    if (compareConfig.requireSameCategory) {
        // Get all category IDs from the first product
        const firstProductCategories = new Set(
            products[0].categoryIds.map((c: any) => c._id.toString())
        );

        // Check if all other products share at least one category
        const allShareCategory = products.every((product) => {
            const productCategories = product.categoryIds.map((c: any) => c._id.toString());
            return productCategories.some((catId: string) => firstProductCategories.has(catId));
        });

        if (!allShareCategory) {
            throw new AppError(
                'Products must be from the same category for comparison',
                400
            );
        }
    }

    // Get all specification attribute IDs from products
    const allSpecAttributeIds = new Set<string>();
    products.forEach((product) => {
        if (product.specifications) {
            product.specifications.forEach((spec: any) => {
                if (spec.attributeId) {
                    allSpecAttributeIds.add(spec.attributeId.toString());
                }
            });
        }
    });

    // Fetch attribute details
    const attributes = await Attribute.find({
        _id: { $in: Array.from(allSpecAttributeIds) },
    })
        .select('name slug type')
        .lean();

    const attributeMap = new Map(attributes.map((attr) => [attr._id.toString(), attr]));

    // Build comparison data with resolved specifications
    const comparisonProducts = products.map((product) => {
        // Calculate pricing
        const pricing = calculatePricing({
            regularPrice: product.price,
            salePrice: product.salePrice,
            taxRate: 0, // Tax will be handled by frontend based on store settings
            quantity: 1,
        });

        // Resolve specifications
        const resolvedSpecs: Record<string, any> = {};
        if (product.specifications) {
            product.specifications.forEach((spec: any) => {
                const attr = attributeMap.get(spec.attributeId?.toString());
                if (attr) {
                    resolvedSpecs[attr.slug] = {
                        name: attr.name,
                        value: spec.value,
                        type: attr.type,
                    };
                }
            });
        }

        return {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.shortDescription || product.description,
            images: product.images,
            featuredImage: product.featuredImage || product.images?.[0],
            brand: product.brand,
            categories: product.categoryIds,
            stockStatus: product.stockStatus,
            averageRating: product.averageRating,
            reviewCount: product.reviewCount,
            weight: product.weight,
            dimensions: product.dimensions,
            price: product.price,
            salePrice: product.salePrice,
            isOnSale: product.isOnSale,
            pricing: {
                regularPrice: pricing.unitPrice,
                finalPrice: pricing.unitFinalPrice,
                discountAmount: pricing.discount.totalDiscount,
            },
            specifications: resolvedSpecs,
        };
    });

    // Build comparison attributes list (all unique attributes)
    const comparisonAttributes = attributes.map((attr) => ({
        id: attr._id,
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
    }));

    res.json({
        success: true,
        products: comparisonProducts,
        comparisonAttributes,
        config: {
            maxProducts: compareConfig.maxProducts,
            maxProductsMobile: compareConfig.maxProductsMobile,
            requireSameCategory: compareConfig.requireSameCategory,
        },
    });
});

/**
 * @swagger
 * /api/compare/config/{storeId}:
 *   get:
 *     summary: Get compare configuration for a store
 *     tags: [Compare]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Compare configuration
 *       404:
 *         description: Store not found
 */
export const getCompareConfig = asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.params;

    const store = await Store.findById(storeId).select('theme').lean();
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Access compare config from theme (using type assertion since schema is Mixed)
    const themeCompare = (store.theme as any)?.compare || {};
    const compareConfig = {
        ...DEFAULT_COMPARE_CONFIG,
        ...themeCompare,
    };

    res.json({
        success: true,
        config: compareConfig,
    });
});
