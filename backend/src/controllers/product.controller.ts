import { Response } from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import Product from '../models/Product';
import Store from '../models/Store';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Sale from '../models/Sale';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import { calculatePricing, calculateTaxBreakdown } from '../utils/pricing.utils';
import { addTimezoneAwareDates } from '../utils/date.utils';
import { escapeRegExp, getSearchSuggestions } from '../utils/search.utils';
import { updateProductSyncTimestamp } from '../utils/sync-timestamp.utils';
import SlugRegistry from '../models/SlugRegistry';


// ============================================
// Price visibility helpers for WEB channel
// ============================================

/** Check if prices should be hidden for this request */
async function shouldHidePriceForChannel(req: AuthRequest, storeId?: string): Promise<boolean> {
    if (!storeId || req.channel !== 'WEB') return false;
    const store = await Store.findById(storeId).select('settings.priceVisibility').lean();
    return store?.settings?.priceVisibility?.showPrice === false;
}

/** Strip all price-related fields from a product object (mutates in place) */
function stripPriceFields(product: any): any {
    if (!product) return product;
    delete product.price;
    delete product.salePrice;
    delete product.compareAtPrice;
    delete product.costPrice;
    delete product.pricing;
    delete product.originalPrice;
    delete product.taxAmount;
    delete product.taxBreakdown;
    delete product.isOnSale;
    delete product.salePercent;
    // Strip variant prices
    if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((v: any) => {
            delete v.price;
            delete v.salePrice;
            delete v.compareAtPrice;
            delete v.costPrice;
            delete v.pricing;
            delete v.originalPrice;
            delete v.taxAmount;
        });
    }
    return product;
}

function pickDefined<T extends Record<string, any>>(obj: T, fields: string[]): Partial<T> {
    const out: Partial<T> = {};
    fields.forEach((field) => {
        if (obj[field] !== undefined) {
            (out as any)[field] = obj[field];
        }
    });
    return out;
}

function sanitizePublicVariant(variant: any): any {
    if (!variant) return variant;
    const clean = pickDefined(variant, [
        '_id',
        'sku',
        'attributes',
        'price',
        'salePrice',
        'stock',
        'images',
        'weight',
        'pricing',
    ]);
    return clean;
}

function sanitizePublicProduct(product: any, mode: 'listing' | 'detail' = 'detail'): any {
    if (!product) return product;

    const commonFields = [
        '_id',
        'storeId',
        'name',
        'slug',
        'type',
        'sku',
        'price',
        'salePrice',
        'compareAtPrice',
        'salePriceStartDate',
        'salePriceEndDate',
        'stock',
        'stockStatus',
        'lowStockThreshold',
        'images',
        'featuredImage',
        'categoryIds',
        'tags',
        'brand',
        'seo',
        'isActive',
        'isFeatured',
        'isOnSale',
        'averageRating',
        'reviewCount',
        'rating',
        'pricing',
        'createdAt',
        'updatedAt',
    ];

    const detailOnlyFields = [
        'description',
        'shortDescription',
        'taxClassId',
        'weight',
        'downloadable',
        'downloadLimit',
        'downloadExpiry',
        'productOptions',
        'attributes',
        'specifications',
        'videos',
        'categoryBreadcrumbs',
    ];

    const fields = mode === 'detail' ? [...commonFields, ...detailOnlyFields] : commonFields;
    const clean = pickDefined(product, fields) as any;

    if (Array.isArray(product.variants)) {
        clean.variants = product.variants.map(sanitizePublicVariant);
    }

    return clean;
}

// Helper function to transform product options for frontend
export function transformProductOptions(product: any) {
    if (product.productOptions && product.productOptions.length > 0) {
        product.productOptions = product.productOptions.map((opt: any) => {
            const optionData = opt.optionId;
            if (!optionData) return opt;

            return {
                optionId: optionData._id?.toString() || opt.optionId,
                name: optionData.name,
                type: optionData.type,
                isVariation: opt.isVariation,
                // Filter the full option values to only include selected ones for this product
                // and maintain the label/value format
                values: optionData.values?.filter((v: any) => opt.values.includes(v.value)) || [],
            };
        });
    }
    return product;
}

// Helper function to add pricing with tax to a product (including variants)
export function addPricingToProduct(product: any) {
    const taxRate = product.taxClassId?.rate || 0;
    const basePrice = product.salePrice || product.price;
    const pricing = calculatePricing({
        regularPrice: product.price,
        salePrice: product.salePrice,
        taxRate,
    });

    // Main product pricing
    const isOnSale = product.salePrice && product.salePrice < product.price;
    const originalPrice = isOnSale
        ? Math.round((product.price + (product.price * taxRate / 100)) * 100) / 100
        : undefined;
    const discountPercent = isOnSale
        ? Math.round((1 - product.salePrice / product.price) * 100)
        : undefined;

    product.pricing = {
        price: product.price,
        salePrice: product.salePrice,
        priceWithTax: Math.round((product.price + (product.price * taxRate / 100)) * 100) / 100,
        salePriceWithTax: product.salePrice
            ? Math.round((product.salePrice + (product.salePrice * taxRate / 100)) * 100) / 100
            : undefined,
        taxRate,
        taxAmount: pricing.unitTaxAmount,
        finalPrice: pricing.unitFinalPrice,
        originalPrice,
        isOnSale: !!isOnSale,
        discountPercent,
        taxBreakdown: product.taxClassId?.isSplit && product.taxClassId?.subTaxes
            ? calculateTaxBreakdown(basePrice, product.taxClassId.subTaxes)
            : undefined,
    };

    // Add pricing to each variant if they exist
    if (product.variants && product.variants.length > 0) {
        product.variants = product.variants.map((variant: any) => {
            const variantPrice = variant.price || product.price;
            // If variant has its own sale price, use it
            // Otherwise, if product is on sale, apply the same discount percentage to variant
            let variantSalePrice = variant.salePrice;
            let variantIsOnSale = false;
            let variantOriginalPrice;
            let variantDiscountPercent;

            if (variantSalePrice && variantSalePrice < variantPrice) {
                // Variant has its own sale price
                variantIsOnSale = true;
                variantOriginalPrice = Math.round((variantPrice + (variantPrice * taxRate / 100)) * 100) / 100;
                variantDiscountPercent = Math.round((1 - variantSalePrice / variantPrice) * 100);
            } else if (!variantSalePrice && product.salePrice && product.salePrice < product.price) {
                // Apply the same discount percentage from product to variant
                const discountPercent = (product.price - product.salePrice) / product.price;
                variantSalePrice = Math.round((variantPrice * (1 - discountPercent)) * 100) / 100;
                variantIsOnSale = true;
                variantOriginalPrice = Math.round((variantPrice + (variantPrice * taxRate / 100)) * 100) / 100;
                variantDiscountPercent = Math.round(discountPercent * 100);
            }

            const variantBasePrice = variantSalePrice || variantPrice;

            const variantPricing = calculatePricing({
                regularPrice: variantPrice,
                salePrice: variantSalePrice,
                taxRate,
            });

            return {
                ...variant,
                pricing: {
                    price: variantPrice,
                    salePrice: variantSalePrice,
                    priceWithTax: Math.round((variantPrice + (variantPrice * taxRate / 100)) * 100) / 100,
                    salePriceWithTax: variantSalePrice
                        ? Math.round((variantSalePrice + (variantSalePrice * taxRate / 100)) * 100) / 100
                        : undefined,
                    taxRate,
                    taxAmount: variantPricing.unitTaxAmount,
                    finalPrice: variantPricing.unitFinalPrice,
                    originalPrice: variantOriginalPrice,
                    isOnSale: variantIsOnSale,
                    discountPercent: variantDiscountPercent,
                    taxBreakdown: product.taxClassId?.isSplit && product.taxClassId?.subTaxes
                        ? calculateTaxBreakdown(variantBasePrice, product.taxClassId.subTaxes)
                        : undefined,
                },
            };
        });
    }

    // Map averageRating to rating for frontend consistency
    product.rating = product.averageRating;

    return product;
}

