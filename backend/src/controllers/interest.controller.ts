import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import UserInterest from '../models/UserInterest';
import Product from '../models/Product';
import Store from '../models/Store';
import { addPricingToProduct, transformProductOptions } from './product.controller';
import { addTimezoneAwareDates } from '../utils/date.utils';
import { escapeRegExp } from '../utils/search.utils';

/**
 * Track user interest event (view, search, purchase)
 * POST /api/interests/track
 */
export const trackInterest = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, sessionId, eventType, data } = req.body;
    const userId = req.user?.id;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    if (!userId && !sessionId) {
        throw new AppError('Either user authentication or sessionId is required', 400);
    }

    if (!eventType || !['view', 'search', 'purchase'].includes(eventType)) {
        throw new AppError('eventType must be view, search, or purchase', 400);
    }

    // Get or create user interest record
    const query: any = { storeId };
    if (userId) {
        query.userId = userId;
    } else {
        query.sessionId = sessionId;
    }

    let interest = await UserInterest.findOne(query);
    if (!interest) {
        interest = new UserInterest(query);
    }

    const now = new Date();

    switch (eventType) {
        case 'view':
            if (!data?.productId) {
                throw new AppError('productId is required for view events', 400);
            }
            // Avoid duplicate views within 5 minutes
            const recentView = interest.viewedProducts.find(
                v => v.productId.toString() === data.productId &&
                    (now.getTime() - v.viewedAt.getTime()) < 5 * 60 * 1000
            );
            if (!recentView) {
                const pid = typeof data.productId === 'string' ? data.productId : data.productId?._id;
                if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
                    break; // Skip invalid IDs
                }

                interest.viewedProducts.push({
                    productId: new mongoose.Types.ObjectId(pid),
                    categoryIds: (data.categoryIds || []).filter((id: any) => {
                        const cid = typeof id === 'string' ? id : id?._id;
                        return cid && mongoose.Types.ObjectId.isValid(cid);
                    }).map((id: any) => new mongoose.Types.ObjectId(typeof id === 'string' ? id : id._id)),
                    tags: data.tags || [],
                    viewedAt: now,
                });
                // Keep only last 100 views
                if (interest.viewedProducts.length > 100) {
                    interest.viewedProducts = interest.viewedProducts.slice(-100);
                }
            }
            break;

        case 'search':
            if (!data?.query) {
                throw new AppError('query is required for search events', 400);
            }
            interest.searchQueries.push({
                query: data.query.trim().toLowerCase(),
                searchedAt: now,
            });
            // Keep only last 50 searches
            if (interest.searchQueries.length > 50) {
                interest.searchQueries = interest.searchQueries.slice(-50);
            }
            break;

        case 'purchase':
            if (!data?.products || !Array.isArray(data.products)) {
                throw new AppError('products array is required for purchase events', 400);
            }
            for (const product of data.products) {
                const pid = typeof product.productId === 'string' ? product.productId : product.productId?._id;
                if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
                    continue; // Skip invalid IDs
                }

                interest.purchasedProducts.push({
                    productId: new mongoose.Types.ObjectId(pid),
                    categoryIds: (product.categoryIds || []).filter((id: any) => {
                        const cid = typeof id === 'string' ? id : id?._id;
                        return cid && mongoose.Types.ObjectId.isValid(cid);
                    }).map((id: any) => new mongoose.Types.ObjectId(typeof id === 'string' ? id : id._id)),
                    purchasedAt: now,
                });
            }
            break;
    }

    await interest.save();

    res.json({
        success: true,
        message: `${eventType} event tracked successfully`,
    });
});

/**
 * Get personalized product recommendations
 * GET /api/interests/recommendations
 */
