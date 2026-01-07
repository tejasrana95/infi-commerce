import { Response } from 'express';
import ContentCard from '../models/ContentCard';
import ContentCardCategory from '../models/ContentCardCategory';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all content cards with filtering
 */
export const getContentCards = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.headers['x-store-id'] || req.query.storeId;
        const {
            categoryId,
            status,
            tags,
            search,
            limit = 50,
            skip = 0,
            sortBy = 'publishedAt',
            sortOrder = 'desc',
        } = req.query;

        const query: any = {};

        if (storeId) {
            query.storeId = storeId;
        }

        if (categoryId) {
            query.categoryId = categoryId;
        }

        // Only filter by status if explicitly provided and not empty
        if (status && status !== '' && status !== 'all') {
            query.status = status;
        } else if (!req.user) {
            // Public API: only show published
            query.status = 'published';
        }
        // Authenticated users with no status filter (or status='all') see all statuses

        // Search functionality
        if (search && search !== '') {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ];
        }

        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            query.tags = { $in: tagArray };
        }

        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

        const cards = await ContentCard.find(query)
            .populate('categoryId', 'name slug icon')
            .populate('storeId', 'name slug')
            .sort(sort)
            .limit(parseInt(limit as string))
            .skip(parseInt(skip as string))
            .lean();

        const total = await ContentCard.countDocuments(query);

        return res.json({
            success: true,
            data: cards,
            pagination: {
                total,
                limit: parseInt(limit as string),
                skip: parseInt(skip as string),
            },
        });
    } catch (error: any) {
        console.error('Error fetching content cards:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch content cards',
            error: error.message,
        });
    }
};

/**
 * Get single content card by ID
 */
export const getContentCardById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.headers['x-store-id'] || req.query.storeId;

        const query: any = { _id: id };
        if (storeId) {
            query.storeId = storeId;
        }

        const card = await ContentCard.findOne(query)
            .populate('categoryId', 'name slug icon')
            .lean();

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        // If public API and not published, don't show
        if (!req.user && card.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        return res.json({
            success: true,
            data: card,
        });
    } catch (error: any) {
        console.error('Error fetching content card:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch content card',
            error: error.message,
        });
    }
};

/**
 * Get content card by slug
 */
export const getContentCardBySlug = async (req: AuthRequest, res: Response) => {
    try {
        const { slug } = req.params;
        const storeId = req.headers['x-store-id'] || req.query.storeId;

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'Store ID is required',
            });
        }

        const card = await ContentCard.findOne({ storeId, slug })
            .populate('categoryId', 'name slug icon')
            .lean();

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        // If public API and not published, don't show
        if (!req.user && card.status !== 'published') {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        return res.json({
            success: true,
            data: card,
        });
    } catch (error: any) {
        console.error('Error fetching content card by slug:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch content card',
            error: error.message,
        });
    }
};

/**
 * Create new content card
 */
export const createContentCard = async (req: AuthRequest, res: Response) => {
    try {
        const cardData = req.body;

        // Validate buttons count
        if (cardData.buttons && cardData.buttons.length > 2) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 2 buttons allowed per content card',
            });
        }

        const card = new ContentCard(cardData);
        await card.save();

        return res.status(201).json({
            success: true,
            data: card,
            message: 'Content card created successfully',
        });
    } catch (error: any) {
        console.error('Error creating content card:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create content card',
            error: error.message,
        });
    }
};

/**
 * Update content card
 */
export const updateContentCard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate buttons count
        if (updates.buttons && updates.buttons.length > 2) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 2 buttons allowed per content card',
            });
        }

        const card = await ContentCard.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        return res.json({
            success: true,
            data: card,
            message: 'Content card updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating content card:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update content card',
            error: error.message,
        });
    }
};

/**
 * Delete content card
 */
export const deleteContentCard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const card = await ContentCard.findByIdAndDelete(id);

        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        return res.json({
            success: true,
            message: 'Content card deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting content card:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete content card',
            error: error.message,
        });
    }
};

/**
 * Clone content card
 */