// Validation rules
export const createProductValidation = [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('slug').trim().notEmpty().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('description').notEmpty().withMessage('Description is required'),
    body('storeId').isMongoId().withMessage('Valid store ID is required'),
    body('type').isIn(['simple', 'variable', 'digital']).withMessage('Invalid product type'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('hsnCode').optional().trim(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    body('categoryIds').optional().isArray().withMessage('Category IDs must be an array'),
    body('returnSettings.returnWindowDays').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Return window must be a positive integer'),
    body('returnSettings.exchangeWindowDays').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Exchange window must be a positive integer'),
    body('returnSettings.isReturnable').optional().isBoolean(),
];

export const updateProductValidation = [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format'),
    body('hsnCode').optional().trim(),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('returnSettings.returnWindowDays').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Return window must be a positive integer'),
    body('returnSettings.exchangeWindowDays').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Exchange window must be a positive integer'),
    body('returnSettings.isReturnable').optional().isBoolean(),
];

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const productData = req.body;



    // Verify store exists
    const store = await Store.findById(productData.storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(productData.storeId.toString())) {
            throw new AppError('Unauthorized: You can only create products for your assigned stores', 403);
        }
    }

    // Check if SKU already exists
    const existingSKU = await Product.findOne({ sku: productData.sku });
    if (existingSKU) {
        throw new AppError('Product with this SKU already exists', 400);
    }

    // Check if slug exists for this store
    const existingSlug = await Product.findOne({
        storeId: productData.storeId,
        slug: productData.slug,
    });
    if (existingSlug) {
        throw new AppError('Product with this slug already exists in this store', 400);
    }

    // Verify categories exist
    if (productData.categoryIds && productData.categoryIds.length > 0) {
        const categories = await Category.find({
            _id: { $in: productData.categoryIds },
            storeId: productData.storeId,
        });
        if (categories.length !== productData.categoryIds.length) {
            throw new AppError('One or more categories not found or do not belong to this store', 400);
        }
    }

    // Clean up empty strings for ObjectId fields (MongoDB can't cast "" to ObjectId)
    const objectIdFields = ['taxClassId', 'brand'];
    objectIdFields.forEach(field => {
        if (productData[field] === '') {
            productData[field] = undefined;
        }
    });

    // Create product
    const product = await Product.create(productData);

    await updateProductSyncTimestamp(product.storeId.toString());

    res.status(201).json({
        message: 'Product created successfully',
        product,
    });
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with SEO-friendly filters
 *     tags: [Products]
 *     description: |
 *       Supports multiple filter formats for SEO-friendly URLs:
 *       - Price range: price=100-500 or minPrice=100&maxPrice=500
 *       - Brand: brand=nike or brand=nike,adidas
 *       - Tags: tags=summer,new-arrival
 *       - Rating: rating=4 (4 stars and above)
 *       - Stock: stock=in-stock,pre-order
 *       - Attributes: color=red,blue or attr_color=red (legacy)
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Single or comma-separated category IDs
 *       - in: query
 *         name: price
 *         schema:
 *           type: string
 *         description: Price range (e.g., 100-500)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Single or comma-separated brands
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating (e.g., 4 for 4+ stars)
 *       - in: query
 *         name: stock
 *         schema:
 *           type: string
 *           enum: [in-stock, out-of-stock, pre-order, backorder]
 *       - in: query
 *         name: isOnSale
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price-low, price-high, bestselling, rating, featured, alphabetical]
 *     responses:
 *       200:
 *         description: Products retrieved with active filters metadata
 */
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role;
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');
    const removeProductCost = !isAdmin ? '-costPrice -variants.costPrice' : '';

    const page = parseInt(req.query.page as string) || 1;
    const requestedLimit = parseInt(req.query.limit as string) || 24;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;
    const isListingView = req.query.view === 'listing' || req.query.fields === 'listing';
    let textSearchMode = false;

    // Build filter
    const filter: any = { isActive: true };
    let idsFilterCount = 0;

    // Handle isActive filter
    if (req.query.isActive === 'all') {
        delete filter.isActive;
    } else if (req.query.isActive === 'false') {
        filter.isActive = false;
    }
    if (req.query.type) {
        filter.type = req.query.type;
    }
    // Support comma-separated IDs filter
    if (req.query.ids) {
        const ids = (req.query.ids as string).split(',').map(id => id.trim()).filter(id => id);
        if (ids.length > 0) {
            filter._id = { $in: ids };
            idsFilterCount = ids.length;
        }
    }

    const isStoreAdmin = req.user?.role === 'store_admin';
    const assignedStoreIds = req.user?.storeIds || [];

    // Get store ID from multiple sources (header takes priority for API key requests)
    const storeIdFromHeader = req.headers['x-store-id'] as string;
    const storeIdFromQuery = req.query.storeId as string;
    const storeIdFromBody = req.body?.storeId as string;
    const effectiveStoreId = storeIdFromHeader || storeIdFromQuery || storeIdFromBody;

    if (isStoreAdmin) {
        if (assignedStoreIds.length === 0) {
            return res.json({ products: [], total: 0, pages: 0 });
        }
        filter.storeId = { $in: assignedStoreIds.map(id => new mongoose.Types.ObjectId(id)) };
    } else if (effectiveStoreId) {
        // Filter by store ID from header, query, or body
        filter.storeId = effectiveStoreId;
    }
    // Channel filter
    if (req.channel) {
        const channelFilter = {
            $or: [
                { channels: req.channel },
                { channels: { $exists: false } },
                { channels: { $size: 0 } }
            ]
        };

        // Combine with existing filter
        if (filter.$or) {
            filter.$and = filter.$and || [];
            filter.$and.push(channelFilter);
        } else {
            // Be careful not to overwrite other $or conditions if we add more later
            // Since we might have channelFilter $or AND search $or
            filter.$and = filter.$and || [];
            filter.$and.push(channelFilter);
        }
    }

    // Category filter - support single or multiple categories (includes subcategories)
    if (req.query.categoryId) {
        const categoryIds = (req.query.categoryId as string).split(',').map(id => id.trim());
        const validCategoryIds = categoryIds.filter(id => id.match(/^[0-9a-fA-F]{24}$/));

        if (validCategoryIds.length > 0) {
            // Check if we should include subcategories (default: true)
            const includeSubcategories = req.query.includeSubcategories !== 'false';

            if (includeSubcategories && validCategoryIds.length === 1) {
                // Get the category and all its subcategories via path matching
                const category = await Category.findById(validCategoryIds[0]).select('path storeId').lean();

                if (category && category.path) {
                    const subcategories = await Category.find({
                        storeId: category.storeId,
                        path: { $regex: new RegExp(`^${category.path}`) },
                    }).select('_id').lean();

                    const allCategoryIds = subcategories.map((c: any) => c._id.toString());
                    filter.categoryIds = { $in: allCategoryIds };
                } else {
                    // Fallback to just the provided category
                    filter.categoryIds = validCategoryIds[0];
                }
            } else {
                // Multiple categories or subcategories disabled
                filter.categoryIds = validCategoryIds.length === 1
                    ? validCategoryIds[0]
                    : { $in: validCategoryIds };
            }
        } else if (categoryIds.includes('all-products')) {
            // Explicitly ignore 'all-products' if passed, treating it as no category filter
        }
    }

    // Price range filter (SEO-friendly: minPrice, maxPrice or price=100-500)
    if (req.query.price) {
        const [min, max] = (req.query.price as string).split('-').map(v => parseFloat(v));
        filter.price = {};
        if (!isNaN(min)) filter.price.$gte = min;
        if (!isNaN(max)) filter.price.$lte = max;
    } else if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice as string);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice as string);
    }

    // Brand filter (SEO-friendly: brand=nike or brand=nike,adidas or brand=OBJECTID)
    if (req.query.brand) {
        const brands = (req.query.brand as string).split(',').map(b => b.trim());
        const validObjectIds = brands.filter(b => b.match(/^[0-9a-fA-F]{24}$/));
        const brandNames = brands.filter(b => !b.match(/^[0-9a-fA-F]{24}$/));
        const brandConditions: any[] = [];

        // Condition 1: Match by ID (handling both ObjectId and String storage)
        if (validObjectIds.length > 0) {
            const objectIds = validObjectIds.map(id => new mongoose.Types.ObjectId(id));

            // We use an $or condition here to handle two cases:
            // 1. { brand: { $in: objectIds } } -> Efficient index-based lookup for proper ObjectIds
            // 2. { $expr: ... } -> Flexible lookup for legacy/inconsistent data where brand is stored as a string
            //    $toString("$brand") ensures we compare the string representation of the DB field
            //    against the string IDs provided.
            brandConditions.push({
                $or: [
                    { brand: { $in: objectIds } },
                    {
                        $expr: {
                            $in: [
                                { $toString: '$brand' },
                                validObjectIds
                            ]
                        }
                    }
                ]
            });
        }
        // Condition 2: Match by name/slug (requiring lookup)
        if (brandNames.length > 0) {
            const foundBrands = await Brand.find({
                $or: [
                    { name: { $in: brandNames.map(b => new RegExp(`^${escapeRegExp(b)}$`, 'i')) } },
                    { slug: { $in: brandNames.map(b => new RegExp(`^${escapeRegExp(b)}$`, 'i')) } }
                ]
            }).select('_id name slug').lean();

            if (foundBrands.length > 0) {
                brandConditions.push({ brand: { $in: foundBrands.map((b: any) => b._id) } });
            }
        }

        if (brandConditions.length > 0) {
            if (brandConditions.length === 1) {
                Object.assign(filter, brandConditions[0]);
            } else {
                filter.$or = [...(filter.$or || []), ...brandConditions];
            }
        } else if (brandNames.length > 0 && validObjectIds.length === 0) {
            // If we searched for names but found nothing, and had no IDs, create a condition that matches nothing
            // to accurately reflect "0 results" for that brand name.
            filter.brand = null;
        }
    }

    // Tags filter (SEO-friendly: tags=summer,new-arrival)
    if (req.query.tags) {
        const tags = (req.query.tags as string).split(',').map(t => t.trim());
        filter.tags = { $in: tags };
    }

    // Rating filter (SEO-friendly: rating=4 means 4 stars and above)
    if (req.query.rating) {
        const minRating = parseFloat(req.query.rating as string);
        if (!isNaN(minRating)) {
            filter.averageRating = { $gte: minRating };
        }
    }

    // Stock status filter (SEO-friendly: stock=in-stock,pre-order)
    if (req.query.stock) {
        const stockStatuses = (req.query.stock as string).split(',').map(s => s.trim());
        filter.stockStatus = stockStatuses.length === 1
            ? stockStatuses[0]
            : { $in: stockStatuses };
    }

    // Availability shorthand (in_stock=true)
    if (req.query.in_stock === 'true') {
        filter.stockStatus = 'in-stock';
    }

    if (req.query.isOnSale === 'true') {
        filter.isOnSale = true;
    }

    if (req.query.isFeatured === 'true') {
        filter.isFeatured = true;
    }

    // Two-tier search: strict (full phrase) first, then broad (individual word) matches
    // This gives Amazon/Flipkart-style results where exact matches appear first
    if (req.query.search) {
        const searchQuery = (req.query.search as string).trim();

        if (searchQuery.length > 0) {
            // SKU-like queries should not use text search because text indexes may not include SKU fields.
            const isLikelySkuQuery =
                /^[a-zA-Z0-9._-]+$/.test(searchQuery) &&
                (/[0-9]/.test(searchQuery) || /[-_]/.test(searchQuery));

            const canUseTextSearch =
                searchQuery.length >= 3 &&
                !/[^\w\s-]/.test(searchQuery) &&
                !isLikelySkuQuery;
            if (canUseTextSearch) {
                filter.$text = { $search: searchQuery };
                textSearchMode = true;
            } else {
                const strictRegex = new RegExp(escapeRegExp(searchQuery), 'i');

                // Tier 1: Strict conditions - full phrase match
                const searchConditions: any[] = [
                    { name: strictRegex },
                    { sku: strictRegex },
                    { barcode: strictRegex },
                    { description: strictRegex },
                    { shortDescription: strictRegex },
                    { 'variants.sku': strictRegex },
                    { 'variants.barcode': strictRegex },
                    { tags: strictRegex },
                ];

                // Tier 2: Broad conditions - individual word matching
                // Only add if query has multiple words (single word is already covered by strict)
                const words = searchQuery.split(/\s+/).filter(w => w.length >= 2);
                if (words.length > 1) {
                    words.forEach(word => {
                        const wordRegex = new RegExp(escapeRegExp(word), 'i');
                        searchConditions.push(
                            { name: wordRegex },
                            { sku: wordRegex },
                            { barcode: wordRegex },
                            { tags: wordRegex },
                            { 'variants.sku': wordRegex },
                            { 'variants.barcode': wordRegex },
                        );
                    });
                }

                // Use $or to match in ANY field (strict or broad)
                if (filter.$or) {
                    // If there's already an $or from brand filter, use $and to combine
                    filter.$and = filter.$and || [];
                    filter.$and.push({ $or: searchConditions });
                } else {
                    filter.$or = searchConditions;
                }
            }
        }
    }

    if (req.query.sku) {
        const sku = (req.query.sku as string).trim();
        if (sku.length > 0) {
            const exactSkuRegex = new RegExp(`^${escapeRegExp(sku)}$`, 'i');
            const skuConditions = [
                { sku: exactSkuRegex },
                { 'variants.sku': exactSkuRegex }
            ];

            if (filter.$or) {
                filter.$and = filter.$and || [];
                filter.$and.push({ $or: skuConditions });
            } else {
                filter.$or = skuConditions;
            }
        }
    }

    // Attribute filters - support multiple formats:
    // 1. attr_color=red (legacy)
    // 2. color=red,blue (SEO-friendly by attribute slug)
    // 3. filter[color]=red (array format)
    const attrConditions: any[] = [];

    // First, get all filterable attribute slugs if we have storeId
    let filterableAttributeMap: Record<string, any> = {};
    if (req.query.storeId) {
        const Attribute = require('../models/Attribute').default;
        const filterableAttrs = await Attribute.find({
            storeId: req.query.storeId,
            $or: [{ isFilterable: true }, { isFilterable: { $exists: false } }]
        }).select('slug _id').lean();

        filterableAttrs.forEach((a: any) => {
            filterableAttributeMap[a.slug] = a._id;
        });
    }

    Object.keys(req.query).forEach((key) => {
        const value = req.query[key] as string;
        let attrSlug: string | null = null;
        let values: string[] = [];

        // Identify filter type and extract slug
        if (key.startsWith('attr_')) {
            attrSlug = key.replace('attr_', '');
        } else if (key.startsWith('filter[') && key.endsWith(']')) {
            attrSlug = key.slice(7, -1);
        } else if (filterableAttributeMap[key]) {
            attrSlug = key;
        }

        if (attrSlug) {
            values = value.split(',').map(v => v.trim());
            const attrId = filterableAttributeMap[attrSlug];

            if (attrId) {
                // Precise match using attribute ID
                attrConditions.push({
                    specifications: {
                        $elemMatch: {
                            attributeId: attrId,
                            value: values.length === 1 ? values[0] : { $in: values }
                        }
                    }
                });
            } else {
                // Fallback loose match on value if ID not found
                attrConditions.push({
                    'specifications.value': values.length === 1 ? values[0] : { $in: values }
                });
            }
        }
    });

    if (attrConditions.length > 0) {
        filter.$and = filter.$and || [];
        filter.$and.push(...attrConditions);
    }

    // Build sort - support SEO-friendly sort names
    let sort: any = textSearchMode ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
    const sortParam = (req.query.sort as string) || 'newest';
    if (!textSearchMode) {
        switch (sortParam) {
            case 'newest':
            case 'new':
                sort = { createdAt: -1 };
                break;
            case 'oldest':
            case 'old':
                sort = { createdAt: 1 };
                break;
            case 'price_asc':
            case 'price-asc':
            case 'price-low':
                sort = { price: 1 };
                break;
            case 'price_desc':
            case 'price-desc':
            case 'price-high':
                sort = { price: -1 };
                break;
            case 'popular':
            case 'bestselling':
            case 'best-selling':
                sort = { salesCount: -1 };
                break;
            case 'rating':
            case 'top-rated':
                sort = { averageRating: -1 };
                break;
            case 'alphabetical':
            case 'name-asc':
                sort = { name: 1 };
                break;
            case 'name-desc':
                sort = { name: -1 };
                break;
            case 'featured':
                sort = { isFeatured: -1, salesCount: -1 };
                break;
        }
    }

    // Always add _id as a tiebreaker for stable pagination.
    // Without this, documents with identical sort-field values can shift
    // between pages, causing some to be skipped or duplicated.
    sort._id = -1;

    // Build field projection – listing view excludes heavy fields to reduce transfer size
    const listingProjection = isListingView
        ? '-__v -description -shortDescription -specifications -geoLimit -digitalProduct -googleMerchant -returnSettings -dimensions'
        : `-__v`;
    const selectFields = `${listingProjection} ${removeProductCost}`.trim();

    // Get products with pagination
    const productQuery = Product.find(filter)
        .select(selectFields)
        .skip(skip)
        .limit(limit)
        .sort(sort);

    if (isListingView) {
        productQuery
            .populate('categoryIds', 'title slug')
            .populate('taxClassId', 'name rate isSplit subTaxes')
            .populate('brand', 'name slug logo');
    } else {
        productQuery
            .populate('storeId', 'name slug domain')
            .populate('categoryIds', 'title slug')
            .populate('attributes.attributeId', 'name slug type values')
            .populate('productOptions.optionId', 'name slug type values')
            .populate('taxClassId', 'name rate isSplit subTaxes')
            .populate('brand', 'name slug logo');
    }

    const canSkipCountForIds =
        idsFilterCount > 0 &&
        page === 1 &&
        limit >= idsFilterCount &&
        !req.query.search;

    // When page=1 with a small limit (widget-style queries), fetch one extra
    // to detect whether more results exist, eliminating the countDocuments call.
    const useHasMoreStrategy =
        !canSkipCountForIds &&
        page === 1 &&
        limit <= 24 &&
        !req.query.search &&
        !req.query.page; // Only skip count when page param is absent (widget queries)

    if (useHasMoreStrategy) {
        productQuery.limit(limit + 1);
    }

    const [rawProducts, total] = await Promise.all([
        productQuery.lean(),
        canSkipCountForIds || useHasMoreStrategy ? Promise.resolve(0) : Product.countDocuments(filter),
    ]);

    let products: any[];
    let totalCount: number;
    if (canSkipCountForIds) {
        products = rawProducts;
        totalCount = products.length;
    } else if (useHasMoreStrategy) {
        const hasMore = rawProducts.length > limit;
        products = hasMore ? rawProducts.slice(0, limit) : rawProducts;
        // If all results fit within limit, total is exact; otherwise signal more exist
        totalCount = hasMore ? skip + limit + 1 : skip + products.length;
    } else {
        products = rawProducts;
        totalCount = total;
    }

    // Add computed pricing fields to each product (sale price, tax, variants)
    // Note: isOnSale / salePrice are pre-calculated during product save — no timezone needed here.
    const productsWithPricing = products.map((product: any) => {
        const productWithOptions = transformProductOptions(product);
        return addPricingToProduct(productWithOptions);
    });

    // Did you mean logic? — Only triggered when 0 results + search query (not on hot path)
    let didYouMean: string | null = null;
    if (totalCount === 0 && req.query.search && effectiveStoreId) {
        didYouMean = await getSearchSuggestions(effectiveStoreId, req.query.search as string);
    }

    // Re-sort by search relevance: strict (full phrase) matches first, then broad (word) matches
    if (req.query.search && !textSearchMode) {
        const searchQuery = (req.query.search as string).trim();
        if (searchQuery.length > 0) {
            const strictRegex = new RegExp(escapeRegExp(searchQuery), 'i');

            productsWithPricing.sort((a: any, b: any) => {
                const scoreProduct = (p: any): number => {
                    // Highest priority: name exact/partial match with full query
                    if (strictRegex.test(p.name || '')) return 4;
                    // SKU / barcode exact match
                    if (strictRegex.test(p.sku || '') || strictRegex.test(p.barcode || '')) return 3;
                    // Variant SKU/barcode match
                    if (p.variants?.some((v: any) => strictRegex.test(v.sku || '') || strictRegex.test(v.barcode || ''))) return 2;
                    // Tags / description match
                    if (strictRegex.test(p.tags?.join(' ') || '') || strictRegex.test(p.description || '')) return 1;
                    // Broad match only (individual word hit)
                    return 0;
                };
                return scoreProduct(b) - scoreProduct(a);
            });
        }
    }

    // Build active filters metadata for frontend URL reconstruction
    const activeFilters: Record<string, any> = {};

    if (req.query.brand) {
        const brands = (req.query.brand as string).split(',').map(b => b.trim());
        const validObjectIds = brands.filter(b => b.match(/^[0-9a-fA-F]{24}$/));
        const brandNames = brands.filter(b => !b.match(/^[0-9a-fA-F]{24}$/));

        const Brand = require('../models/Brand').default;
        const foundBrands = await Brand.find({
            $or: [
                { _id: { $in: validObjectIds.length > 0 ? validObjectIds.map(id => new mongoose.Types.ObjectId(id)) : [] } },
                { slug: { $in: brandNames.map(b => new RegExp(`^${escapeRegExp(b)}$`, 'i')) } },
                { name: { $in: brandNames.map(b => new RegExp(`^${escapeRegExp(b)}$`, 'i')) } }
            ]
        }).select('_id name slug').lean();

        // If we found brands, return them as objects. If not (unlikely if results were found), fallback to string 
        if (foundBrands.length > 0) {
            activeFilters.brand = foundBrands.map((b: any) => ({
                id: b._id,
                name: b.name,
                slug: b.slug
            }));
        } else {
            activeFilters.brand = req.query.brand as string;
        }
    }
    if (req.query.tags) activeFilters.tags = req.query.tags as string;
    if (req.query.rating) activeFilters.rating = req.query.rating as string;
    if (req.query.stock) activeFilters.stock = req.query.stock as string;
    if (req.query.price) activeFilters.price = req.query.price as string;
    if (req.query.minPrice || req.query.maxPrice) {
        activeFilters.price = `${req.query.minPrice || 0}-${req.query.maxPrice || ''}`;
    }
    // Add attribute filters
    Object.keys(req.query).forEach(key => {
        if (key.startsWith('attr_')) {
            const attrSlug = key.replace('attr_', '');
            activeFilters[attrSlug] = req.query[key] as string;
        } else if (filterableAttributeMap[key]) {
            activeFilters[key] = req.query[key] as string;
        } else if (key.startsWith('filter[') && key.endsWith(']')) {
            const attrSlug = key.slice(7, -1);
            activeFilters[attrSlug] = req.query[key] as string;
        }
    });

    // Strip prices if hidden for WEB channel
    if (await shouldHidePriceForChannel(req, effectiveStoreId)) {
        productsWithPricing.forEach(stripPriceFields);
    }

    const responseProducts = isAdmin
        ? productsWithPricing
        : productsWithPricing.map((product: any) => sanitizePublicProduct(product, isListingView ? 'listing' : 'detail'));

    return res.json({
        products: responseProducts,
        pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
        },
        activeFilters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
        sort: sortParam,
        didYouMean: didYouMean || undefined,
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role;
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');
    const removeProductCost = !isAdmin ? '-costPrice -variants.costPrice' : '';

    const product = await Product.findById(req.params.id)
        .select(`-__v ${removeProductCost}`)
        .populate('storeId', 'name slug domain timezone')
        .populate('categoryIds', 'title slug path')
        .populate('attributes.attributeId', 'name slug type values')
        .populate('specifications.attributeId', 'name slug type')
        .populate('productOptions.optionId', 'name slug type values')
        .populate('taxClassId', 'name rate isSplit subTaxes')
        .populate('brand', 'name slug logo')
        .lean();

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Increment view count atomically to prevent version conflicts
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Transform productOptions to include proper label/value format for frontend
    const productObj = product as any; // Already a plain object from .lean()
    transformProductOptions(productObj);

    // Get active sales for this product
    const sales = await (Sale as any).getActiveSalesForProduct(product._id, product.categoryIds);

    // Add computed pricing fields (including variants)
    addPricingToProduct(productObj);

    // Add timezone-aware dates
    const storeTimezone = (productObj.storeId as any)?.timezone || 'UTC';
    addTimezoneAwareDates(productObj, storeTimezone);

    // Add category breadcrumbs
    if (productObj.categoryIds && productObj.categoryIds.length > 0) {
        const primaryCategory: any = productObj.categoryIds[0];
        if (primaryCategory.path) {
            const pathSegments = primaryCategory.path.split('/');
            const ancestors = await Category.find({
                storeId: product.storeId,
                slug: { $in: pathSegments },
                status: 'active'
            }).sort({ level: 1 });

            productObj.categoryBreadcrumbs = ancestors.map(cat => ({
                label: cat.title,
                href: `/${cat.slug}`
            }));
        }
    }

    // Strip prices if hidden for WEB channel
    const productStoreId = typeof productObj.storeId === 'object' ? productObj.storeId._id?.toString() : productObj.storeId?.toString();
    const hidePrice = await shouldHidePriceForChannel(req, productStoreId);
    if (hidePrice) {
        stripPriceFields(productObj);
    }

    res.json({
        product: isAdmin ? productObj : sanitizePublicProduct(productObj, 'detail'),
        activeSales: hidePrice ? undefined : sales,
    });
});

