import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import UserInterest from '../models/UserInterest';
import Product from '../models/Product';

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

    // Get user interest data
    const query: any = { storeId };
    if (userId) {
        query.userId = userId;
    } else if (sessionId) {
        query.sessionId = sessionId;
    }

    const interest = userId || sessionId ? await UserInterest.findOne(query) : null;

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

    let products: any[] = [];
    let isPersonalized = false;

    // Strategy 1: Products matching search keywords (highest priority)
    if (searchKeywords.size > 0 && products.length < limitNum) {
        const { escapeRegExp } = require('../utils/search.utils');
        const searchRegexes = Array.from(searchKeywords).map(kw => new RegExp(escapeRegExp(kw), 'i'));
        const searchQuery = {
            ...baseQuery,
            _id: {
                $nin: [
                    ...products.map(p => p._id),
                    ...Array.from(excludeProductIds).map(id => new mongoose.Types.ObjectId(id))
                ]
            },
            $or: [
                { name: { $in: searchRegexes } },
                { description: { $in: searchRegexes } },
                { tags: { $in: Array.from(searchKeywords) } },
                { sku: { $in: searchRegexes } },
            ],
        };

        const searchProducts = await Product.find(searchQuery)
            .sort({ salesCount: -1, averageRating: -1 })
            .limit(limitNum - products.length)
            .populate('categoryIds', 'title slug')
            .populate('brand', 'name')
            .lean();

        if (searchProducts.length > 0) {
            products = [...products, ...searchProducts];
            isPersonalized = true;
        }
    }

    // Strategy 2: Products from viewed categories
    if (viewedCategoryIds.size > 0 && products.length < limitNum) {
        const categoryQuery = {
            ...baseQuery,
            _id: {
                $nin: [
                    ...products.map(p => p._id),
                    ...Array.from(excludeProductIds).map(id => new mongoose.Types.ObjectId(id))
                ]
            },
            categoryIds: {
                $in: Array.from(viewedCategoryIds).map(id => new mongoose.Types.ObjectId(id)),
            },
        };

        const categoryProducts = await Product.find(categoryQuery)
            .sort({ salesCount: -1, averageRating: -1 })
            .limit(limitNum - products.length)
            .populate('categoryIds', 'title slug')
            .populate('brand', 'name')
            .lean();

        if (categoryProducts.length > 0) {
            products = [...products, ...categoryProducts];
            isPersonalized = true;
        }
    }

    // Keep reference for exclusion in fallback
    const productQuery = baseQuery;

    // Fallback if no personalized results
    if (products.length < limitNum) {
        const remainingLimit = limitNum - products.length;
        const existingIds = products.map(p => p._id);

        const fallbackQuery: any = {
            ...productQuery,
            _id: { $nin: [...existingIds, ...Array.from(excludeProductIds).map(id => new mongoose.Types.ObjectId(id))] },
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
            .sort(sortOrder)
            .limit(remainingLimit)
            .populate('categoryIds', 'title slug')
            .populate('brand', 'name')
            .lean();

        products = [...products, ...fallbackProducts];
    }

    res.json({
        success: true,
        isPersonalized,
        fallback: isPersonalized ? null : fallback,
        total: products.length,
        products: products.map(p => ({
            _id: p._id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            salePrice: p.isOnSale ? p.salePrice : undefined,
            images: p.images,
            featuredImage: p.featuredImage,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount,
            stockStatus: p.stockStatus,
            isOnSale: p.isOnSale,
            categories: p.categoryIds,
            brand: p.brand,
        })),
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