export const getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        storeId,
        sessionId,
        limit = '12',
        exclusionScope = 'category',
        exclusionDays = '30',
        retentionDays = '30',
        fallback = 'featured',
    } = req.query;

    const userId = req.user?.id;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    const limitNum = Math.min(parseInt(limit as string) || 12, 50);
    const exclusionDaysNum = Math.min(parseInt(exclusionDays as string) || 30, 90);
    const retentionDaysNum = Math.min(parseInt(retentionDays as string) || 30, 90);

    // Build user interest query
    const query: any = { storeId };
    if (userId) {
        query.userId = userId;
    } else if (sessionId) {
        query.sessionId = sessionId;
    }

    // Fetch timezone + interest in parallel to reduce request latency
    const [store, interest] = await Promise.all([
        Store.findById(storeId).select('timezone').lean(),
        (userId || sessionId)
            ? UserInterest.findOne(query).select('viewedProducts searchQueries purchasedProducts').lean()
            : Promise.resolve(null),
    ]);

    const storeTimezone = store?.timezone || 'UTC';

    // Calculate cutoff dates
    const viewCutoff = new Date();
    viewCutoff.setDate(viewCutoff.getDate() - retentionDaysNum);

    const purchaseCutoff = new Date();
    purchaseCutoff.setDate(purchaseCutoff.getDate() - exclusionDaysNum);

    // Extract viewed categories, tags, and search queries
    const viewedCategoryIds = new Set<string>();
    const viewedTags = new Set<string>();
    const viewedProductIds = new Set<string>();
    const searchKeywords = new Set<string>();

    if (interest) {
        for (const view of interest.viewedProducts) {
            if (view.viewedAt > viewCutoff) {
                viewedProductIds.add(view.productId.toString());
                view.categoryIds.forEach(id => viewedCategoryIds.add(id.toString()));
                view.tags.forEach(tag => viewedTags.add(tag.toLowerCase()));
            }
        }

        // Extract search keywords (last N days)
        for (const search of interest.searchQueries) {
            if (search.searchedAt > viewCutoff) {
                // Split search query into words and add each keyword
                const words = search.query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                words.forEach(word => searchKeywords.add(word));
            }
        }
    }

    // Build exclusion list based on purchases
    const excludeProductIds = new Set<string>();
    const excludeCategoryIds = new Set<string>();

    if (interest) {
        for (const purchase of interest.purchasedProducts) {
            if (purchase.purchasedAt > purchaseCutoff) {
                excludeProductIds.add(purchase.productId.toString());
                if (exclusionScope === 'category') {
                    purchase.categoryIds.forEach(id => excludeCategoryIds.add(id.toString()));
                }
            }
        }
    }

    // Build base product query
    const baseQuery: any = {
        storeId: new mongoose.Types.ObjectId(storeId as string),
        isActive: true,
    };

    // Exclude purchased products
    if (excludeProductIds.size > 0) {
        baseQuery._id = { $nin: Array.from(excludeProductIds).map(id => new mongoose.Types.ObjectId(id)) };
    }

    // If we have category exclusions, exclude those categories
    if (exclusionScope === 'category' && excludeCategoryIds.size > 0) {
        baseQuery.categoryIds = { $nin: Array.from(excludeCategoryIds).map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Recommendation-specific field projection: exclude heavy fields not needed for cards
    const recommendationSelect = '-description -shortDescription -specifications -geoLimit -digitalProduct -googleMerchant -returnSettings -dimensions -seo -channels -__v -costPrice -variants.costPrice';

    // Precompute exclusion ObjectIds once to avoid repeated conversions
    const excludeProductObjectIds = Array.from(excludeProductIds).map(id => new mongoose.Types.ObjectId(id));

    let products: any[] = [];
    let isPersonalized = false;

    // Strategy 1 & 2: Run search-keyword and viewed-category queries in parallel
    // Each requests limitNum results; we deduplicate and trim afterwards.
    const hasSearchStrategy = searchKeywords.size > 0;
    const hasCategoryStrategy = viewedCategoryIds.size > 0;

    if (hasSearchStrategy || hasCategoryStrategy) {
        const searchRegexes = hasSearchStrategy
            ? Array.from(searchKeywords).map(kw => new RegExp(escapeRegExp(kw), 'i'))
            : [];

        const searchQueryFilter = hasSearchStrategy ? {
            ...baseQuery,
            _id: { $nin: excludeProductObjectIds },
            $or: [
                { name: { $in: searchRegexes } },
                { tags: { $in: Array.from(searchKeywords) } },
                { sku: { $in: searchRegexes } },
            ],
        } : null;

        const categoryQueryFilter = hasCategoryStrategy ? {
            ...baseQuery,
            _id: { $nin: excludeProductObjectIds },
            categoryIds: {
                $in: Array.from(viewedCategoryIds).map(id => new mongoose.Types.ObjectId(id)),
            },
        } : null;

        const [searchProducts, categoryProducts] = await Promise.all([
            searchQueryFilter
                ? Product.find(searchQueryFilter)
                    .select(recommendationSelect)
                    .sort({ salesCount: -1, averageRating: -1 })
                    .limit(limitNum)
                    .populate('categoryIds', 'title slug')
                    .populate('taxClassId', 'name rate isSplit subTaxes')
                    .populate('brand', 'name slug logo')
                    .lean()
                : Promise.resolve([]),
            categoryQueryFilter
                ? Product.find(categoryQueryFilter)
                    .select(recommendationSelect)
                    .sort({ salesCount: -1, averageRating: -1 })
                    .limit(limitNum)
                    .populate('categoryIds', 'title slug')
                    .populate('taxClassId', 'name rate isSplit subTaxes')
                    .populate('brand', 'name slug logo')
                    .lean()
                : Promise.resolve([]),
        ]);

        // Deduplicate: search results take priority, then category results
        const seenIds = new Set<string>();
        for (const p of searchProducts) {
            const id = p._id.toString();
            if (!seenIds.has(id)) {
                seenIds.add(id);
                products.push(p);
            }
        }
        for (const p of categoryProducts) {
            if (products.length >= limitNum) break;
            const id = p._id.toString();
            if (!seenIds.has(id)) {
                seenIds.add(id);
                products.push(p);
            }
        }

        products = products.slice(0, limitNum);
        isPersonalized = products.length > 0;
    }

    // Fallback if no personalized results or still under limit
    if (products.length < limitNum) {
        const remainingLimit = limitNum - products.length;
        const existingIds = products.map(p => p._id);

        const fallbackQuery: any = {
            ...baseQuery,
            _id: { $nin: [...existingIds, ...excludeProductObjectIds] },
        };

        let sortOrder: any = { createdAt: -1 };
        switch (fallback) {
            case 'trending':
                sortOrder = { salesCount: -1, views: -1 };
                break;
            case 'featured':
                fallbackQuery.isFeatured = true;
                sortOrder = { createdAt: -1 };
                break;
            case 'latest':
                sortOrder = { createdAt: -1 };
                break;
            case 'sale':
                fallbackQuery.isOnSale = true;
                sortOrder = { salePrice: 1 };
                break;
        }

        const fallbackProducts = await Product.find(fallbackQuery)
            .select(recommendationSelect)
            .sort(sortOrder)
            .limit(remainingLimit)
            .populate('categoryIds', 'title slug')
            .populate('taxClassId', 'name rate isSplit subTaxes')
            .populate('brand', 'name slug logo')
            .lean();

        products = [...products, ...fallbackProducts];
    }

    // Add computed pricing fields to each product (including variants) and localized dates
    const productsWithPricing = products.map((product: any) => {
        const productWithOptions = transformProductOptions(product);
        const productWithPricing = addPricingToProduct(productWithOptions);
        return addTimezoneAwareDates(productWithPricing, storeTimezone);
    });

    res.json({
        success: true,
        isPersonalized,
        fallback: isPersonalized ? null : fallback,
        total: products.length,
        products: productsWithPricing,
    });
});