/**
 * @swagger
 * /api/products/slug/{storeId}/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
export const getProductBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, slug } = req.params;
    const userRole = req.user?.role;
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');
    const removeProductCost = !isAdmin ? '-costPrice -variants.costPrice' : '';

    const product = await Product.findOne({ storeId, slug, isActive: true })
        .select(`-__v ${removeProductCost}`)
        .populate('storeId', 'name slug domain timezone')
        .populate('categoryIds', 'title slug path')
        .populate('attributes.attributeId', 'name slug type values')
        .populate('specifications.attributeId', 'name slug type')
        .populate('productOptions.optionId', 'name slug type values')
        .populate('taxClassId', 'name rate isSplit subTaxes')
        .populate('brand', 'name slug logo')
        .lean();

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Increment view count atomically to prevent version conflicts
    await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

    // Transform productOptions to include proper label/value format for frontend
    const productObj = product as any; // Already a plain object from .lean()
    transformProductOptions(productObj);

    // Add computed pricing fields (including variants)
    addPricingToProduct(productObj);

    // Add timezone-aware dates
    const storeTimezone = (productObj.storeId as any)?.timezone || 'UTC';
    addTimezoneAwareDates(productObj, storeTimezone);

    // Add category breadcrumbs
    if (productObj.categoryIds && productObj.categoryIds.length > 0) {
        const primaryCategory: any = productObj.categoryIds[0];
        if (primaryCategory.path) {
            const pathSegments = primaryCategory.path.split('/');
            const ancestors = await Category.find({
                storeId: product.storeId,
                slug: { $in: pathSegments },
                status: 'active'
            }).sort({ level: 1 });

            productObj.categoryBreadcrumbs = ancestors.map(cat => ({
                label: cat.title,
                href: `/${cat.slug}`
            }));
        }
    }

    // Strip prices if hidden for WEB channel
    const productStoreId = typeof productObj.storeId === 'object' ? productObj.storeId._id?.toString() : productObj.storeId?.toString();
    if (await shouldHidePriceForChannel(req, productStoreId)) {
        stripPriceFields(productObj);
    }

    res.json({ product: isAdmin ? productObj : sanitizePublicProduct(productObj, 'detail') });
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;



    const product = await Product.findById(id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // RBAC Check: Store Admin only for assigned stores
    if (req.user?.role === 'store_admin') {
        const assignedStoreIds = req.user.storeIds?.map(id => id.toString()) || [];
        if (!assignedStoreIds.includes(product.storeId.toString())) {
            throw new AppError('Unauthorized: You can only update products for your assigned stores', 403);
        }
    }

    // Check SKU uniqueness if being updated
    if (updates.sku && updates.sku !== product.sku) {
        const existingSKU = await Product.findOne({ sku: updates.sku, _id: { $ne: id } });
        if (existingSKU) {
            throw new AppError('Product with this SKU already exists', 400);
        }
    }

    // Check slug uniqueness if being updated
    if (updates.slug && updates.slug !== product.slug) {
        const existingSlug = await Product.findOne({
            storeId: product.storeId,
            slug: updates.slug,
            _id: { $ne: id },
        });
        if (existingSlug) {
            throw new AppError('Product with this slug already exists in this store', 400);
        }
    }

    // Remove system fields that shouldn't be updated manually
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;

    // Clean up empty strings for ObjectId fields (MongoDB can't cast "" to ObjectId)
    const objectIdFields = ['taxClassId', 'brand'];
    objectIdFields.forEach(field => {
        if (updates[field] === '') {
            updates[field] = undefined;
        }
    });

    // Update product
    Object.assign(product, updates);
    await product.save();

    await updateProductSyncTimestamp(product.storeId.toString());

    res.json({
        message: 'Product updated successfully',
        product,
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    // RBAC Check: Store Admin cannot delete anything
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot delete products', 403);
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    // Clean up slug registry
    await SlugRegistry.deleteMany({ entityType: 'product', entityId: product._id });

    await updateProductSyncTimestamp(product.storeId.toString());

    res.json({
        message: 'Product deleted successfully',
    });
});

/**
 * @swagger
 * /api/products/{id}/clone:
 *   post:
 *     summary: Clone product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Product cloned successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
export const cloneProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const productObj: any = product.toObject();

    // Delete system fields
    delete productObj._id;
    delete productObj.createdAt;
    delete productObj.updatedAt;
    delete productObj.__v;

    // Modify fields for clone
    productObj.name = `[CLONE] ${product.name}`;
    productObj.isActive = false;

    // Generate unique slug
    const timestamp = Date.now();
    productObj.slug = `${product.slug}-clone-${timestamp}`;

    // Handle SKU if present (append -clone to avoid duplicate key error if unique index exists)
    if (productObj.sku) {
        productObj.sku = `${productObj.sku}-clone-${timestamp}`;
    }

    const clonedProduct = await Product.create(productObj);

    res.status(201).json({
        message: 'Product cloned successfully',
        product: clonedProduct,
    });
});

/**
 * @swagger
 * /api/products/{id}/check-shipping:
 *   post:
 *     summary: Check if product can ship to location
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shipping availability checked
 */
