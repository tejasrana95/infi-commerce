/* eslint-disable no-console */
const assert = require('assert');
const path = require('path');
const express = require('express');
const request = require('supertest');

const contracts = require('../docs/public-contracts/contracts.json');

const STORE_ID = '507f1f77bcf86cd799439011';
const CATEGORY_ID = '507f1f77bcf86cd799439031';
const BRAND_ID = '507f1f77bcf86cd799439041';
const LAYOUT_ID = '507f1f77bcf86cd799439051';
const PRODUCT_ID = '507f1f77bcf86cd799439061';

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function makeQuery(result) {
    const value = result;
    const q = {
        select: () => q,
        populate: () => q,
        sort: () => q,
        skip: () => q,
        limit: () => q,
        maxTimeMS: () => q,
        lean: async () => deepClone(value),
        then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
        catch: (reject) => Promise.resolve(value).catch(reject),
        finally: (cb) => Promise.resolve(value).finally(cb),
    };
    return q;
}

function hasKeyDeep(value, key) {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some((v) => hasKeyDeep(v, key));
    if (Object.prototype.hasOwnProperty.call(value, key)) return true;
    return Object.values(value).some((v) => hasKeyDeep(v, key));
}

function resolvePath(values, segment) {
    const next = [];
    const isArraySeg = segment.endsWith('[]');
    const key = isArraySeg ? segment.slice(0, -2) : segment;

    values.forEach((value) => {
        if (value == null) return;

        if (Array.isArray(value)) {
            value.forEach((entry) => {
                if (entry == null || typeof entry !== 'object') return;
                const child = entry[key];
                if (child === undefined) return;
                if (isArraySeg) {
                    if (Array.isArray(child)) next.push(...child);
                } else {
                    next.push(child);
                }
            });
            return;
        }

        if (typeof value === 'object') {
            const child = value[key];
            if (child === undefined) return;
            if (isArraySeg) {
                if (Array.isArray(child)) next.push(...child);
            } else {
                next.push(child);
            }
        }
    });

    return next;
}

function getAtPath(root, pathExpr) {
    if (!pathExpr || pathExpr === 'root') return [root];
    const segments = pathExpr.split('.');
    let values = [root];
    segments.forEach((segment) => {
        values = resolvePath(values, segment);
    });
    return values;
}

function pathExists(root, pathExpr) {
    const values = getAtPath(root, pathExpr);
    return values.length > 0;
}

function assertAllowedKeys(obj, allowed, label) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    Object.keys(obj).forEach((key) => {
        assert(
            allowed.includes(key),
            `${label}: unexpected key '${key}'`
        );
    });
}

