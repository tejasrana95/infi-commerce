import Product from '../models/Product';
import Store from '../models/Store';

/**
 * Google Merchant Center Service
 * Handles product feed building, validation, and readiness checking.
 * Live API calls to Google Content API can be enabled when real credentials are configured.
 */

interface ProductFeedItem {
    offerId: string;
    title: string;
    description: string;
    link: string;
    imageLink: string;
    additionalImageLinks?: string[];
    availability: 'in_stock' | 'out_of_stock' | 'preorder' | 'backorder';
    price: { value: string; currency: string };
    salePrice?: { value: string; currency: string };
    brand?: string;
    gtin?: string;
    mpn?: string;
    condition: 'new' | 'refurbished' | 'used';
    googleProductCategory?: string;
    productType?: string;
    identifierExists?: boolean;
    ageGroup?: string;
    gender?: string;
    color?: string;
    size?: string;
    material?: string;
    pattern?: string;
    shipping?: { country: string; price: { value: string; currency: string } };
    shippingLabel?: string;
    taxCategory?: string;
    customLabel0?: string;
    customLabel1?: string;
    customLabel2?: string;
    customLabel3?: string;
    customLabel4?: string;
    promotionIds?: string[];
    multipack?: number;
    isBundle?: boolean;
    energyEfficiencyClass?: string;
    channel: 'online';
    contentLanguage: string;
    targetCountry: string;
}

export interface ReadinessIssue {
    severity: 'error' | 'warning' | 'info';
    field: string;
    title: string;
    description: string;
}

export interface ReadinessResult {
    score: number; // 0-100
    issues: ReadinessIssue[];
    ready: boolean;
}

class GoogleMerchantService {

    /**
     * Build a Google Shopping product feed item from a product and store
     */
    buildProductFeed(product: any, store: any): ProductFeedItem {
        const gmcSettings = store.googleMerchantSettings || {};
        const gmc = product.googleMerchant || {};
        const currency = store.currency || 'USD';
        const domain = store.domains?.[0] || 'example.com';
        const productUrl = `https://${domain}/${product.slug}`;
        const imageBase = product.featuredImage || product.images?.[0] || '';
        const imageLink = imageBase.startsWith('http') ? imageBase : `https://${domain}${imageBase}`;

        // Map stock status
        let availability: ProductFeedItem['availability'] = 'in_stock';
        if (product.stockStatus === 'out_of_stock') availability = 'out_of_stock';
        else if (product.stockStatus === 'on_backorder') availability = 'backorder';
        // made_to_order defaults to in_stock

        const feedItem: ProductFeedItem = {
            offerId: product.sku,
            title: product.name.slice(0, 150),
            description: this.stripHtml(product.description).slice(0, 5000),
            link: productUrl,
            imageLink,
            additionalImageLinks: (product.images || [])
                .filter((img: string) => img !== product.featuredImage)
                .slice(0, 10)
                .map((img: string) => img.startsWith('http') ? img : `https://${domain}${img}`),
            availability,
            price: {
                value: product.price.toFixed(2),
                currency,
            },
            condition: gmc.condition || 'new',
            channel: 'online',
            contentLanguage: gmcSettings.contentLanguage || 'en',
            targetCountry: gmcSettings.targetCountries?.[0] || 'US',
        };

        // Sale price
        if (product.isOnSale && product.salePrice) {
            feedItem.salePrice = {
                value: product.salePrice.toFixed(2),
                currency,
            };
        }

        // Brand
        const brandName = gmc.brand || (typeof product.brand === 'object' ? product.brand?.name : undefined);
        if (brandName) feedItem.brand = brandName;

        // Identifiers
        if (gmc.gtin) feedItem.gtin = gmc.gtin;
        if (gmc.mpn) feedItem.mpn = gmc.mpn;
        if (gmc.identifierExists === false) feedItem.identifierExists = false;

        // Google category
        if (gmc.googleProductCategory) feedItem.googleProductCategory = gmc.googleProductCategory;

        // Demographics
        if (gmc.ageGroup) feedItem.ageGroup = gmc.ageGroup;
        if (gmc.gender) feedItem.gender = gmc.gender;

        // Attributes
        if (gmc.color) feedItem.color = gmc.color;
        if (gmc.size) feedItem.size = gmc.size;
        if (gmc.material) feedItem.material = gmc.material;
        if (gmc.pattern) feedItem.pattern = gmc.pattern;

        // Labels
        if (gmc.customLabel0) feedItem.customLabel0 = gmc.customLabel0;
        if (gmc.customLabel1) feedItem.customLabel1 = gmc.customLabel1;
        if (gmc.customLabel2) feedItem.customLabel2 = gmc.customLabel2;
        if (gmc.customLabel3) feedItem.customLabel3 = gmc.customLabel3;
        if (gmc.customLabel4) feedItem.customLabel4 = gmc.customLabel4;

        // Promotions
        if (gmc.promotionIds?.length) feedItem.promotionIds = gmc.promotionIds;

        // Shipping & Tax
        if (gmc.shippingLabel) feedItem.shippingLabel = gmc.shippingLabel;
        if (gmc.taxCategory) feedItem.taxCategory = gmc.taxCategory;

        // Other
        if (gmc.energyEfficiencyClass) feedItem.energyEfficiencyClass = gmc.energyEfficiencyClass;
        if (gmc.multipack) feedItem.multipack = gmc.multipack;
        if (gmc.isBundle !== undefined) feedItem.isBundle = gmc.isBundle;

        return feedItem;
    }