/**
 * Sync localStorage data to database (on login)
 * POST /api/interests/sync
 */
export const syncInterests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { storeId, localData } = req.body;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    // Get or create user interest record
    let interest = await UserInterest.findOne({ storeId, userId });
    if (!interest) {
        interest = new UserInterest({ storeId, userId });
    }

    // Merge localStorage data
    if (localData?.viewedProducts) {
        for (const view of localData.viewedProducts) {
            const exists = interest.viewedProducts.some(
                v => v.productId.toString() === view.productId
            );
            if (!exists) {
                const pid = typeof view.productId === 'string' ? view.productId : view.productId?._id;
                if (pid && mongoose.Types.ObjectId.isValid(pid)) {
                    interest.viewedProducts.push({
                        productId: new mongoose.Types.ObjectId(pid),
                        categoryIds: (view.categoryIds || []).filter((id: any) => {
                            const cid = typeof id === 'string' ? id : id?._id;
                            return cid && mongoose.Types.ObjectId.isValid(cid);
                        }).map((id: any) => new mongoose.Types.ObjectId(typeof id === 'string' ? id : id._id)),
                        tags: view.tags || [],
                        viewedAt: new Date(view.viewedAt),
                    });
                }
            }
        }
    }

    if (localData?.searchQueries) {
        for (const search of localData.searchQueries) {
            interest.searchQueries.push({
                query: search.query,
                searchedAt: new Date(search.searchedAt),
            });
        }
    }

    if (localData?.purchasedProducts) {
        for (const purchase of localData.purchasedProducts) {
            const exists = interest.purchasedProducts.some(
                p => p.productId.toString() === purchase.productId
            );
            if (!exists) {
                const pid = typeof purchase.productId === 'string' ? purchase.productId : purchase.productId?._id;
                if (pid && mongoose.Types.ObjectId.isValid(pid)) {
                    interest.purchasedProducts.push({
                        productId: new mongoose.Types.ObjectId(pid),
                        categoryIds: (purchase.categoryIds || []).filter((id: any) => {
                            const cid = typeof id === 'string' ? id : id?._id;
                            return cid && mongoose.Types.ObjectId.isValid(cid);
                        }).map((id: any) => new mongoose.Types.ObjectId(typeof id === 'string' ? id : id._id)),
                        purchasedAt: new Date(purchase.purchasedAt),
                    });
                }
            }
        }
    }

    // Sort and limit arrays
    interest.viewedProducts.sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
    interest.viewedProducts = interest.viewedProducts.slice(0, 100);

    interest.searchQueries.sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime());
    interest.searchQueries = interest.searchQueries.slice(0, 50);

    await interest.save();

    res.json({
        success: true,
        message: 'Interest data synced successfully',
    });
});

/**
 * Clear user interest data
 * DELETE /api/interests
 */
export const clearInterests = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { storeId } = req.query;

    if (!userId) {
        throw new AppError('Authentication required', 401);
    }

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    await UserInterest.deleteOne({ storeId, userId });

    res.json({
        success: true,
        message: 'Interest data cleared successfully',
    });
});
