/**
 * Seed Generator Script
 * Exports all collections from MongoDB to a seed file
 * Excludes: Order, Customer, NotificationQueue, FormSubmission
 * 
 * Usage: npx ts-node src/scripts/generate-seed.ts
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
import File from '../models/File';
import NewsletterSubscriber from '../models/NewsletterSubscriber';

interface CollectionConfig {
    name: string;
    model: mongoose.Model<any>;
    transform?: (doc: any) => any;
}

// Collections to export (excluding Order, Customer, Cart, NotificationQueue, FormSubmission)
const collections: CollectionConfig[] = [
    { name: 'stores', model: Store },
    {
        name: 'users', model: User, transform: (doc) => {
            // Exclude sensitive data, keep structure for reference
            const obj = doc.toObject();
            delete obj.password;
            delete obj.twoFactorSecret;
            delete obj.twoFactorBackupCodes;
            return obj;
        }
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
    { name: 'currencies', model: Currency },
    { name: 'geos', model: Geo },
    { name: 'geoGroups', model: GeoGroup },
    { name: 'blogCategories', model: BlogCategory },
    { name: 'blogPosts', model: BlogPost },
    { name: 'testimonials', model: Testimonial },
    { name: 'reviews', model: Review },
    { name: 'sales', model: Sale },
    {
        name: 'apiKeys', model: ApiKey, transform: (doc) => {
            // Exclude sensitive API key hash
            const obj = doc.toObject();
            delete obj.keyHash;
            return obj;
        }
    },
    { name: 'notificationTemplates', model: NotificationTemplate },
    {
        name: 'paymentGatewayConfigs', model: PaymentGatewayConfig, transform: (doc) => {
            // Exclude sensitive credentials
            const obj = doc.toObject();
            if (obj.credentials) {
                // Mask sensitive fields but keep structure
                Object.keys(obj.credentials).forEach(key => {
                    if (typeof obj.credentials[key] === 'string' && obj.credentials[key].length > 4) {
                        obj.credentials[key] = '***MASKED***';
                    }
                });
            }
            return obj;
        }
    },
    { name: 'files', model: File },
    { name: 'newsletterSubscribers', model: NewsletterSubscriber },
];

async function generateSeed() {
    console.log('🌱 Starting seed generation...\n');

    try {
        // Connect to database
        await mongoose.connect(config.database.mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const seedData: Record<string, any[]> = {};
        const stats: { name: string; count: number }[] = [];

        // Export each collection
        for (const collection of collections) {
            try {
                const documents = await collection.model.find({}).lean();

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
        const outputDir = path.join(__dirname, '../seeds');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const outputFile = path.join(outputDir, `seed-${timestamp}.json`);

        // Write seed data
        fs.writeFileSync(outputFile, JSON.stringify(seedData, null, 2));

        console.log('\n' + '='.repeat(50));
        console.log('📊 SEED GENERATION SUMMARY');
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

        // Also create a TypeScript seed runner
        const seedRunnerPath = path.join(outputDir, 'run-seed.ts');
        const seedRunnerContent = `/**
 * Seed Runner Script
 * Imports seed data into MongoDB
 * 
 * Usage: npx ts-node src/seeds/run-seed.ts
 */

import mongoose from 'mongoose';
import { config } from '../config';
import seedData from './seed-${timestamp}.json';

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
import NotificationTemplate from '../models/NotificationTemplate';
import File from '../models/File';
import NewsletterSubscriber from '../models/NewsletterSubscriber';

const models: Record<string, mongoose.Model<any>> = {
    stores: Store,
    products: Product,
    categories: Category,
    brands: Brand,
    attributes: Attribute,
    productOptions: ProductOption,
    banners: Banner,
    bannerSliders: BannerSlider,
    brandShowcases: BrandShowcase,
    menus: Menu,
    pages: Page,
    layouts: Layout,
    headerLayouts: HeaderLayout,
    footerLayouts: FooterLayout,
    themes: Theme,
    forms: Form,
    coupons: Coupon,
    shippingRules: ShippingRule,
    taxRates: TaxRate,
    currencies: Currency,
    geos: Geo,
    geoGroups: GeoGroup,
    blogCategories: BlogCategory,
    blogPosts: BlogPost,
    testimonials: Testimonial,
    reviews: Review,
    sales: Sale,
    notificationTemplates: NotificationTemplate,
    files: File,
    newsletterSubscribers: NewsletterSubscriber,
};

// Order matters - dependencies first
const importOrder = [
    'stores',
    'currencies',
    'geos',
    'geoGroups',
    'brands',
    'attributes',
    'productOptions',
    'categories',
    'products',
    'banners',
    'bannerSliders',
    'brandShowcases',
    'menus',
    'pages',
    'themes',
    'layouts',
    'headerLayouts',
    'footerLayouts',
    'forms',
    'coupons',
    'shippingRules',
    'taxRates',
    'blogCategories',
    'blogPosts',
    'testimonials',
    'reviews',
    'sales',
    'notificationTemplates',
    'files',
    'newsletterSubscribers',
];

async function runSeed() {
    console.log('🌱 Starting seed import...\\n');

    try {
        await mongoose.connect(config.database.mongoUri);
        console.log('✅ Connected to MongoDB\\n');

        for (const collectionName of importOrder) {
            const model = models[collectionName];
            const data = (seedData as any)[collectionName] || [];
            
            if (!model || data.length === 0) {
                console.log(\`  ⏭️  \${collectionName}: Skipped (no data)\`);
                continue;
            }

            try {
                // Clear existing data (optional - comment out to preserve)
                // await model.deleteMany({});
                
                // Insert seed data
                await model.insertMany(data, { ordered: false });
                console.log(\`  ✅ \${collectionName}: \${data.length} documents imported\`);
            } catch (error: any) {
                if (error.code === 11000) {
                    console.log(\`  ⚠️  \${collectionName}: Some duplicates skipped\`);
                } else {
                    console.log(\`  ❌ \${collectionName}: \${error.message}\`);
                }
            }
        }

        console.log('\\n✅ Seed import completed!');
    } catch (error) {
        console.error('❌ Seed import failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runSeed();
`;

        fs.writeFileSync(seedRunnerPath, seedRunnerContent);
        console.log(`✅ Seed runner generated: ${seedRunnerPath}`);

    } catch (error) {
        console.error('❌ Seed generation failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

generateSeed();