export const cloneContentCard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Find the original card
        const originalCard = await ContentCard.findById(id).lean();

        if (!originalCard) {
            return res.status(404).json({
                success: false,
                message: 'Content card not found',
            });
        }

        // Create a copy with modified fields
        const clonedCardData: any = {
            ...originalCard,
            title: `${originalCard.title} (Copy)`,
            slug: `${originalCard.slug}-copy-${Date.now()}`,
            status: 'draft', // Set to draft by default
        };

        // Remove fields that shouldn't be copied
        delete clonedCardData._id;
        delete clonedCardData.createdAt;
        delete clonedCardData.updatedAt;
        delete clonedCardData.__v;

        // Create the new card
        const clonedCard = new ContentCard(clonedCardData);
        await clonedCard.save();

        return res.status(201).json({
            success: true,
            data: clonedCard,
            message: 'Content card cloned successfully',
        });
    } catch (error: any) {
        console.error('Error cloning content card:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clone content card',
            error: error.message,
        });
    }
};

// ============================================
// Content Card Categories
// ============================================

/**
 * Get all content card categories
 */
export const getContentCardCategories = async (req: AuthRequest, res: Response) => {
    try {
        const storeId = req.headers['x-store-id'] || req.query.storeId;
        const { isActive } = req.query;

        const query: any = {};

        if (storeId) {
            query.storeId = storeId;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await ContentCardCategory.find(query)
            .sort({ displayOrder: 1, name: 1 })
            .lean();

        return res.json({
            success: true,
            data: categories,
        });
    } catch (error: any) {
        console.error('Error fetching content card categories:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch content card categories',
            error: error.message,
        });
    }
};

/**
 * Get single content card category by ID
 */
export const getContentCardCategoryById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const storeId = req.headers['x-store-id'] || req.query.storeId;

        const query: any = { _id: id };
        if (storeId) {
            query.storeId = storeId;
        }

        const category = await ContentCardCategory.findOne(query).lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Content card category not found',
            });
        }

        return res.json({
            success: true,
            data: category,
        });
    } catch (error: any) {
        console.error('Error fetching content card category:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch content card category',
            error: error.message,
        });
    }
};

/**
 * Create new content card category
 */
export const createContentCardCategory = async (req: AuthRequest, res: Response) => {
    try {
        const categoryData = req.body;

        const category = new ContentCardCategory(categoryData);
        await category.save();

        res.status(201).json({
            success: true,
            data: category,
            message: 'Content card category created successfully',
        });
    } catch (error: any) {
        console.error('Error creating content card category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create content card category',
            error: error.message,
        });
    }
};

/**
 * Update content card category
 */
export const updateContentCardCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const category = await ContentCardCategory.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Content card category not found',
            });
        }

        return res.json({
            success: true,
            data: category,
            message: 'Content card category updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating content card category:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update content card category',
            error: error.message,
        });
    }
};

/**
 * Delete content card category
 */
export const deleteContentCardCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if category has cards
        const cardCount = await ContentCard.countDocuments({ categoryId: id });
        if (cardCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${cardCount} content card(s). Please reassign or delete the cards first.`,
            });
        }

        const category = await ContentCardCategory.findByIdAndDelete(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Content card category not found',
            });
        }

        return res.json({
            success: true,
            message: 'Content card category deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting content card category:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete content card category',
            error: error.message,
        });
    }
};

/**
 * Clone content card category
 */
export const cloneContentCardCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Find the original category
        const originalCategory = await ContentCardCategory.findById(id).lean();

        if (!originalCategory) {
            return res.status(404).json({
                success: false,
                message: 'Content card category not found',
            });
        }

        // Create a copy with modified fields
        const clonedCategoryData: any = {
            ...originalCategory,
            name: `${originalCategory.name} (Copy)`,
            slug: `${originalCategory.slug}-copy-${Date.now()}`,
            isActive: false, // Set to inactive by default
            cardCount: 0, // Reset card count
        };

        // Remove fields that shouldn't be copied
        delete clonedCategoryData._id;
        delete clonedCategoryData.createdAt;
        delete clonedCategoryData.updatedAt;
        delete clonedCategoryData.__v;

        // Create the new category
        const clonedCategory = new ContentCardCategory(clonedCategoryData);
        await clonedCategory.save();

        return res.status(201).json({
            success: true,
            data: clonedCategory,
            message: 'Content card category cloned successfully',
        });
    } catch (error: any) {
        console.error('Error cloning content card category:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clone content card category',
            error: error.message,
        });
    }
};
