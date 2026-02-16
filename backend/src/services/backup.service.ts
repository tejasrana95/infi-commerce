import ExcelJS from 'exceljs';
import Product from '../models/Product';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Coupon from '../models/Coupon';
import Review from '../models/Review';
import { objectToExcelRow, createWorksheet, generateExportFilename } from '../utils/excel-formatter';

export interface ExportFilters {
    storeId?: string;
    categoryId?: string;
}

class BackupService {
    private toIdString(value: any): string {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' || typeof value === 'number') return String(value);

        if (typeof value === 'object') {
            if ('_id' in value && value._id) {
                return String(value._id);
            }
            if (typeof value.toString === 'function') {
                return value.toString();
            }
        }

        return '';
    }

    private normalizeSheetText(value: any): string {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return value.map(item => this.normalizeSheetText(item)).filter(Boolean).join(', ');

        try {
            return JSON.stringify(value);
        } catch (error) {
            return String(value);
        }
    }

    private getReferenceLabel(reference: any): string {
        if (reference === null || reference === undefined) return '';
        if (typeof reference === 'string' || typeof reference === 'number') return String(reference).trim();

        if (typeof reference === 'object') {
            if ('name' in reference && typeof reference.name === 'string' && reference.name.trim()) {
                return reference.name.trim();
            }
            if ('slug' in reference && typeof reference.slug === 'string' && reference.slug.trim()) {
                return reference.slug.trim();
            }
        }

        return this.toIdString(reference);
    }

    private formatYesNo(value: any, defaultValue: boolean): string {
        if (value === undefined || value === null) {
            return defaultValue ? 'Yes' : 'No';
        }
        return Boolean(value) ? 'Yes' : 'No';
    }

    private resolveOptionValueLabel(optionReference: any, optionValue: string): string {
        if (!optionReference || typeof optionReference !== 'object' || !Array.isArray(optionReference.values)) {
            return optionValue;
        }

        const matched = optionReference.values.find((entry: any) => {
            if (!entry) return false;
            return String(entry.value ?? '').trim() === optionValue;
        });

        if (!matched) return optionValue;
        return String(matched.label ?? matched.value ?? optionValue);
    }

    private formatVariantAttributesForSheet(variantAttributes: Record<string, string> | undefined, product: any): string {
        if (!variantAttributes || typeof variantAttributes !== 'object') {
            return '';
        }

        const optionMap = new Map<string, any>();
        const productOptions = Array.isArray(product.productOptions) ? product.productOptions : [];

        productOptions.forEach((entry: any) => {
            const optionId = this.toIdString(entry?.optionId);
            if (!optionId) return;
            optionMap.set(optionId, entry.optionId);
        });

        return Object.entries(variantAttributes)
            .map(([rawKey, rawValue]) => {
                const optionReference = optionMap.get(rawKey);
                const optionLabel = optionReference
                    ? this.getReferenceLabel(optionReference)
                    : rawKey;
                const optionValue = this.normalizeSheetText(rawValue);
                const valueLabel = optionReference
                    ? this.resolveOptionValueLabel(optionReference, optionValue)
                    : optionValue;

                if (!optionLabel && !valueLabel) return '';
                if (!optionLabel) return valueLabel;
                if (!valueLabel) return optionLabel;

                return `${optionLabel}=${valueLabel}`;
            })
            .filter(Boolean)
            .join('; ');
    }

    private buildProductWorkbookSheets(products: any[]): {
        productsSheet: any[];
        variantsSheet: any[];
        specificationsSheet: any[];
        optionsSheet: any[];
        attributesSheet: any[];
    } {
        const productsSheet: any[] = [];
        const variantsSheet: any[] = [];
        const specificationsSheet: any[] = [];
        const optionsSheet: any[] = [];
        const attributesSheet: any[] = [];

        products.forEach(product => {
            const productId = this.toIdString(product._id);
            const productSku = this.normalizeSheetText(product.sku);

            const row = objectToExcelRow(product);
            delete row.variants;
            delete row.specifications;
            delete row.productOptions;
            delete row.attributes;
            productsSheet.push(row);

            const specifications = Array.isArray(product.specifications) ? product.specifications : [];
            specifications.forEach((spec: any) => {
                if (!spec) return;
                specificationsSheet.push({
                    product_id: productId,
                    product_sku: productSku,
                    attribute: this.getReferenceLabel(spec.attributeId),
                    value: this.normalizeSheetText(spec.value),
                });
            });

            const options = Array.isArray(product.productOptions) ? product.productOptions : [];
            options.forEach((option: any) => {
                if (!option) return;
                const optionReference = option.optionId;
                const values = Array.isArray(option.values)
                    ? option.values
                        .map((value: any) => this.resolveOptionValueLabel(optionReference, this.normalizeSheetText(value)))
                        .filter(Boolean)
                        .join(', ')
                    : '';

                optionsSheet.push({
                    product_id: productId,
                    product_sku: productSku,
                    option: this.getReferenceLabel(optionReference),
                    values,
                    is_variation: this.formatYesNo(option.isVariation, true),
                });
            });

            const attributes = Array.isArray(product.attributes) ? product.attributes : [];
            attributes.forEach((attribute: any) => {
                if (!attribute) return;
                const values = Array.isArray(attribute.values)
                    ? attribute.values.map((value: any) => this.normalizeSheetText(value)).filter(Boolean).join(', ')
                    : '';

                attributesSheet.push({
                    product_id: productId,
                    product_sku: productSku,
                    attribute: this.getReferenceLabel(attribute.attributeId),
                    values,
                    is_variation: this.formatYesNo(attribute.isVariation, false),
                });
            });

            const variants = Array.isArray(product.variants) ? product.variants : [];
            variants.forEach((variant: any, index: number) => {
                if (!variant) return;

                variantsSheet.push({
                    product_id: productId,
                    product_sku: productSku,
                    variant_index: index + 1,
                    sku: this.normalizeSheetText(variant.sku),
                    attributes: this.formatVariantAttributesForSheet(variant.attributes, product),
                    price: variant.price ?? '',
                    salePrice: variant.salePrice ?? '',
                    stock: variant.stock ?? '',
                    weight: variant.weight ?? '',
                    costPrice: variant.costPrice ?? '',
                    images: Array.isArray(variant.images)
                        ? variant.images.map((image: any) => this.normalizeSheetText(image)).filter(Boolean).join(', ')
                        : '',
                    length: variant.dimensions?.length ?? '',
                    width: variant.dimensions?.width ?? '',
                    height: variant.dimensions?.height ?? '',
                });
            });
        });

        return {
            productsSheet,
            variantsSheet,
            specificationsSheet,
            optionsSheet,
            attributesSheet,
        };
    }

