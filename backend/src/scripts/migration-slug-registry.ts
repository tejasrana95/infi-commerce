import mongoose from 'mongoose';
import '../config/database'; // Import database connection
import Product from '../models/Product';
import Category from '../models/Category';
import Page from '../models/Page';
import SlugRegistry from '../models/SlugRegistry';

const migrateSlugs = async () => {
    try {
        console.log('Starting slug migration...');

        // Clear existing registry? No, maybe upsert or skip existing.
        // For safety, let's assume empty registry or partial run.
        // We will use upsert logic.

        // 1. Migrate Pages
        console.log('Migrating Pages...');
        const pages = await Page.find({});
        for (const page of pages) {
            await registerSlug(page.storeId, page.slug, 'page', page._id);
        }

        // 2. Migrate Categories
        console.log('Migrating Categories...');
        const categories = await Category.find({});
        for (const category of categories) {
            await registerSlug(category.storeId, category.slug, 'category', category._id);
        }

        // 3. Migrate Products
        console.log('Migrating Products...');
        const products = await Product.find({});
        for (const product of products) {
            await registerSlug(product.storeId, product.slug, 'product', product._id);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

async function registerSlug(storeId: any, slug: string, entityType: 'page' | 'category' | 'product', entityId: any) {
    if (!slug) return;

    try {
        const exists = await SlugRegistry.findOne({ storeId, slug });
        if (exists) {
            if (exists.entityType === entityType && exists.entityId.toString() === entityId.toString()) {
                // Already registered correctly
                return;
            }
            console.warn(`Conflict: Slug "${slug}" already registered for ${exists.entityType} ${exists.entityId}. Skipping ${entityType} ${entityId}.`);

            // Should we auto-resolve conflict? e.g. append entity type
            // For now just log.
        } else {
            await SlugRegistry.create({
                storeId,
                slug,
                entityType,
                entityId
            });
            // console.log(`Registered ${entityType}: ${slug}`);
        }
    } catch (err: any) {
        if (err.code === 11000) {
            // Duel race condition or duplicate
            console.warn(`Duplicate key error for ${slug}`);
        } else {
            console.error(`Error registering ${slug}:`, err);
        }
    }
}

// Connect and run
// Note: This script assumes it's run via ts-node or similar with env vars loaded
// You might need to load dotenv here if not using a runner that does it.
import dotenv from 'dotenv';
dotenv.config();

// Simple check to ensure DB connection if not handled by import
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/infi-commerce')
        .then(() => migrateSlugs());
} else {
    migrateSlugs();
}
