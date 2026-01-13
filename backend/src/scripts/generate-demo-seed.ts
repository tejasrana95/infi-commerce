/**
 * Demo Seed Generator Script
 * Exports filtered collections from MongoDB to a seed file for Demo Mode
 * 
 * Filters:
 * - Admin User: Only 'admin@demo.com'
 * - Store: Only store with ID '693aab5688efc150c73aa23b', renamed to 'Demo Store'
 * - Content: Excludes Orders, Customers, Carts, Wishlists
 * 
 * Usage: npx ts-node src/scripts/generate-demo-seed.ts
 */

import mongoose from 'mongoose';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

// Import all models
import Store from '../models/Store';
import Product from '../models/Product';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Attribute from '../models/Attribute';
import ProductOption from '../models/ProductOption';
import Banner from '../models/Banner';
import BannerSlider from '../models/BannerSlider';
import BrandShowcase from '../models/BrandShowcase';
import Menu from '../models/Menu';
import Page from '../models/Page';
import Layout from '../models/Layout';
import HeaderLayout from '../models/HeaderLayout';
import FooterLayout from '../models/FooterLayout';
import Theme from '../models/Theme';
import Form from '../models/Form';
import Coupon from '../models/Coupon';
import ShippingRule from '../models/ShippingRule';
import TaxRate from '../models/TaxRate';
import Currency from '../models/Currency';
import Geo from '../models/Geo';
import GeoGroup from '../models/GeoGroup';
import BlogCategory from '../models/BlogCategory';
import BlogPost from '../models/BlogPost';
import Testimonial from '../models/Testimonial';
import Review from '../models/Review';
import Sale from '../models/Sale';
import User from '../models/User';
import ApiKey from '../models/ApiKey';
import NotificationTemplate from '../models/NotificationTemplate';
import PaymentGatewayConfig from '../models/PaymentGatewayConfig';
import NewsletterSubscriber from '../models/NewsletterSubscriber';

interface CollectionConfig {
    name: string;
    model: mongoose.Model<any>;
    transform?: (doc: any) => any;
    filter?: (doc: any) => boolean;
}

const TARGET_STORE_ID = '693aab5688efc150c73aa23b';
const TARGET_ADMIN_EMAIL = 'admin@demo.com';

// Collections to export
const collections: CollectionConfig[] = [
    {
        name: 'stores',
        model: Store,
        transform: (doc) => {
            const obj = { ...doc };
            // Rename to Demo Store if it matches our target
            if (obj._id.toString() === TARGET_STORE_ID) {
                obj.name = 'Demo Store';
                // We keep the ID to preserve relationships
            }
            return obj;
        },
        filter: (doc) => doc._id.toString() === TARGET_STORE_ID
    },
    {
        name: 'users',
        model: User,
        transform: (doc) => {
            const obj = { ...doc };
            delete obj.twoFactorSecret;
            delete obj.twoFactorBackupCodes;
            return obj;
        },
        filter: (doc) => doc.email === TARGET_ADMIN_EMAIL
    },
    { name: 'products', model: Product },
    { name: 'categories', model: Category },
    { name: 'brands', model: Brand },
    { name: 'attributes', model: Attribute },
    { name: 'productOptions', model: ProductOption },
    { name: 'banners', model: Banner },
    { name: 'bannerSliders', model: BannerSlider },
    { name: 'brandShowcases', model: BrandShowcase },
    { name: 'menus', model: Menu },
    { name: 'pages', model: Page },
    { name: 'layouts', model: Layout },
    { name: 'headerLayouts', model: HeaderLayout },
    { name: 'footerLayouts', model: FooterLayout },
    { name: 'themes', model: Theme },
    { name: 'forms', model: Form },
    { name: 'coupons', model: Coupon },
    { name: 'shippingRules', model: ShippingRule },
    { name: 'taxRates', model: TaxRate },
    { name: 'currencies', model: Currency }, // Likely global
    { name: 'geos', model: Geo }, // Likely global
    { name: 'geoGroups', model: GeoGroup }, // Likely global
    { name: 'blogCategories', model: BlogCategory },
    { name: 'blogPosts', model: BlogPost },
    { name: 'testimonials', model: Testimonial },
    { name: 'reviews', model: Review },
    { name: 'sales', model: Sale },
    {
        name: 'apiKeys',
        model: ApiKey,
        transform: (doc) => {
            const obj = { ...doc };
            delete obj.keyHash;
            return obj;
        },
    },
    { name: 'notificationTemplates', model: NotificationTemplate },
    {
        name: 'paymentGatewayConfigs',
        model: PaymentGatewayConfig,
        transform: (doc) => {
            const obj = { ...doc };
            if (obj.credentials) {
                Object.keys(obj.credentials).forEach(key => {
                    if (typeof obj.credentials[key] === 'string' && obj.credentials[key].length > 4) {
                        obj.credentials[key] = '***MASKED***';
                    }
                });
            }
            return obj;
        },
    },
    { name: 'newsletterSubscribers', model: NewsletterSubscriber },
];