    /**
     * Export products to Excel
     */
    async exportProducts(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        if (filters.categoryId) {
            query.categoryIds = filters.categoryId;
        }

        const products = await Product.find(query)
            .populate('storeId', 'name')
            .populate('categoryIds', 'title')
            .populate('brand', 'name')
            .populate('specifications.attributeId', 'name slug')
            .populate('attributes.attributeId', 'name slug')
            .populate('productOptions.optionId', 'name slug values')
            .lean();

        const {
            productsSheet,
            variantsSheet,
            specificationsSheet,
            optionsSheet,
            attributesSheet,
        } = this.buildProductWorkbookSheets(products);

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Products', productsSheet);
        createWorksheet(workbook, 'ProductVariants', variantsSheet, [
            { header: 'product_id', key: 'product_id', width: 24 },
            { header: 'product_sku', key: 'product_sku', width: 18 },
            { header: 'variant_index', key: 'variant_index', width: 14 },
            { header: 'sku', key: 'sku', width: 18 },
            { header: 'attributes', key: 'attributes', width: 40 },
            { header: 'price', key: 'price', width: 12 },
            { header: 'salePrice', key: 'salePrice', width: 12 },
            { header: 'stock', key: 'stock', width: 10 },
            { header: 'weight', key: 'weight', width: 12 },
            { header: 'costPrice', key: 'costPrice', width: 12 },
            { header: 'images', key: 'images', width: 40 },
            { header: 'length', key: 'length', width: 10 },
            { header: 'width', key: 'width', width: 10 },
            { header: 'height', key: 'height', width: 10 },
        ]);
        createWorksheet(workbook, 'ProductSpecifications', specificationsSheet, [
            { header: 'product_id', key: 'product_id', width: 24 },
            { header: 'product_sku', key: 'product_sku', width: 18 },
            { header: 'attribute', key: 'attribute', width: 24 },
            { header: 'value', key: 'value', width: 40 },
        ]);
        createWorksheet(workbook, 'ProductOptions', optionsSheet, [
            { header: 'product_id', key: 'product_id', width: 24 },
            { header: 'product_sku', key: 'product_sku', width: 18 },
            { header: 'option', key: 'option', width: 24 },
            { header: 'values', key: 'values', width: 30 },
            { header: 'is_variation', key: 'is_variation', width: 14 },
        ]);
        createWorksheet(workbook, 'ProductAttributes', attributesSheet, [
            { header: 'product_id', key: 'product_id', width: 24 },
            { header: 'product_sku', key: 'product_sku', width: 18 },
            { header: 'attribute', key: 'attribute', width: 24 },
            { header: 'values', key: 'values', width: 30 },
            { header: 'is_variation', key: 'is_variation', width: 14 },
        ]);

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export orders to Excel
     */
    async exportOrders(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const orders = await Order.find(query)
            .populate('storeId', 'name')
            .populate('customerId', 'email firstName lastName')
            .lean();

        const excelData = orders.map(order => objectToExcelRow(order));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Orders', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export customers to Excel
     */
    async exportCustomers(_filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        // Note: Customers are not store-specific in the current model
        // If you need store filtering, you'd need to add storeId to Customer model

        const customers = await Customer.find(query).lean();

        // Remove sensitive data
        const sanitizedData = customers.map(customer => {
            const { password, twoFactorSecret, twoFactorBackupCodes, passwordResetToken, emailVerificationToken, ...safe } = customer as any;
            return objectToExcelRow(safe);
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Customers', sanitizedData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export categories to Excel
     */
    async exportCategories(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const categories = await Category.find(query)
            .populate('storeId', 'name')
            .populate('parentCategory', 'title')
            .lean();

        const excelData = categories.map(category => objectToExcelRow(category));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Categories', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export brands to Excel
     */
    async exportBrands(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const brands = await Brand.find(query)
            .populate('storeId', 'name')
            .lean();

        const excelData = brands.map(brand => objectToExcelRow(brand));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Brands', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export coupons to Excel
     */
    async exportCoupons(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const coupons = await Coupon.find(query)
            .populate('storeId', 'name')
            .populate('categoryIds', 'title')
            .lean();

        const excelData = coupons.map(coupon => objectToExcelRow(coupon));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Coupons', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export reviews to Excel
     */
    async exportReviews(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const reviews = await Review.find(query)
            .populate('storeId', 'name')
            .populate('productId', 'title')
            .populate('customerId', 'email firstName lastName')
            .lean();

        const excelData = reviews.map(review => objectToExcelRow(review));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Reviews', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Get appropriate filename for entity export
     */
    getExportFilename(entity: string): string {
        return generateExportFilename(entity);
    }
}

export default new BackupService();
