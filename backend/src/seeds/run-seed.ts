/**
 * Seed Runner Script
 * Imports seed data into MongoDB
 * 
 * Usage: npx ts-node src/seeds/run-seed.ts
 */

import mongoose from 'mongoose';
import { config } from '../config';
import seedData from './seed-demo-2026-01-13T09-47-17.json';

// Import all models
import User from '../models/User';
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
import NewsletterSubscriber from '../models/NewsletterSubscriber';

const models: Record<string, mongoose.Model<any>> = {
    users: User,
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
    newsletterSubscribers: NewsletterSubscriber,
};

// Order matters - dependencies first
const importOrder = [
    'stores',
    'users',
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
    'newsletterSubscribers',
];

async function runSeed() {
    console.log('🌱 Starting seed import...\n');

    try {
        await mongoose.connect(config.database.mongoUri);
        console.log('✅ Connected to MongoDB\n');

        for (const collectionName of importOrder) {
            const model = models[collectionName];
            const data = (seedData as any)[collectionName] || [];

            if (!model || data.length === 0) {
                console.log(`  ⏭️  ${collectionName}: Skipped (no data)`);
                continue;
            }

            try {
                // Clear existing data (optional - comment out to preserve)
                await model.deleteMany({});

                // Insert seed data
                await model.insertMany(data, { ordered: false });
                console.log(`  ✅ ${collectionName}: ${data.length} documents imported`);
            } catch (error: any) {
                if (error.code === 11000) {
                    console.log(`  ⚠️  ${collectionName}: Some duplicates skipped`);
                } else {
                    console.log(`  ❌ ${collectionName}: ${error.message}`);
                }
            }
        }

        console.log('\n✅ Seed import completed!');
    } catch (error) {
        console.error('❌ Seed import failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runSeed();