async function generateDemoSeed() {
    console.log('🌱 Starting DEMO seed generation...\n');

    try {
        // Connect to database
        await mongoose.connect(config.database.mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const seedData: Record<string, any[]> = {};
        const stats: { name: string; count: number }[] = [];

        // Export each collection
        for (const collection of collections) {
            try {
                let documents = await collection.model.find({}).lean();

                // Apply custom filter if provided
                if (collection.filter) {
                    documents = documents.filter(collection.filter);
                } else {
                    // Default filtering logic for store-specific content
                    documents = documents.filter(doc => {
                        // Check for storeId or store field
                        if ('storeId' in doc) {
                            return doc.storeId.toString() === TARGET_STORE_ID;
                        }
                        if ('store' in doc && doc.store) { // handle nullable store ref
                            return doc.store.toString() === TARGET_STORE_ID;
                        }
                        return true; // Keep items without store association (Global)
                    });
                }

                // Apply transform if provided
                const processedDocs = collection.transform
                    ? documents.map(doc => collection.transform!(doc))
                    : documents;

                seedData[collection.name] = processedDocs;
                stats.push({ name: collection.name, count: processedDocs.length });

                console.log(`  📦 ${collection.name}: ${processedDocs.length} documents`);
            } catch (error: any) {
                console.log(`  ⚠️  ${collection.name}: Error - ${error.message}`);
                seedData[collection.name] = [];
                stats.push({ name: collection.name, count: 0 });
            }
        }

        // Generate seed file

        // Ensure default admin exists
        if (!seedData['users'] || seedData['users'].length === 0) {
            console.log('  ⚠️  Target user not found in DB, injecting default admin.');
            seedData['users'] = [{
                _id: '693aa000000000000000001',
                email: 'admin@demo.com',
                password: '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQCahFqx0G7LbBQ6C8wRxh7E5VWvFi', // Hash for Admin@123
                firstName: 'Super',
                lastName: 'Admin',
                phone: '',
                role: 'super_admin',
                isActive: true,
                emailVerified: true,
                twoFactorEnabled: false,
                permissions: [],
                storeIds: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                __v: 0
            }];
            const userStat = stats.find(s => s.name === 'users');
            if (userStat) userStat.count = 1;
        }

        // ---------------------------------------------------------
        // INJECT RANDOM PRODUCTS
        // ---------------------------------------------------------
        if (seedData['categories'] && seedData['categories'].length > 0) {
            console.log('  ✨ Generating random products...');
            const categoryIds = seedData['categories'].map((c: any) => c._id);
            const productCount = 20;

            const adjectives = ['Amazing', 'Incredible', 'Fantastic', 'Modern', 'Classic', 'Elegant', 'Practical', 'Luxury', 'Robust', 'Sleek'];
            const nouns = ['Widget', 'Gadget', 'Tool', 'Device', 'Accessory', 'Item', 'Solution', 'System', 'Contraption', 'Invention'];

            // Ensure product array exists
            if (!seedData['products']) seedData['products'] = [];

            for (let i = 0; i < productCount; i++) {
                const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
                const noun = nouns[Math.floor(Math.random() * nouns.length)];
                const name = `${adj} ${noun} ${Math.floor(Math.random() * 1000)}`;
                const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 10000);
                const randomCategory = categoryIds[Math.floor(Math.random() * categoryIds.length)];

                const newProduct = {
                    _id: new mongoose.Types.ObjectId(),
                    storeId: TARGET_STORE_ID,
                    name: name,
                    slug: slug,
                    description: `<p>This is a randomly generated description for the <strong>${name}</strong>. It features high quality materials and a stunning design.</p>`,
                    shortDescription: `A great ${name} for your daily needs.`,
                    type: 'simple',
                    sku: `SKU-${Date.now()}-${i}`,
                    price: Math.floor(Math.random() * 500) + 10,
                    stock: Math.floor(Math.random() * 100),
                    manageStock: true,
                    stockStatus: 'in_stock',
                    lowStockThreshold: 5,
                    dimensions: {
                        unit: "cm",
                    },
                    geoLimit: {
                        enabled: false,
                        countries: [],
                        states: [],
                        cities: []
                    },
                    downloadable: false,
                    images: [
                        'https://images.unsplash.com/photo-1595909307779-11ba18815124?w=800&q=80',
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'
                    ],
                    categoryIds: [randomCategory],
                    tags: ['demo', 'random'], // Good for identifying them later
                    seo: {
                        metaTitle: "",
                        metaDescription: "",
                        metaKeywords: [],
                        focusKeyword: "",
                        ogTitle: "",
                        ogDescription: ""
                    },
                    isActive: true,
                    isFeatured: Math.random() > 0.8, // 20% chance
                    isOnSale: Math.random() > 0.9,
                    views: Math.floor(Math.random() * 100),
                    salesCount: 0,
                    reviewCount: 0,
                    downloadFiles: [],
                    productOptions: [],
                    attributes: [],
                    specifications: [],
                    variants: [],
                    videos: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    __v: 0
                };

                seedData['products'].push(newProduct);
            }

            const productStat = stats.find(s => s.name === 'products');
            if (productStat) {
                productStat.count += productCount;
            } else {
                stats.push({ name: 'products', count: productCount });
            }
            console.log(`  ✨ Added ${productCount} random products.`);
        }

        const outputDir = path.join(__dirname, '../seeds');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const outputFile = path.join(outputDir, `seed-demo-${timestamp}.json`);

        // Write seed data
        fs.writeFileSync(outputFile, JSON.stringify(seedData, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log('📊 DEMO SEED GENERATION SUMMARY');
        console.log('='.repeat(50));

        let totalDocs = 0;
        stats.forEach(stat => {
            totalDocs += stat.count;
            const padding = 25 - stat.name.length;
            console.log(`  ${stat.name}${' '.repeat(padding)}: ${stat.count}`);
        });

        console.log('='.repeat(50));
        console.log(`  TOTAL DOCUMENTS: ${totalDocs}`);
        console.log('='.repeat(50));
        console.log(`\n✅ Seed file generated: ${outputFile}`);

        // Helper text for user
        console.log('\nTo use this seed file, update your seed runner or use the provided run-seed script pointed to this file.');

    } catch (error) {
        console.error('❌ Seed generation failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

generateDemoSeed();
