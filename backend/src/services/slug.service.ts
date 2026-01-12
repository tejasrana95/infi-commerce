import mongoose from 'mongoose';
import SlugRegistry from '../models/SlugRegistry';

/**
 * Service to handle global slug uniqueness
 */
class SlugService {
    /**
     * Check if a slug is available for a specific entity
     * @param storeId Store ID
     * @param slug Slug to check
     * @param entityType Type of entity requesting the slug
     * @param entityId ID of entity requesting the slug (to allow self-match)
     */
    async isSlugAvailable(
        storeId: mongoose.Types.ObjectId | string,
        slug: string,
        entityType: 'product' | 'category' | 'page',
        entityId?: mongoose.Types.ObjectId | string
    ): Promise<boolean> {
        const query: any = {
            storeId,
            slug,
        };

        const existing = await SlugRegistry.findOne(query);

        if (!existing) {
            return true;
        }

        // If entityId is provided, check if it's the same entity
        if (entityId && existing.entityId.toString() === entityId.toString() && existing.entityType === entityType) {
            return true;
        }

        return false;
    }

    /**
     * Register or update a slug for an entity
     * @param storeId Store ID
     * @param slug New slug
     * @param entityType Entity type
     * @param entityId Entity ID
     */
    async registerSlug(
        storeId: mongoose.Types.ObjectId | string,
        slug: string,
        entityType: 'product' | 'category' | 'page',
        entityId: mongoose.Types.ObjectId | string
    ): Promise<void> {
        // Check if slug is available
        const isAvailable = await this.isSlugAvailable(storeId, slug, entityType, entityId);

        if (!isAvailable) {
            throw new Error(`Slug "${slug}" is already in use by another entity.`);
        }

        // Check if this entity already has a registered slug (ignore storeId to handle moves)
        const existingEntry = await SlugRegistry.findOne({
            entityType,
            entityId
        });

        if (existingEntry) {
            // Update if slug OR storeId changed
            if (existingEntry.slug !== slug || existingEntry.storeId.toString() !== storeId.toString()) {
                existingEntry.slug = slug;
                existingEntry.storeId = storeId as any;
                await existingEntry.save();
            }
        } else {
            // Create new entry
            await SlugRegistry.create({
                storeId,
                slug,
                entityType,
                entityId
            });
        }
    }

    /**
     * Remove a slug registry entry
     * @param storeId Store ID
     * @param entityType Entity type
     * @param entityId Entity ID
     */
    async unregisterSlug(
        storeId: mongoose.Types.ObjectId | string,
        entityType: 'product' | 'category' | 'page',
        entityId: mongoose.Types.ObjectId | string
    ): Promise<void> {
        await SlugRegistry.findOneAndDelete({
            storeId,
            entityType,
            entityId
        });
    }

    /**
     * Resolve a slug to an entity
     * @param storeId Store ID
     * @param slug Slug to resolve
     */
    async resolveSlug(storeId: string, slug: string) {
        return SlugRegistry.findOne({ storeId, slug });
    }
}

export default new SlugService();