function applyModelMocks() {
    const redisService = require('../dist/services/redis.service').default;
    redisService.get = async () => null;
    redisService.set = async () => true;
    redisService.delete = async () => true;

    const Store = require('../dist/models/Store').default;
    const Category = require('../dist/models/Category').default;
    const Brand = require('../dist/models/Brand').default;
    const Page = require('../dist/models/Page').default;
    const Layout = require('../dist/models/Layout').default;
    const Product = require('../dist/models/Product').default;
    const Sale = require('../dist/models/Sale').default;
    const ShippingRule = require('../dist/models/ShippingRule').default;
    const Attribute = require('../dist/models/Attribute').default;

    const storeFixture = {
        _id: STORE_ID,
        name: 'Test Store',
        slug: 'test-store',
        domains: ['test-store.example.com'],
        description: 'Store description',
        logo: 'https://cdn/logo.png',
        favicon: 'https://cdn/favicon.ico',
        currency: 'USD',
        timezone: 'UTC',
        isActive: true,
        seo: { metaTitle: 'Test Store' },
        theme: { templateId: 'modern-clean' },
        pwaSettings: { enabled: true },
        cookieConsentSettings: { enabled: true },
        settings: {
            maintenanceMode: false,
            allowGuestCheckout: true,
            allowCustomerLogin: true,
            allowCustomerSignup: true,
            requireEmailVerification: false,
            shippingEnabled: true,
            reviewSettings: { enabled: true },
            returnSettings: { enabled: true, refundMethods: ['original'] },
            priceVisibility: { showPrice: true, hideForUnauthenticated: false },
            socialLogin: {
                google: { enabled: false, clientId: 'g-client', clientSecret: 'secret' },
                facebook: { enabled: false, clientId: 'f-client', clientSecret: 'secret' },
            },
            googleAnalytics: { enabled: false, measurementId: 'G-TEST' },
            aiSettings: { enabled: true, model: 'gpt-5-mini', openaiKey: 'sk-secret' },
            contact: { email: 'hello@test.com' },
        },
        menus: { leaked: true },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const categoryFixture = {
        _id: CATEGORY_ID,
        title: 'Main Category',
        slug: 'main-category',
        description: 'Category description',
        image: 'https://cdn/cat.png',
        parentCategory: null,
        seo: { metaTitle: 'Category' },
        status: 'active',
        channels: ['WEB'],
        sortOrder: 10,
        level: 1,
        path: 'main-category',
        isVisible: true,
        storeId: { _id: STORE_ID, name: 'Test Store', slug: 'test-store' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const brandFixture = {
        _id: BRAND_ID,
        name: 'Brand A',
        slug: 'brand-a',
        logo: 'https://cdn/brand.png',
        description: 'Brand desc',
        website: 'https://brand.example.com',
        isActive: true,
        seo: { metaTitle: 'Brand seo' },
        channels: ['WEB'],
        storeId: { _id: STORE_ID, name: 'Test Store', slug: 'test-store' },
    };

    const pageFixture = {
        _id: '507f1f77bcf86cd799439071',
        storeId: STORE_ID,
        title: 'About',
        slug: 'about',
        useLayout: false,
        layoutId: LAYOUT_ID,
        content: '<p>About</p>',
        featuredImage: 'https://cdn/about.png',
        seo: { metaTitle: 'About' },
        showInFooter: true,
        footerGroup: 'Company',
        showInHeader: false,
        template: 'default',
        sortOrder: 1,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const layoutFixture = {
        _id: LAYOUT_ID,
        storeId: STORE_ID,
        themeId: '507f1f77bcf86cd799439081',
        name: 'Product Layout',
        description: 'Layout desc',
        type: 'product',
        slug: 'test-product',
        sections: [],
        settings: {
            backgroundColor: '#fff',
            customCSS: '.x{}',
            bodyClass: 'page',
            customJS: 'alert(1)',
        },
        seo: { metaTitle: 'Layout' },
        isDefault: true,
        isTemplate: false,
        templateCategory: 'starter',
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const productFixture = {
        _id: PRODUCT_ID,
        storeId: STORE_ID,
        name: 'Test Product',
        slug: 'test-product',
        type: 'simple',
        sku: 'SKU-123',
        price: 100,
        salePrice: 90,
        compareAtPrice: 120,
        stock: 5,
        stockStatus: 'in-stock',
        lowStockThreshold: 2,
        images: ['https://cdn/p1.png'],
        featuredImage: 'https://cdn/p1.png',
        categoryIds: [{ _id: CATEGORY_ID, title: 'Main Category', slug: 'main-category', path: 'main-category' }],
        tags: ['tag'],
        brand: { _id: BRAND_ID, name: 'Brand A', slug: 'brand-a', logo: 'https://cdn/brand.png' },
        seo: { metaTitle: 'Product SEO' },
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        averageRating: 4.5,
        reviewCount: 2,
        rating: 4.5,
        pricing: { finalPrice: 90 },
        description: '<p>Long description</p>',
        shortDescription: 'Short',
        taxClassId: { name: 'GST', rate: 18, isSplit: false },
        weight: 1,
        downloadable: false,
        downloadLimit: 0,
        downloadExpiry: 0,
        productOptions: [],
        attributes: [],
        specifications: [],
        videos: [],
        categoryBreadcrumbs: [],
        variants: [
            {
                _id: '507f1f77bcf86cd799439091',
                sku: 'SKU-V1',
                attributes: [],
                price: 100,
                salePrice: 95,
                stock: 3,
                images: ['https://cdn/v1.png'],
                weight: 1,
                pricing: { finalPrice: 95 },
                costPrice: 50,
            }
        ],
        costPrice: 60,
        returnSettings: { isReturnable: true },
        manageStock: true,
        dimensions: { length: 1, width: 1, height: 1 },
        geoLimit: { countries: ['US'] },
        views: 99,
        salesCount: 12,
        barcodeGenerated: true,
        downloadFiles: [{ name: 'secret.pdf' }],
        googleMerchant: { synced: true },
        hsnCode: 'HSN-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        canShipTo: () => true,
        toObject() {
            return { ...this };
        },
    };

    const shippingRuleFixture = {
        _id: '507f1f77bcf86cd7994390a1',
        name: 'Express Shipping',
        description: 'Fast shipping',
        rateType: 'flat',
        rate: 20,
        minCharge: 0,
        priority: 10,
        isActive: true,
        geoGroupId: null,
        geoGroupIds: [],
        categoryIds: [],
    };

    Store.findOne = (query) => {
        if (query && query.domains) return makeQuery(storeFixture);
        if (query && query.slug) return makeQuery(storeFixture);
        return makeQuery(storeFixture);
    };
    Store.findById = () => makeQuery(storeFixture);

    Category.find = (query) => {
        if (query && query.slug && query.slug.$in) {
            return makeQuery([{ title: 'Main Category', slug: 'main-category', level: 1 }]);
        }
        return makeQuery([categoryFixture]);
    };
    Category.findById = () => makeQuery(categoryFixture);
    Category.findOne = () => makeQuery(categoryFixture);
    Category.countDocuments = async () => 1;

    Brand.find = () => makeQuery([brandFixture]);
    Brand.findById = () => makeQuery(brandFixture);
    Brand.countDocuments = async () => 1;

    Page.find = () => makeQuery([pageFixture]);
    Page.findOne = () => makeQuery(pageFixture);
    Page.countDocuments = async () => 1;

    Layout.find = () => makeQuery([layoutFixture]);
    Layout.findById = () => makeQuery(layoutFixture);
    Layout.findOne = () => makeQuery(layoutFixture);
    Layout.countDocuments = async () => 1;

    Product.find = () => makeQuery([productFixture]);
    Product.findById = () => makeQuery(productFixture);
    Product.findOne = () => makeQuery(productFixture);
    Product.findByIdAndUpdate = async () => null;
    Product.countDocuments = async () => 1;

    Sale.getActiveSalesForProduct = async () => [];
    ShippingRule.find = () => makeQuery([shippingRuleFixture]);
    Attribute.find = () => makeQuery([]);
}

function createTestApp() {
    const app = express();
    app.use(express.json());

    const storeRoutes = require('../dist/routes/store.routes').default;
    const categoryRoutes = require('../dist/routes/category.routes').default;
    const brandRoutes = require('../dist/routes/brand.routes').default;
    const pageRoutes = require('../dist/routes/page.routes').default;
    const layoutRoutes = require('../dist/routes/layout.routes').default;
    const productRoutes = require('../dist/routes/product.routes').default;
    const shippingRoutes = require('../dist/routes/shipping.routes').default;

    app.use('/api/stores', storeRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/brands', brandRoutes);
    app.use('/api/pages', pageRoutes);
    app.use('/api/layouts', layoutRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/shipping', shippingRoutes);

    app.use((err, _req, res, _next) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || 'Internal Server Error' });
    });

    return app;
}

async function callEndpoint(agent, endpoint) {
    const headers = {
        'x-store-id': STORE_ID,
        'x-channel': 'WEB',
    };

    const method = endpoint.method.toLowerCase();
    if (method === 'get') {
        return agent.get(endpoint.path).set(headers);
    }
    if (method === 'post') {
        return agent.post(endpoint.path).set(headers).send(endpoint.body || {});
    }
    throw new Error(`Unsupported method ${endpoint.method}`);
}

function assertForbidden(responseBody, forbiddenPaths, endpointName) {
    forbiddenPaths.forEach((pathExpr) => {
        if (pathExpr.includes('.')) {
            assert(!pathExists(responseBody, pathExpr), `${endpointName}: forbidden path present '${pathExpr}'`);
        } else {
            assert(!hasKeyDeep(responseBody, pathExpr), `${endpointName}: forbidden key present '${pathExpr}'`);
        }
    });
}

function assertObjectRules(responseBody, rules, endpointName) {
    (rules || []).forEach((rule) => {
        const nodes = getAtPath(responseBody, rule.path);
        nodes.forEach((node, idx) => {
            if (node == null) return;
            if (Array.isArray(node)) {
                node.forEach((item, arrIdx) => {
                    assertAllowedKeys(item, rule.allowed, `${endpointName} [${rule.path}] item#${idx}.${arrIdx}`);
                });
                return;
            }
            assertAllowedKeys(node, rule.allowed, `${endpointName} [${rule.path}] item#${idx}`);
        });
    });
}

(async () => {
    applyModelMocks();
    const app = createTestApp();
    const agent = request(app);

    for (const endpoint of contracts.endpoints) {
        const res = await callEndpoint(agent, endpoint);
        assert.strictEqual(
            res.status,
            endpoint.status,
            `${endpoint.name}: expected status ${endpoint.status}, got ${res.status} body=${JSON.stringify(res.body)}`
        );

        assertAllowedKeys(res.body, endpoint.allowedTopLevel, `${endpoint.name} [root]`);
        assertObjectRules(res.body, endpoint.objectRules, endpoint.name);
        assertForbidden(res.body, endpoint.forbidden || [], endpoint.name);
    }

    console.log(`Public contract tests passed for ${contracts.endpoints.length} endpoints.`);
})();
