import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/validation';
import Store from '../models/Store';
import Product from '../models/Product';
import Currency from '../models/Currency';

/**
 * Escapes special characters for XML safely
 */
function escapeXml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

/**
 * Strips HTML tags from a string
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert price helper using active currency rates from DB
 */
async function convertPrice(amount: number, store: any, targetCurrencyCode: string): Promise<{ value: string; currency: string }> {
    const storeBaseCode = store.currency || 'USD';
    const targetCode = targetCurrencyCode.toUpperCase();

    if (storeBaseCode === targetCode) {
        return { value: amount.toFixed(2), currency: storeBaseCode };
    }

    try {
        const [baseCurrencyDoc, targetCurrencyDoc] = await Promise.all([
            Currency.findOne({ code: storeBaseCode, isActive: true }),
            Currency.findOne({ code: targetCode, isActive: true }),
        ]);

        const baseRate = baseCurrencyDoc ? baseCurrencyDoc.exchangeRate : 1;
        const targetRate = targetCurrencyDoc ? targetCurrencyDoc.exchangeRate : 1;
        const decimalPlaces = targetCurrencyDoc ? targetCurrencyDoc.decimalPlaces : 2;

        const convertedAmount = (amount / baseRate) * targetRate;
        return {
            value: convertedAmount.toFixed(decimalPlaces),
            currency: targetCode,
        };
    } catch (error) {
        console.error('Feed currency conversion failed, falling back to base currency:', error);
        return { value: amount.toFixed(2), currency: storeBaseCode };
    }
}

/**
 * Generate Pinterest Catalog RSS 2.0 / Google Product Feed XML
 */
export const getPinterestFeed = asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.params;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Check if Pinterest Integration is enabled for this store
    const config = store.settings?.pinterestSettings || {};
    if (config.enabled === false) {
        throw new AppError('Pinterest feed is disabled for this store', 403);
    }

    // Find all active products
    const products = await Product.find({ storeId, isActive: true });

    const rawDomain = store.domains?.[0] || 'example.com';
    let domain = rawDomain.trim().replace(/^https?:\/\//i, '');
    if (!domain.startsWith('www.') && (domain.match(/\./g) || []).length === 1) {
        domain = 'www.' + domain;
    }
    const storeLink = `https://${domain}`;
    const targetCurrency = config.currency || store.currency || 'USD';

    // Start building XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${escapeXml(store.name || 'Store Catalog')}</title>\n`;
    xml += `    <link>${escapeXml(storeLink)}</link>\n`;
    xml += `    <description>Product Catalog Feed for Pinterest integration</description>\n`;

    for (const product of products) {
        const productUrl = `${storeLink}/${product.slug}`;
        const imageBase = product.featuredImage || product.images?.[0] || '';
        const imageLink = imageBase.startsWith('http') ? imageBase : `${storeLink}${imageBase}`;

        // Skip items that have no images (Pinterest Catalogs require an image)
        if (!imageLink) continue;

        // Convert currency
        const priceVal = product.isOnSale && product.salePrice ? product.salePrice : product.price;
        const converted = await convertPrice(priceVal, store, targetCurrency);
        const formattedPrice = `${converted.value} ${converted.currency}`;

        // Stock status mapping
        const availability = (product.stockStatus === 'in_stock' || (product.stock || 0) > 0) ? 'in stock' : 'out of stock';

        xml += `    <item>\n`;
        xml += `      <g:id>${escapeXml(product.sku || product._id.toString())}</g:id>\n`;
        xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
        xml += `      <g:description>${escapeXml(stripHtml(product.description || '').slice(0, 500))}</g:description>\n`;
        xml += `      <g:link>${escapeXml(productUrl)}</g:link>\n`;
        xml += `      <g:image_link>${escapeXml(imageLink)}</g:image_link>\n`;
        xml += `      <g:price>${escapeXml(formattedPrice)}</g:price>\n`;
        xml += `      <g:availability>${escapeXml(availability)}</g:availability>\n`;
        xml += `      <g:condition>new</g:condition>\n`;
        xml += `    </item>\n`;
    }

    xml += `  </channel>\n`;
    xml += `</rss>\n`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
});