export const checkShipping = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    const { country, state, city } = req.body;
    const canShip = (product as any).canShipTo(country, state, city);

    res.json({
        canShip,
        message: canShip ? 'Product can be shipped to this location' : 'Product cannot be shipped to this location',
    });
});

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Featured products retrieved
 */
export const getFeaturedProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role;
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');
    const removeProductCost = !isAdmin ? '-costPrice -variants.costPrice' : '';
    const limit = parseInt(req.query.limit as string) || 10;
    const filter: any = { isActive: true, isFeatured: true };

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    const products = await Product.find(filter)
        .select(removeProductCost)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .limit(limit)
        .sort({ salesCount: -1 })
        .lean();

    // Strip prices if hidden for WEB channel
    const storeId = req.query.storeId as string;
    if (storeId && await shouldHidePriceForChannel(req, storeId)) {
        products.forEach((p: any) => stripPriceFields(p));
    }

    res.json({
        products: isAdmin ? products : products.map((product: any) => sanitizePublicProduct(product, 'listing')),
    });
});

/**
 * @swagger
 * /api/products/on-sale:
 *   get:
 *     summary: Get products on sale
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: storeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sale products retrieved
 */
export const getOnSaleProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userRole = req.user?.role;
    const isAdmin = userRole && (userRole === 'admin' || userRole === 'store_admin' || userRole === 'super_admin');
    const removeProductCost = !isAdmin ? '-costPrice -variants.costPrice' : '';
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: any = { isActive: true, isOnSale: true };

    if (req.query.storeId) {
        filter.storeId = req.query.storeId;
    }

    const products = await Product.find(filter)
        .select(removeProductCost)
        .populate('storeId', 'name slug')
        .populate('categoryIds', 'title slug')
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    // Strip prices if hidden for WEB channel
    const storeId = req.query.storeId as string;
    if (storeId && await shouldHidePriceForChannel(req, storeId)) {
        products.forEach((p: any) => stripPriceFields(p));
    }

    res.json({
        products: isAdmin ? products : products.map((product: any) => sanitizePublicProduct(product, 'listing')),
    });
});

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: number
 *               stockStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 */