    /**
     * Validate product readiness for Google Merchant Center submission
     */
    validateProductReadiness(product: any, store: any): ReadinessResult {
        const issues: ReadinessIssue[] = [];
        const gmc = product.googleMerchant || {};

        // Required fields checks
        if (!product.name || product.name.trim().length === 0) {
            issues.push({ severity: 'error', field: 'name', title: 'Missing Title', description: 'Product title is required for Google Merchant.' });
        } else if (product.name.length > 150) {
            issues.push({ severity: 'warning', field: 'name', title: 'Title Too Long', description: 'Product title should be under 150 characters.' });
        }

        if (!product.description || product.description.trim().length === 0) {
            issues.push({ severity: 'error', field: 'description', title: 'Missing Description', description: 'Product description is required.' });
        }

        if (!product.price || product.price <= 0) {
            issues.push({ severity: 'error', field: 'price', title: 'Missing Price', description: 'A valid product price is required.' });
        }

        const hasImage = product.featuredImage || (product.images && product.images.length > 0);
        if (!hasImage) {
            issues.push({ severity: 'error', field: 'images', title: 'Missing Image', description: 'At least one product image is required.' });
        }

        if (!product.sku) {
            issues.push({ severity: 'error', field: 'sku', title: 'Missing SKU', description: 'Product SKU is required as the offer ID.' });
        }

        // Brand / GTIN / MPN checks
        const hasBrand = gmc.brand || (typeof product.brand === 'object' && product.brand?.name);
        const hasGtin = !!gmc.gtin;
        const hasMpn = !!gmc.mpn;

        if (!hasBrand) {
            issues.push({ severity: 'warning', field: 'brand', title: 'Missing Brand', description: 'Brand is strongly recommended for better visibility in Shopping ads.' });
        }

        if (!hasGtin && !hasMpn) {
            if (gmc.identifierExists !== false) {
                issues.push({ severity: 'warning', field: 'gtin', title: 'Missing GTIN/MPN', description: 'Provide GTIN or MPN, or set "Identifier Exists" to false if no standard identifier exists.' });
            }
        }

        // Google Product Category
        if (!gmc.googleProductCategory) {
            issues.push({ severity: 'warning', field: 'googleProductCategory', title: 'Missing Google Category', description: 'Google Product Category is recommended for proper categorization in Shopping.' });
        }

        // Condition
        if (!gmc.condition) {
            issues.push({ severity: 'info', field: 'condition', title: 'No Condition Set', description: 'Product condition defaults to "new". Set explicitly if different.' });
        }

        // Store domain check
        if (!store.domains?.length) {
            issues.push({ severity: 'error', field: 'store.domains', title: 'Missing Store Domain', description: 'Store must have a domain configured for product URLs.' });
        }

        // Weight for shipping
        if (!product.weight) {
            issues.push({ severity: 'info', field: 'weight', title: 'Missing Weight', description: 'Product weight helps with shipping cost calculations in Google Shopping.' });
        }

        // Availability
        if (product.stockStatus === 'out_of_stock') {
            issues.push({ severity: 'info', field: 'stockStatus', title: 'Out of Stock', description: 'Product is out of stock. It will be listed but may not appear in Shopping results.' });
        }

        // Calculate readiness score
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        const infoCount = issues.filter(i => i.severity === 'info').length;

        let score = 100;
        score -= errorCount * 25;
        score -= warningCount * 10;
        score -= infoCount * 2;
        score = Math.max(0, Math.min(100, score));

        return {
            score,
            issues,
            ready: errorCount === 0,
        };
    }

    /**
     * Submit product to Google Merchant Center
     * In Phase 1, this updates the local status. When real credentials are provided,
     * this will call the Google Content API.
     */
    async submitProduct(productId: string, storeId: string): Promise<{ success: boolean; message: string }> {
        const product = await Product.findOne({ _id: productId, storeId }).populate('brand');
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return { success: false, message: 'Store not found' };
        }

        const gmcSettings = store.googleMerchantSettings;
        if (!gmcSettings?.enabled) {
            return { success: false, message: 'Google Merchant is not enabled for this store' };
        }

        // Validate readiness
        const readiness = this.validateProductReadiness(product, store);
        if (!readiness.ready) {
            // Update product with issues
            await Product.findByIdAndUpdate(productId, {
                'googleMerchant.status': 'disapproved',
                'googleMerchant.issues': readiness.issues.map(i => ({
                    severity: i.severity,
                    title: i.title,
                    description: i.description,
                })),
            });
            return { success: false, message: `Product has ${readiness.issues.filter(i => i.severity === 'error').length} error(s) that must be fixed before submission.` };
        }

