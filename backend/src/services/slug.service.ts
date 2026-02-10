import mongoose from 'mongoose';
import SlugRegistry from '../models/SlugRegistry';
import Redirection from '../models/Redirection';
import { isReservedSlug, generateAlternativeSlug } from '../constants/reservedSlugs';

/**
 * Result of slug availability check
 */
export interface SlugAvailabilityResult {
    isAvailable: boolean;
    isReserved: boolean;
    suggestedSlug?: string;
    message?: string;
}

/**
 * Service to handle global slug uniqueness and redirection
 */
class SlugService {
    /**
     * Check if a slug is available for a specific entity (simple boolean check)
     * @param storeId Store ID
     * @param slug Slug to check
     * @param entityType Type of entity requesting the slug
     * @param entityId ID of entity requesting the slug (to allow self-match)
     */
    async isSlugAvailable(
        storeId: mongoose.Types.ObjectId | string,
        slug: string,
        entityType: 'product' | 'category' | 'page' | 'brand',
        entityId?: mongoose.Types.ObjectId | string
    ): Promise<boolean> {
        // Check if reserved slug
        if (isReservedSlug(slug)) {
            return false;
        }

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
     * Check slug availability with detailed result
     * @param storeId Store ID
     * @param slug Slug to check
     * @param entityType Type of entity requesting the slug
     * @param entityId ID of entity requesting the slug (to allow self-match)
     */
    async checkSlugAvailability(
        storeId: mongoose.Types.ObjectId | string,
        slug: string,
        entityType: 'product' | 'category' | 'page' | 'brand',
        entityId?: mongoose.Types.ObjectId | string
    ): Promise<SlugAvailabilityResult> {
        const normalizedSlug = slug.toLowerCase().trim();

        // Check if reserved slug
        if (isReservedSlug(normalizedSlug)) {
            return {
                isAvailable: false,
                isReserved: true,
                suggestedSlug: generateAlternativeSlug(normalizedSlug),
                message: 'This is a reserved URL and cannot be used'
            };
        }

        const query: any = {
            storeId,
            slug: normalizedSlug,
        };

        const existing = await SlugRegistry.findOne(query);

        if (!existing) {
            return {
                isAvailable: true,
                isReserved: false
            };
        }

        // If entityId is provided, check if it's the same entity
        if (entityId && existing.entityId.toString() === entityId.toString() && existing.entityType === entityType) {
            return {
                isAvailable: true,
                isReserved: false
            };
        }

        return {
            isAvailable: false,
            isReserved: false,
            suggestedSlug: generateAlternativeSlug(normalizedSlug),
            message: 'Slug is already taken by another entity'
        };
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
        entityType: 'product' | 'category' | 'page' | 'brand',
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
        entityType: 'product' | 'category' | 'page' | 'brand',
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
     * First checks for active redirections, then falls back to slug registry
     * @param storeId Store ID
     * @param slug Slug to resolve
     */
    async resolveSlug(storeId: string, slug: string) {
        // Normalize for redirections: ensure it starts with / and remove trailing slash
        let redirectionSlug = slug.startsWith('/') ? slug : `/${slug}`;
        redirectionSlug = redirectionSlug.endsWith('/') && redirectionSlug.length > 1
            ? redirectionSlug.slice(0, -1)
            : redirectionSlug;

        // First priority: Check for active redirections
        const redirection = await Redirection.findOne({
            storeId: new mongoose.Types.ObjectId(storeId),
            origin_url: redirectionSlug.toLowerCase(),
            status: 'active'
        });

        if (redirection) {
            return {
                type: 'redirect' as const,
                destination_url: redirection.destination_url
            };
        }

        // Normalize for slug registry: remove leading slash if present, remove trailing slash
        let registrySlug = slug.startsWith('/') ? slug.substring(1) : slug;
        registrySlug = registrySlug.endsWith('/') && registrySlug.length > 0
            ? registrySlug.slice(0, -1)
            : registrySlug;

        // Second priority: Check slug registry for products/categories/pages
        const registryEntry = await SlugRegistry.findOne({ storeId, slug: registrySlug.toLowerCase() });

        if (registryEntry) {
            return {
                type: 'registry' as const,
                entityType: registryEntry.entityType,
                entityId: registryEntry.entityId,
                slug: registryEntry.slug
            };
        }

        return null;
    }
}

export default new SlugService();