export const updateStock = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { stock, stockStatus } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }

    if (stock !== undefined) product.stock = stock;
    if (stockStatus) product.stockStatus = stockStatus;

    await product.save();

    await updateProductSyncTimestamp(product.storeId.toString());

    res.json({
        message: 'Stock updated successfully',
        product: {
            _id: product._id,
            stock: product.stock,
            stockStatus: product.stockStatus,
        },
    });
});

/**
 * @swagger
 * /api/products/search/filters:
 *   get:
 *     summary: Get available filters for search results
 *     tags: [Products]
 *     description: Returns aggregated filter data from products matching a search query
 *     parameters:
 *       - in: query
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Filter data retrieved successfully
 */
export const getSearchFilters = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, search } = req.query;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    if (!search) {
        throw new AppError('search query is required', 400);
    }

    const Attribute = require('../models/Attribute').default;
    const searchRegex = new RegExp(search as string, 'i');

    // Build base match for products matching the search
    const baseMatch: any = {
        storeId: mongoose.Types.ObjectId.createFromHexString(storeId as string),
        isActive: true,
        $or: [
            { name: searchRegex },
            { sku: searchRegex },
            { 'variants.sku': searchRegex },
        ],
    };

    // Run aggregation pipelines in parallel
    const [priceRange, brands, tags, ratings, availability] = await Promise.all([
        // Price range
        Product.aggregate([
            { $match: baseMatch },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' },
                },
            },
        ]),

        // Brands with count (lookup brand name from brands collection)
        // Normalize brand to string to handle mixed ObjectId/string storage
        Product.aggregate([
            { $match: { ...baseMatch, brand: { $exists: true, $nin: [null, ''] } } },
            {
                $addFields: {
                    brandIdStr: { $toString: '$brand' },
                },
            },
            { $group: { _id: '$brandIdStr', count: { $sum: 1 } } },
            {
                $addFields: {
                    brandObjectId: { $toObjectId: '$_id' },
                },
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brandObjectId',
                    foreignField: '_id',
                    as: 'brandInfo',
                },
            },
            { $unwind: { path: '$brandInfo', preserveNullAndEmptyArrays: true } },
            // Group again by brand _id to merge any remaining duplicates
            {
                $group: {
                    _id: '$brandInfo._id',
                    value: { $first: '$_id' },
                    label: { $first: '$brandInfo.name' },
                    count: { $sum: '$count' },
                },
            },
            { $match: { _id: { $ne: null } } }, // Filter out entries with no brand match
            { $sort: { count: -1 } },
            {
                $project: {
                    value: '$value',
                    label: { $ifNull: ['$label', '$value'] },
                    count: 1,
                    _id: 0,
                },
            },
        ]),

        // Tags with count
        Product.aggregate([
            { $match: baseMatch },
            { $unwind: '$tags' },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
            { $project: { value: '$_id', label: '$_id', count: 1, _id: 0 } },
        ]),

        // Rating distribution
        Product.aggregate([
            { $match: { ...baseMatch, averageRating: { $exists: true, $ne: null } } },
            {
                $bucket: {
                    groupBy: '$averageRating',
                    boundaries: [0, 1, 2, 3, 4, 5.1],
                    default: 'Other',
                    output: { count: { $sum: 1 } },
                },
            },
        ]),

        // Availability
        Product.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$stockStatus', count: { $sum: 1 } } },
            { $project: { value: '$_id', status: '$_id', count: 1, _id: 0 } },
        ]),
    ]);

    // Get filterable attributes with their values from search results
    const filterableAttributes = await Attribute.find({
        storeId: mongoose.Types.ObjectId.createFromHexString(storeId as string),
        $or: [{ isFilterable: true }, { isFilterable: { $exists: false } }]
    }).lean();

    // Get attribute values used in products matching the search
    const attributeValuesAgg = await Product.aggregate([
        { $match: baseMatch },
        { $unwind: '$specifications' },
        {
            $group: {
                _id: {
                    attributeId: '$specifications.attributeId',
                    value: '$specifications.value',
                },
                count: { $sum: 1 },
            },
        },
        {
            $group: {
                _id: '$_id.attributeId',
                values: { $push: { value: '$_id.value', count: '$count' } },
            },
        },
    ]);

    // Merge attribute data with aggregated values
    const attributes = filterableAttributes.map((attr: any) => {
        const aggData = attributeValuesAgg.find(
            (a: any) => a._id && String(a._id) === String(attr._id)
        );
        return {
            _id: attr._id,
            name: attr.name,
            slug: attr.slug,
            type: attr.type,
            values: aggData ? aggData.values : [],
            options: attr.options || [],
        };
    }).filter((attr: any) => attr.values.length > 0);

    res.json({
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
        brands,
        tags,
        ratings: ratings.map((r: any) => ({
            rating: r._id === 'Other' ? null : Math.floor(r._id),
            count: r.count,
        })).filter((r: any) => r.rating !== null),
        availability,
        subcategories: [], // Search doesn't have subcategories
        attributes,
    });
});

