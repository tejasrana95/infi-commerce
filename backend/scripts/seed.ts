
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Category from '../src/models/Category';
import Product from '../src/models/Product';
import Store from '../src/models/Store';
import { connectDatabase } from '../src/config/database';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const SAMPLE_IMAGES = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80', // Watch
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80', // Shoes
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80', // Camera
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80', // Sneakers
    'https://images.unsplash.com/photo-1595909307779-11ba18815124?w=800&q=80', // Hat
    'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=80', // Shoes again
];

const CATEGORY_STRUCTURE = [
    {
        title: 'Electronics',
        children: ['Smartphones', 'Laptops', 'Audio', 'Wearables']
    },
    {
        title: 'Fashion',
        children: ['Men', 'Women', 'Kids', 'Accessories']
    },
    {
        title: 'Home & Living',
        children: ['Furniture', 'Decor', 'Kitchen', 'Bedding']
    },
    {
        title: 'Sports',
        children: ['Gym', 'Running', 'Outdoor', 'Team Sports']
    },
    {
        title: 'Beauty',
        children: ['Skincare', 'Makeup', 'Haircare', 'Fragrance']
    }
];

const ADJECTIVES = ['Premium', 'Classic', 'Modern', 'Sleek', 'Durable', 'Elegant', 'Urban', 'Pro', 'Elite', 'Essential'];
const NOUNS = ['Gadget', 'Device', 'Outfit', 'Tool', 'Item', 'Piece', 'Design', 'Style', 'Choice', 'Selection'];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateSlug = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);
};

const seed = async () => {
    try {
        await connectDatabase();
        console.log('Connected to database');

        const store = await Store.findOne({ isActive: true });
        if (!store) {
            console.error('No active store found. Please create a store first.');
            process.exit(1);
        }
        console.log(`Seeding data for store: ${store.name} (${store._id})`);

        const createdCategories: any[] = [];

        // 1. Create Categories
        console.log('Creating categories...');
        for (const rootCat of CATEGORY_STRUCTURE) {
            // Create root category
            const root = await Category.create({
                title: rootCat.title,
                slug: generateSlug(rootCat.title),
                storeId: store._id,
                level: 0,
                path: generateSlug(rootCat.title),
                status: 'active',
                isVisible: true
            });
            createdCategories.push(root);

            // Create subcategories
            for (const childTitle of rootCat.children) {
                const childSlug = generateSlug(childTitle);
                await Category.create({
                    title: childTitle,
                    slug: childSlug,
                    storeId: store._id,
                    parentCategory: root._id,
                    level: 1,
                    path: `${root.slug}/${childSlug}`,
                    status: 'active',
                    isVisible: true
                });
                createdCategories.push(root); // Add to pool for product assignment (assigning to root for broader mix too, or just children?)
                // Actually let's fetch the just created child
                const child = await Category.findOne({ slug: childSlug });
                if (child) createdCategories.push(child);
            }
        }
        console.log(`Created ${createdCategories.length} categories (including hierarchy).`);


        // 2. Create Products
        console.log('Creating products...');
        const productsToCreate = 50;

        for (let i = 0; i < productsToCreate; i++) {
            const category = getRandomItem(createdCategories);
            const name = `${getRandomItem(ADJECTIVES)} ${category.title} ${getRandomItem(NOUNS)}`;
            const price = getRandomInt(20, 500);

            await Product.create({
                storeId: store._id,
                name: name,
                slug: generateSlug(name),
                description: `<p>This is a randomly generated description for the <strong>${name}</strong>. It features high quality materials and a stunning design.</p>`,
                shortDescription: `A great ${name} for your daily needs.`,
                type: 'simple',
                sku: `SKU-${Date.now()}-${i}`,
                price: price,
                salePrice: Math.random() > 0.7 ? Math.floor(price * 0.8) : undefined, // 30% chance of sale
                stock: getRandomInt(0, 100),
                stockStatus: 'in_stock',
                manageStock: true,
                images: [getRandomItem(SAMPLE_IMAGES), getRandomItem(SAMPLE_IMAGES)],
                categoryIds: [category._id],
                isActive: true,
                isFeatured: Math.random() > 0.8,
                tags: ['demo', category.title.toLowerCase()]
            });
        }

        console.log(`Successfully created ${productsToCreate} products.`);
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
