import ExcelJS from 'exceljs';

import Product from '../models/Product';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Coupon from '../models/Coupon';
import Review from '../models/Review';
import Store from '../models/Store';
import {
    validateObjectId,
    validateRequiredFields,
    validateDataTypes,
    validateReferences,
    sanitizeData,
    parseBoolean,
    parseArray
} from '../utils/excel-validator';
import slugService from '../services/slug.service';

export interface ImportFilters {
    storeId?: string;
    categoryId?: string;
}

export interface ImportResult {
    success: boolean;
    message: string;
    created: number;
    updated: number;
    errors: Array<{ row: number; errors: string[] }>;
}

class RestoreService {
    /**
     * Parse Excel file to JSON
     */
    private async parseExcelFile(buffer: Buffer): Promise<any[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('Excel file is empty or invalid');
        }

        const rows: any[] = [];
        const headers: string[] = [];

        // Get headers from first row
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
        });

        // Parse data rows
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowData: any = {};
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber - 1];
                if (header) {
                    rowData[header] = cell.value;
                }
            });

            rows.push({ rowNumber, data: rowData });
        });

        return rows;
    }

    /**
     * Unflatten Excel row back to nested object
     * Converts { 'address.city': 'NYC' } back to { address: { city: 'NYC' } }
     */
    private unflattenObject(flat: any): any {
        const result: any = {};

        for (const [key, value] of Object.entries(flat)) {
            if (!key) continue;

            const parts = key.split('.');
            let current = result;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }

            const lastPart = parts[parts.length - 1];

            // Try to parse JSON arrays
            if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                try {
                    current[lastPart] = JSON.parse(value);
                } catch (e) {
                    current[lastPart] = value;
                }
            } else {
                current[lastPart] = value;
            }
        }

        return result;
    }

    /**
     * Import products from Excel
     */
    async importProducts(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        // Validate all rows first
        const validatedRows: any[] = [];

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            // Required fields
            const requiredFields = ['name', 'slug', 'storeId', 'type'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            // Data types
            const schema = {
                price: 'number',
                compareAtPrice: 'number',
                costPrice: 'number',
                trackInventory: 'boolean',
                stock: 'number',
                storeId: 'objectid'
            };
            errors.push(...validateDataTypes(unflattened, schema));

            // Validate references
            if (unflattened.storeId) {
                const refErrors = await validateReferences(unflattened, { storeId: Store });
                errors.push(...refErrors);
            }

            // Validate slug uniqueness
            if (unflattened.slug && unflattened.storeId) {
                const isAvailable = await slugService.isSlugAvailable(
                    unflattened.storeId,
                    unflattened.slug,
                    'product',
                    unflattened._id
                );
                if (!isAvailable) {
                    errors.push(`Slug "${unflattened.slug}" is already in use by another entity`);
                }
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                validatedRows.push({ rowNumber, data: unflattened });
            }
        }

        // If any errors, reject entire import
        if (result.errors.length > 0) {
            result.success = false;
            result.message = `Validation failed for ${result.errors.length} rows. No data was imported.`;
            return result;
        }

        // Process validated rows
        for (const { data } of validatedRows) {
            const sanitized = sanitizeData(data);

            // Handle boolean fields
            const booleanFields = [
                'manageStock', 'downloadable', 'isActive', 'isFeatured', 'isOnSale'
            ];
            booleanFields.forEach(field => {
                if (sanitized[field] !== undefined) {
                    sanitized[field] = parseBoolean(sanitized[field]);
                }
            });

            // Handle nested boolean fields in geoLimit
            if (sanitized.geoLimit?.enabled !== undefined) {
                sanitized.geoLimit.enabled = parseBoolean(sanitized.geoLimit.enabled);
            }


            // Handle simple array fields
            const simpleArrayFields = ['categoryIds', 'images', 'tags'];
            simpleArrayFields.forEach(field => {
                if (sanitized[field] && typeof sanitized[field] === 'string') {
                    sanitized[field] = parseArray(sanitized[field]);
                }
            });

            // Handle complex array fields (arrays of objects)
            const complexArrayFields = [
                'specifications', 'productOptions', 'attributes',
                'variants', 'downloadFiles', 'videos'
            ];
            complexArrayFields.forEach(field => {
                if (sanitized[field]) {
                    if (typeof sanitized[field] === 'string') {
                        // Check if it's a JSON array string
                        if (sanitized[field].startsWith('[') || sanitized[field].startsWith('{')) {
                            try {
                                sanitized[field] = JSON.parse(sanitized[field]);
                            } catch (e) {
                                // If parsing fails, remove the field (invalid data)
                                delete sanitized[field];
                            }
                        } else {
                            // Plain string (likely an ObjectId from flattening) - remove it
                            // These fields should be arrays of objects, not plain strings
                            delete sanitized[field];
                        }
                    }
                }
            });

            try {
                if (sanitized._id && validateObjectId(sanitized._id)) {
                    // Update existing product
                    const productId = sanitized._id;
                    delete sanitized._id; // Don't update _id field

                    // Use save() to trigger slug registry hooks
                    const doc = await Product.findById(productId);
                    if (doc) {
                        doc.set(sanitized);
                        await doc.save();
                        result.updated++;
                    } else {
                        result.errors.push({
                            row: validatedRows.indexOf({ data } as any) + 2,
                            errors: [`Product with ID ${productId} not found`]
                        });
                    }
                } else {
                    // Create new product
                    delete sanitized._id; // Remove invalid _id
                    await Product.create(sanitized);
                    result.created++;
                }
            } catch (error: any) {
                result.errors.push({
                    row: validatedRows.indexOf({ data } as any) + 2,
                    errors: [`Database error: ${error.message}`]
                });
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Successfully imported ${result.created} new products and updated ${result.updated} existing products.`
            : `Import completed with errors. Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors.length}`;

        return result;
    }

    /**
     * Import orders from Excel
     */
    async importOrders(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        const validatedRows: any[] = [];

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            // Required fields
            const requiredFields = ['storeId', 'orderNumber', 'status', 'items'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            // Validate references
            if (unflattened.storeId) {
                const refErrors = await validateReferences(unflattened, { storeId: Store });
                errors.push(...refErrors);
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                validatedRows.push({ rowNumber, data: unflattened });
            }
        }

        if (result.errors.length > 0) {
            result.success = false;
            result.message = `Validation failed for ${result.errors.length} rows. No data was imported.`;
            return result;
        }

        for (const { data } of validatedRows) {
            const sanitized = sanitizeData(data);

            // Parse items array
            if (typeof sanitized.items === 'string') {
                sanitized.items = JSON.parse(sanitized.items);
            }

            try {
                if (sanitized._id && validateObjectId(sanitized._id)) {
                    const orderId = sanitized._id;
                    delete sanitized._id;
                    await Order.findByIdAndUpdate(orderId, sanitized, { runValidators: true });
                    result.updated++;
                } else {
                    delete sanitized._id;
                    await Order.create(sanitized);
                    result.created++;
                }
            } catch (error: any) {
                result.errors.push({
                    row: validatedRows.indexOf({ data } as any) + 2,
                    errors: [`Database error: ${error.message}`]
                });
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Successfully imported ${result.created} new orders and updated ${result.updated} existing orders.`
            : `Import completed with errors.`;

        return result;
    }

    /**
     * Import customers from Excel
     */
    async importCustomers(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        const validatedRows: any[] = [];

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            const requiredFields = ['email', 'firstName', 'lastName'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                validatedRows.push({ rowNumber, data: unflattened });
            }
        }

        if (result.errors.length > 0) {
            result.success = false;
            result.message = `Validation failed. No data was imported.`;
            return result;
        }

        for (const { data } of validatedRows) {
            const sanitized = sanitizeData(data);

            // Don't allow password import for security
            delete sanitized.password;
            delete sanitized.twoFactorSecret;
            delete sanitized.twoFactorBackupCodes;

            // Handle boolean fields
            const booleanFields = ['isActive', 'emailVerified', 'twoFactorEnabled'];
            booleanFields.forEach(field => {
                if (sanitized[field] !== undefined) {
                    sanitized[field] = parseBoolean(sanitized[field]);
                }
            });

            // Handle nested boolean fields in preferences
            if (sanitized.preferences) {
                if (sanitized.preferences.newsletter !== undefined) {
                    sanitized.preferences.newsletter = parseBoolean(sanitized.preferences.newsletter);
                }
                if (sanitized.preferences.sms !== undefined) {
                    sanitized.preferences.sms = parseBoolean(sanitized.preferences.sms);
                }
            }

            // Parse addresses array  
            if (typeof sanitized.addresses === 'string') {
                try {
                    sanitized.addresses = JSON.parse(sanitized.addresses);
                } catch (e) {
                    sanitized.addresses = [];
                }
            }

            try {
                if (sanitized._id && validateObjectId(sanitized._id)) {
                    const customerId = sanitized._id;
                    delete sanitized._id;
                    await Customer.findByIdAndUpdate(customerId, sanitized, { runValidators: true });
                    result.updated++;
                } else {
                    delete sanitized._id;
                    // Set default password for new customers
                    sanitized.password = 'TempPassword123!';
                    await Customer.create(sanitized);
                    result.created++;
                }
            } catch (error: any) {
                result.errors.push({
                    row: validatedRows.indexOf({ data } as any) + 2,
                    errors: [`Database error: ${error.message} `]
                });
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Successfully imported ${result.created} new customers and updated ${result.updated} existing customers.`
            : `Import completed with errors.`;

        return result;
    }

    /**
     * Import categories, brands, coupons, reviews - similar pattern
     */
    async importCategories(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        return this.genericImport(buffer, Category, ['title', 'slug', 'storeId'], { storeId: Store });
    }

    async importBrands(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        return this.genericImport(buffer, Brand, ['name', 'slug', 'storeId'], { storeId: Store });
    }

    async importCoupons(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        return this.genericImport(buffer, Coupon, ['code', 'storeId', 'discountType', 'discountValue', 'startDate', 'endDate'], { storeId: Store });
    }

    async importReviews(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        return this.genericImport(buffer, Review, ['storeId', 'productId', 'rating', 'title', 'content'], { storeId: Store });
    }

    /**
     * Generic import function for simpler entities
     */
    private async genericImport(
        buffer: Buffer,
        Model: any,
        requiredFields: string[],
        references: Record<string, any> = {}
    ): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        const validatedRows: any[] = [];

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            errors.push(...validateRequiredFields(unflattened, requiredFields));

            if (Object.keys(references).length > 0) {
                const refErrors = await validateReferences(unflattened, references);
                errors.push(...refErrors);
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                validatedRows.push({ rowNumber, data: unflattened });
            }
        }

        if (result.errors.length > 0) {
            result.success = false;
            result.message = `Validation failed for ${result.errors.length} rows.No data was imported.`;
            return result;
        }


        for (const { data } of validatedRows) {
            const sanitized = sanitizeData(data);

            // Handle boolean fields for all entity types
            const booleanFieldsMap: Record<string, string[]> = {
                'Category': ['isVisible'],
                'Brand': ['isActive'],
                'Coupon': ['isActive'],
                'Review': ['isGuestReview', 'guestEmailVerified', 'isApproved', 'isVerifiedPurchase']
            };

            const modelName = Model.modelName;
            const booleanFields = booleanFieldsMap[modelName] || [];

            booleanFields.forEach(field => {
                if (sanitized[field] !== undefined) {
                    sanitized[field] = parseBoolean(sanitized[field]);
                }
            });

            // Handle array fields
            const arrayFields = ['categoryIds', 'images', 'votedBy'];
            arrayFields.forEach(field => {
                if (sanitized[field] && typeof sanitized[field] === 'string') {
                    try {
                        sanitized[field] = JSON.parse(sanitized[field]);
                    } catch (e) {
                        // Try comma-separated parsing
                        sanitized[field] = parseArray(sanitized[field]);
                    }
                }
            });

            // Handle nested objects
            if (sanitized.adminReply && typeof sanitized.adminReply === 'string') {
                try {
                    sanitized.adminReply = JSON.parse(sanitized.adminReply);
                } catch (e) {
                    delete sanitized.adminReply;
                }
            }

            try {
                if (sanitized._id && validateObjectId(sanitized._id)) {
                    const id = sanitized._id;
                    delete sanitized._id;

                    // Use save() for models with slug registry hooks (Category)
                    if (['Category'].includes(Model.modelName)) {
                        const doc = await Model.findById(id);
                        if (doc) {
                            doc.set(sanitized);
                            await doc.save();
                            result.updated++;
                        } else {
                            result.errors.push({
                                row: validatedRows.indexOf({ data } as any) + 2,
                                errors: [`Record with ID ${id} not found`]
                            });
                        }
                    } else {
                        await Model.findByIdAndUpdate(id, sanitized, { runValidators: true });
                        result.updated++;
                    }
                } else {
                    delete sanitized._id;
                    if (['Category'].includes(Model.modelName)) {
                        const doc = new Model(sanitized);
                        await doc.save();
                    } else {
                        await Model.create(sanitized);
                    }
                    result.created++;
                }
            } catch (error: any) {
                result.errors.push({
                    row: validatedRows.indexOf({ data } as any) + 2,
                    errors: [`Database error: ${error.message} `]
                });
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Successfully imported ${result.created} new records and updated ${result.updated} existing records.`
            : `Import completed with errors.`;

        return result;
    }

    /**
     * Validate import without actually importing (dry run)
     */
    async validateImport(buffer: Buffer, entity: string): Promise<ImportResult> {
        // Run the same validation as the actual import methods, but don't save
        switch (entity) {
            case 'products':
                return this.validateProducts(buffer);
            case 'orders':
                return this.validateOrders(buffer);
            case 'customers':
                return this.validateCustomers(buffer);
            case 'categories':
                return this.validateGeneric(buffer, ['title', 'slug', 'storeId'], { storeId: Store });
            case 'brands':
                return this.validateGeneric(buffer, ['name', 'slug', 'storeId'], { storeId: Store });
            case 'coupons':
                return this.validateGeneric(buffer, ['code', 'storeId', 'discountType', 'discountValue', 'startDate', 'endDate'], { storeId: Store });
            case 'reviews':
                return this.validateGeneric(buffer, ['storeId', 'productId', 'rating', 'title', 'content'], { storeId: Store });
            default:
                throw new Error(`Unknown entity type: ${entity} `);
        }
    }

    /**
     * Validate products without importing
     */
    private async validateProducts(buffer: Buffer): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            // Required fields
            const requiredFields = ['name', 'slug', 'storeId', 'type'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            // Data types
            const schema = {
                price: 'number',
                compareAtPrice: 'number',
                costPrice: 'number',
                stock: 'number',
                storeId: 'objectid',
                manageStock: 'boolean',
                downloadable: 'boolean',
                isActive: 'boolean',
                isFeatured: 'boolean',
                isOnSale: 'boolean'
            };
            errors.push(...validateDataTypes(unflattened, schema));

            // Validate references
            if (unflattened.storeId) {
                const refErrors = await validateReferences(unflattened, { storeId: Store });
                errors.push(...refErrors);
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                // Check if it would be create or update
                if (unflattened._id && validateObjectId(unflattened._id)) {
                    result.updated++;
                } else {
                    result.created++;
                }
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Validation successful.Would create ${result.created} new records and update ${result.updated} existing records.`
            : `Validation failed for ${result.errors.length} rows.No data will be imported.`;

        return result;
    }

    /**
     * Validate orders without importing
     */
    private async validateOrders(buffer: Buffer): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            // Required fields
            const requiredFields = ['storeId', 'orderNumber', 'status', 'items'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            // Validate references
            if (unflattened.storeId) {
                const refErrors = await validateReferences(unflattened, { storeId: Store });
                errors.push(...refErrors);
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                if (unflattened._id && validateObjectId(unflattened._id)) {
                    result.updated++;
                } else {
                    result.created++;
                }
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Validation successful.Would create ${result.created} new records and update ${result.updated} existing records.`
            : `Validation failed for ${result.errors.length} rows.No data will be imported.`;

        return result;
    }

    /**
     * Validate customers without importing
     */
    private async validateCustomers(buffer: Buffer): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            const requiredFields = ['email', 'firstName', 'lastName'];
            errors.push(...validateRequiredFields(unflattened, requiredFields));

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                if (unflattened._id && validateObjectId(unflattened._id)) {
                    result.updated++;
                } else {
                    result.created++;
                }
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Validation successful.Would create ${result.created} new records and update ${result.updated} existing records.`
            : `Validation failed for ${result.errors.length} rows.No data will be imported.`;

        return result;
    }

    /**
     * Generic validation for simpler entities
     */
    private async validateGeneric(
        buffer: Buffer,
        requiredFields: string[],
        references: Record<string, any> = {}
    ): Promise<ImportResult> {
        const rows = await this.parseExcelFile(buffer);
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            errors.push(...validateRequiredFields(unflattened, requiredFields));

            if (Object.keys(references).length > 0) {
                const refErrors = await validateReferences(unflattened, references);
                errors.push(...refErrors);
            }

            if (errors.length > 0) {
                result.errors.push({ row: rowNumber, errors });
            } else {
                if (unflattened._id && validateObjectId(unflattened._id)) {
                    result.updated++;
                } else {
                    result.created++;
                }
            }
        }

        result.success = result.errors.length === 0;
        result.message = result.success
            ? `Validation successful.Would create ${result.created} new records and update ${result.updated} existing records.`
            : `Validation failed for ${result.errors.length} rows.No data will be imported.`;

        return result;
    }
}

export default new RestoreService();