/**
 * Bulk action on products (delete, activate, deactivate)
 * POST /api/products/bulk-action
 */
export const bulkAction = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot perform bulk actions', 403);
    }

    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('ids array is required', 400);
    }

    if (!['delete', 'activate', 'deactivate'].includes(action)) {
        throw new AppError('Invalid action. Must be delete, activate, or deactivate', 400);
    }

    // Collect storeIds for cache invalidation
    const products = await Product.find({ _id: { $in: ids } }).select('storeId');
    const storeIds = [...new Set(products.map(p => p.storeId.toString()))];

    let affected = 0;

    switch (action) {
        case 'delete': {
            const r = await Product.deleteMany({ _id: { $in: ids } });
            affected = r.deletedCount;
            // Clean up slug registry for deleted products
            await SlugRegistry.deleteMany({ entityType: 'product', entityId: { $in: ids } });
            break;
        }
        case 'activate': {
            const r = await Product.updateMany({ _id: { $in: ids } }, { isActive: true });
            affected = r.modifiedCount;
            break;
        }
        case 'deactivate': {
            const r = await Product.updateMany({ _id: { $in: ids } }, { isActive: false });
            affected = r.modifiedCount;
            break;
        }
    }

    // Invalidate caches for all affected stores
    for (const storeId of storeIds) {
        await updateProductSyncTimestamp(storeId);
    }

    res.json({
        message: `Bulk ${action} completed successfully`,
        affected,
    });
});