        // Build the feed item (this would be sent to Google Content API)
        // const feedItem = this.buildProductFeed(product, store);

        // TODO: When real credentials are available, call Google Content API here:
        // const content = google.content({ version: 'v2.1', auth });
        // await content.products.insert({ merchantId, requestBody: feedItem });

        // Update product status to pending (will be updated when we check status from Google)
        await Product.findByIdAndUpdate(productId, {
            'googleMerchant.status': 'pending',
            'googleMerchant.lastSubmittedAt': new Date(),
            'googleMerchant.googleProductId': `online:${gmcSettings.contentLanguage || 'en'}:${gmcSettings.targetCountries?.[0] || 'US'}:${product.sku}`,
            'googleMerchant.issues': [],
        });

        return { success: true, message: 'Product submitted successfully' };
    }

    /**
     * Batch submit products
     */
    async batchSubmitProducts(productIds: string[], storeId: string): Promise<{ submitted: number; failed: number; errors: string[] }> {
        let submitted = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const productId of productIds) {
            const result = await this.submitProduct(productId, storeId);
            if (result.success) {
                submitted++;
            } else {
                failed++;
                errors.push(`${productId}: ${result.message}`);
            }
        }

        return { submitted, failed, errors };
    }

    /**
     * Remove product from Google Merchant Center
     */
    async removeProduct(productId: string, storeId: string): Promise<{ success: boolean; message: string }> {
        const product = await Product.findOne({ _id: productId, storeId });
        if (!product) {
            return { success: false, message: 'Product not found' };
        }

        // TODO: When real credentials are available, call Google Content API:
        // await content.products.delete({ merchantId, productId: googleProductId });

        await Product.findByIdAndUpdate(productId, {
            'googleMerchant.status': 'not_submitted',
            'googleMerchant.googleProductId': null,
            'googleMerchant.issues': [],
            'googleMerchant.lastSubmittedAt': null,
        });

        return { success: true, message: 'Product removed from Google Merchant Center' };
    }

    /**
     * Get feed diagnostics for a store — aggregate counts of statuses and issues
     */
    async getFeedDiagnostics(storeId: string) {
        const [statusCounts, issueCounts] = await Promise.all([
            Product.aggregate([
                { $match: { storeId: storeId } },
                {
                    $group: {
                        _id: '$googleMerchant.status',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Product.aggregate([
                { $match: { storeId: storeId, 'googleMerchant.issues.0': { $exists: true } } },
                { $unwind: '$googleMerchant.issues' },
                {
                    $group: {
                        _id: {
                            severity: '$googleMerchant.issues.severity',
                            title: '$googleMerchant.issues.title',
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
            ]),
        ]);

        const statusMap: Record<string, number> = {
            not_submitted: 0,
            pending: 0,
            approved: 0,
            disapproved: 0,
            warning: 0,
        };

        for (const s of statusCounts) {
            const key = s._id || 'not_submitted';
            statusMap[key] = s.count;
        }

        const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

        return {
            total,
            statuses: statusMap,
            topIssues: issueCounts.map((i: any) => ({
                severity: i._id.severity,
                title: i._id.title,
                count: i.count,
            })),
        };
    }

    /**
     * Update supplemental data for a product
     */
    async updateSupplementalData(productId: string, storeId: string, data: Record<string, any>) {
        const allowedFields = [
            'gtin', 'mpn', 'googleProductCategory', 'condition', 'ageGroup', 'gender',
            'color', 'size', 'material', 'pattern', 'brand',
            'customLabel0', 'customLabel1', 'customLabel2', 'customLabel3', 'customLabel4',
            'promotionIds', 'shippingLabel', 'taxCategory', 'energyEfficiencyClass',
            'multipack', 'isBundle', 'identifierExists',
        ];

        const updateFields: Record<string, any> = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                updateFields[`googleMerchant.${key}`] = data[key];
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return null;
        }

        const product = await Product.findOneAndUpdate(
            { _id: productId, storeId },
            { $set: updateFields },
            { new: true }
        );

        return product;
    }

    /**
     * Batch update supplemental data
     */
    async batchUpdateSupplementalData(productIds: string[], storeId: string, data: Record<string, any>) {
        const allowedFields = [
            'gtin', 'mpn', 'googleProductCategory', 'condition', 'ageGroup', 'gender',
            'color', 'size', 'material', 'pattern', 'brand',
            'customLabel0', 'customLabel1', 'customLabel2', 'customLabel3', 'customLabel4',
            'promotionIds', 'shippingLabel', 'taxCategory', 'energyEfficiencyClass',
            'multipack', 'isBundle', 'identifierExists',
        ];

        const updateFields: Record<string, any> = {};
        for (const key of allowedFields) {
            if (data[key] !== undefined) {
                updateFields[`googleMerchant.${key}`] = data[key];
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return { modifiedCount: 0 };
        }

        const result = await Product.updateMany(
            { _id: { $in: productIds }, storeId },
            { $set: updateFields }
        );

        return result;
    }

    /**
     * Strip HTML tags from a string
     */
    private stripHtml(html: string): string {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
}

export default new GoogleMerchantService();