/**
 * Bulk operation on products (price, stock, weight adjustments)
 * POST /api/products/bulk-operation
 */
export const bulkOperation = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.user?.role === 'store_admin') {
        throw new AppError('Unauthorized: Store admins cannot perform bulk operations', 403);
    }

    const { ids, pricePercent, priceNormalizer, priceRoundDirection, stockQty, weightPercent } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new AppError('ids array is required', 400);
    }

    if (!pricePercent && !stockQty && !weightPercent) {
        throw new AppError('At least one operation (price, stock, or weight) is required', 400);
    }

    // Helper function to round price based on normalizer
    const roundPrice = (price: number, normalizer: number, direction: string): number => {
        if (normalizer === 0 || !normalizer) return price;

        if (normalizer === 1) {
            return direction === 'up' ? Math.ceil(price) : Math.floor(price);
        }

        const remainder = price % normalizer;
        if (direction === 'up') {
            return remainder === 0 ? price : price + (normalizer - remainder);
        } else {
            return price - remainder;
        }
    };

    const products = await Product.find({ _id: { $in: ids } });
    const storeIds = [...new Set(products.map(p => p.storeId.toString()))];

    let updated = 0;

    for (const product of products) {
        const updates: any = {};

        // Price adjustment
        if (pricePercent !== null && pricePercent !== undefined && pricePercent !== '') {
            const newPrice = product.price * (1 + pricePercent / 100);
            updates.price = roundPrice(newPrice, priceNormalizer || 0, priceRoundDirection || 'up');

            // Adjust sale price if exists
            if (product.salePrice) {
                const newSalePrice = product.salePrice * (1 + pricePercent / 100);
                updates.salePrice = roundPrice(newSalePrice, priceNormalizer || 0, priceRoundDirection || 'up');
            }
        }

        // Stock adjustment
        if (stockQty !== null && stockQty !== undefined && stockQty !== '') {
            updates.stock = stockQty;
        }

        // Weight adjustment
        if (weightPercent !== null && weightPercent !== undefined && weightPercent !== '') {
            if (product.weight) {
                updates.weight = product.weight * (1 + weightPercent / 100);
            }
        }

        // Update product
        if (Object.keys(updates).length > 0) {
            await Product.findByIdAndUpdate(product._id, updates);
            updated++;
        }

        // Update variants if they exist
        if (product.variants && product.variants.length > 0) {
            const variantUpdates = product.variants.map((variant: any) => {
                const variantUpdate: any = { ...variant.toObject() };

                if (pricePercent !== null && pricePercent !== undefined && pricePercent !== '') {
                    const newPrice = (variant.price || product.price) * (1 + pricePercent / 100);
                    variantUpdate.price = roundPrice(newPrice, priceNormalizer || 0, priceRoundDirection || 'up');

                    if (variant.salePrice) {
                        const newSalePrice = variant.salePrice * (1 + pricePercent / 100);
                        variantUpdate.salePrice = roundPrice(newSalePrice, priceNormalizer || 0, priceRoundDirection || 'up');
                    }
                }

                if (stockQty !== null && stockQty !== undefined && stockQty !== '') {
                    variantUpdate.stock = stockQty;
                }

                if (weightPercent !== null && weightPercent !== undefined && weightPercent !== '') {
                    if (variant.weight) {
                        variantUpdate.weight = variant.weight * (1 + weightPercent / 100);
                    }
                }

                return variantUpdate;
            });

            if (variantUpdates.some((v: any) => Object.keys(v).length > 0)) {
                await Product.findByIdAndUpdate(product._id, { variants: variantUpdates });
            }
        }
    }

    // Invalidate caches for all affected stores
    for (const storeId of storeIds) {
        await updateProductSyncTimestamp(storeId);
    }

    res.json({
        message: 'Bulk operation completed successfully',
        updated,
    });
});
