import ExcelJS from 'exceljs';

import Product from '../models/Product';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Coupon from '../models/Coupon';
import Review from '../models/Review';
import Store from '../models/Store';
import Attribute from '../models/Attribute';
import ProductOption from '../models/ProductOption';
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

interface ParsedComplexFieldResult<T> {
    value?: T;
    errors: string[];
}

interface ProductOptionLookupEntry {
    id: string;
    valueLookup: Map<string, string>;
}

interface ParsedExcelRow {
    rowNumber: number;
    data: any;
}

interface ProductWorkbookRows {
    products: ParsedExcelRow[];
    variants: ParsedExcelRow[];
    specifications: ParsedExcelRow[];
    options: ParsedExcelRow[];
    attributes: ParsedExcelRow[];
    hasVariantsSheet: boolean;
    hasSpecificationsSheet: boolean;
    hasOptionsSheet: boolean;
    hasAttributesSheet: boolean;
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

        return this.parseWorksheetRows(worksheet);
    }

    private parseWorksheetRows(worksheet: ExcelJS.Worksheet): ParsedExcelRow[] {
        const rows: ParsedExcelRow[] = [];
        const headers: string[] = [];

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.value?.toString() || '';
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

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

    private getWorksheetByName(workbook: ExcelJS.Workbook, sheetName: string): ExcelJS.Worksheet | undefined {
        const normalizedName = sheetName.trim().toLowerCase();
        return workbook.worksheets.find(worksheet => worksheet.name.trim().toLowerCase() === normalizedName);
    }

    private async parseProductWorkbook(buffer: Buffer): Promise<ProductWorkbookRows> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);

        const productsWorksheet = this.getWorksheetByName(workbook, 'Products') || workbook.worksheets[0];
        if (!productsWorksheet) {
            throw new Error('Excel file is empty or invalid');
        }

        const variantsWorksheet = this.getWorksheetByName(workbook, 'ProductVariants');
        const specificationsWorksheet = this.getWorksheetByName(workbook, 'ProductSpecifications');
        const optionsWorksheet = this.getWorksheetByName(workbook, 'ProductOptions');
        const attributesWorksheet = this.getWorksheetByName(workbook, 'ProductAttributes');

        return {
            products: this.parseWorksheetRows(productsWorksheet),
            variants: variantsWorksheet ? this.parseWorksheetRows(variantsWorksheet) : [],
            specifications: specificationsWorksheet ? this.parseWorksheetRows(specificationsWorksheet) : [],
            options: optionsWorksheet ? this.parseWorksheetRows(optionsWorksheet) : [],
            attributes: attributesWorksheet ? this.parseWorksheetRows(attributesWorksheet) : [],
            hasVariantsSheet: Boolean(variantsWorksheet),
            hasSpecificationsSheet: Boolean(specificationsWorksheet),
            hasOptionsSheet: Boolean(optionsWorksheet),
            hasAttributesSheet: Boolean(attributesWorksheet),
        };
    }

    private buildProductKey(productId?: string, sku?: string): string | undefined {
        if (productId && validateObjectId(productId)) {
            return `id:${productId}`;
        }

        if (sku) {
            const normalizedSku = sku.trim().toLowerCase();
            if (normalizedSku) {
                return `sku:${normalizedSku}`;
            }
        }

        return undefined;
    }

    private buildProductKeyFromProductRow(data: any): string | undefined {
        const productId = this.toIdString(data?._id);
        const sku = typeof data?.sku === 'string' ? data.sku : undefined;
        return this.buildProductKey(productId, sku);
    }

    private buildProductKeyFromChildRow(data: any): string | undefined {
        const productId = this.toIdString(data?.product_id ?? data?.productId);
        const skuRaw = data?.product_sku ?? data?.productSku;
        const sku = typeof skuRaw === 'string'
            ? skuRaw
            : skuRaw === null || skuRaw === undefined
                ? undefined
                : String(skuRaw);

        return this.buildProductKey(productId, sku);
    }

    private mapChildRowsByProductKey(rows: ParsedExcelRow[]): Map<string, ParsedExcelRow[]> {
        const mappedRows = new Map<string, ParsedExcelRow[]>();

        rows.forEach(row => {
            const key = this.buildProductKeyFromChildRow(row.data);
            if (!key) {
                return;
            }

            const existing = mappedRows.get(key) || [];
            existing.push(row);
            mappedRows.set(key, existing);
        });

        return mappedRows;
    }

    private asCellText(value: any): string {
        if (value === null || value === undefined) return '';

        if (typeof value === 'string') {
            return value.trim();
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'object') {
            if ('text' in value && typeof value.text === 'string') {
                return value.text.trim();
            }

            if ('result' in value && value.result !== undefined) {
                return this.asCellText(value.result);
            }
        }

        return String(value).trim();
    }

    private parseCellNumber(value: any): number | undefined {
        if (value === null || value === undefined || value === '') {
            return undefined;
        }

        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : undefined;
        }

        const parsed = Number(this.asCellText(value));
        return Number.isFinite(parsed) ? parsed : undefined;
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

    private normalizeLookupKey(value: string): string {
        return value.trim().toLowerCase();
    }

    private splitFriendlyEntries(value: string): string[] {
        return value
            .split(/\r?\n|;/)
            .map(entry => entry.trim())
            .filter(Boolean);
    }

    private parseKeyValuePair(value: string): { key: string; value: string } | null {
        const equalIndex = value.indexOf('=');
        const colonIndex = value.indexOf(':');
        let separatorIndex = -1;

        if (equalIndex >= 0 && colonIndex >= 0) {
            separatorIndex = Math.min(equalIndex, colonIndex);
        } else {
            separatorIndex = equalIndex >= 0 ? equalIndex : colonIndex;
        }

        if (separatorIndex < 0) {
            return null;
        }

        const key = value.slice(0, separatorIndex).trim();
        const parsedValue = value.slice(separatorIndex + 1).trim();

        if (!key) {
            return null;
        }

        return { key, value: parsedValue };
    }

    private parseEntryWithMetadata(value: string): { key: string; value: string; metadata: Record<string, string> } | null {
        const parts = value
            .split('|')
            .map(part => part.trim())
            .filter(Boolean);

        if (parts.length === 0) {
            return null;
        }

        const main = this.parseKeyValuePair(parts[0]);
        if (!main) {
            return null;
        }

        const metadata: Record<string, string> = {};
        for (const metaPart of parts.slice(1)) {
            const parsed = this.parseKeyValuePair(metaPart);
            if (parsed) {
                metadata[this.normalizeLookupKey(parsed.key)] = parsed.value;
            }
        }

        return {
            key: main.key,
            value: main.value,
            metadata,
        };
    }

    private parseCommaSeparatedValues(value: string): string[] {
        return value
            .split(',')
            .map(entry => entry.trim())
            .filter(Boolean);
    }

    private toIdString(value: any): string | undefined {
        if (value === null || value === undefined) return undefined;

        if (typeof value === 'string' || typeof value === 'number') {
            const parsed = String(value).trim();
            return parsed || undefined;
        }

        if (typeof value === 'object') {
            if ('_id' in value && value._id) {
                const parsed = String(value._id).trim();
                return parsed || undefined;
            }

            if (typeof value.toString === 'function') {
                const parsed = value.toString().trim();
                return parsed || undefined;
            }
        }

        return undefined;
    }

    private normalizeStoreId(storeId: any): string | undefined {
        const parsedStoreId = this.toIdString(storeId);
        if (!parsedStoreId || !validateObjectId(parsedStoreId)) {
            return undefined;
        }
        return parsedStoreId;
    }

    private cleanupEmbeddedDocuments(items: any[]): any[] {
        return items.map((item: any) => {
            if (!item || typeof item !== 'object') return item;

            const cleaned = { ...item };
            delete cleaned._id;

            if ('attributeId' in cleaned) {
                const attributeId = this.toIdString(cleaned.attributeId);
                if (attributeId) {
                    cleaned.attributeId = attributeId;
                }
            }

            if ('optionId' in cleaned) {
                const optionId = this.toIdString(cleaned.optionId);
                if (optionId) {
                    cleaned.optionId = optionId;
                }
            }

            return cleaned;
        });
    }

    private async getAttributeLookup(
        storeId: string,
        cache: Map<string, Map<string, string>>
    ): Promise<Map<string, string>> {
        const cacheKey = storeId.toString();
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const attributes = await Attribute.find({ storeId: cacheKey })
            .select('_id name slug')
            .lean();

        const lookup = new Map<string, string>();
        attributes.forEach((attribute: any) => {
            const id = attribute._id?.toString();
            if (!id) return;

            lookup.set(id, id);

            if (attribute.name) {
                lookup.set(this.normalizeLookupKey(attribute.name), id);
            }

            if (attribute.slug) {
                lookup.set(this.normalizeLookupKey(attribute.slug), id);
            }
        });

        cache.set(cacheKey, lookup);
        return lookup;
    }

    private async getProductOptionLookup(
        storeId: string,
        cache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<Map<string, ProductOptionLookupEntry>> {
        const cacheKey = storeId.toString();
        const cached = cache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const options = await ProductOption.find({ storeId: cacheKey })
            .select('_id name slug values')
            .lean();

        const lookup = new Map<string, ProductOptionLookupEntry>();
        options.forEach((option: any) => {
            const id = option._id?.toString();
            if (!id) return;

            const valueLookup = new Map<string, string>();
            if (Array.isArray(option.values)) {
                option.values.forEach((optionValue: any) => {
                    if (!optionValue) return;

                    const parsedValue = typeof optionValue.value === 'string'
                        ? optionValue.value.trim()
                        : '';
                    if (!parsedValue) return;

                    valueLookup.set(this.normalizeLookupKey(parsedValue), parsedValue);

                    if (typeof optionValue.label === 'string' && optionValue.label.trim()) {
                        valueLookup.set(this.normalizeLookupKey(optionValue.label), parsedValue);
                    }
                });
            }

            const entry: ProductOptionLookupEntry = {
                id,
                valueLookup,
            };

            lookup.set(id, entry);

            if (option.name) {
                lookup.set(this.normalizeLookupKey(option.name), entry);
            }

            if (option.slug) {
                lookup.set(this.normalizeLookupKey(option.slug), entry);
            }
        });

        cache.set(cacheKey, lookup);
        return lookup;
    }

    private async resolveAttributeIdentifier(
        token: string,
        storeId: string | undefined,
        cache: Map<string, Map<string, string>>
    ): Promise<string | null> {
        const normalizedToken = token.trim();
        if (!normalizedToken) return null;

        // If store context is unavailable, only ObjectId values can be safely resolved.
        if (!storeId) {
            return validateObjectId(normalizedToken) ? normalizedToken : null;
        }

        const lookup = await this.getAttributeLookup(storeId, cache);
        if (validateObjectId(normalizedToken)) {
            return lookup.has(normalizedToken) ? normalizedToken : null;
        }

        return lookup.get(this.normalizeLookupKey(normalizedToken)) || null;
    }

    private async resolveProductOptionIdentifier(
        token: string,
        storeId: string | undefined,
        cache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<ProductOptionLookupEntry | null> {
        const normalizedToken = token.trim();
        if (!normalizedToken) return null;

        if (!storeId) {
            if (!validateObjectId(normalizedToken)) {
                return null;
            }

            return {
                id: normalizedToken,
                valueLookup: new Map<string, string>(),
            };
        }

        const lookup = await this.getProductOptionLookup(storeId, cache);
        if (validateObjectId(normalizedToken)) {
            return lookup.get(normalizedToken) || null;
        }

        return lookup.get(this.normalizeLookupKey(normalizedToken)) || null;
    }

    private async parseProductSpecificationsField(
        rawValue: any,
        storeId: string | undefined,
        attributeLookupCache: Map<string, Map<string, string>>
    ): Promise<ParsedComplexFieldResult<Array<{ attributeId: string; value: any }>>> {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return { errors: [] };
        }

        if (Array.isArray(rawValue)) {
            const cleaned = this.cleanupEmbeddedDocuments(rawValue)
                .filter((item: any) => item && typeof item === 'object')
                .map((item: any) => {
                    const attributeId = this.toIdString(item.attributeId);
                    if (!attributeId) return null;
                    return {
                        attributeId,
                        value: item.value,
                    };
                })
                .filter((item): item is { attributeId: string; value: any } => Boolean(item));

            return { value: cleaned, errors: [] };
        }

        if (typeof rawValue !== 'string') {
            return { errors: ['Field "specifications" must be text or array format'] };
        }

        const trimmedValue = rawValue.trim();
        if (!trimmedValue) {
            return { value: [], errors: [] };
        }

        if (trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmedValue);
                return this.parseProductSpecificationsField(parsed, storeId, attributeLookupCache);
            } catch (error) {
                return { errors: ['Field "specifications" contains invalid JSON'] };
            }
        }

        const errors: string[] = [];
        const parsedSpecifications: Array<{ attributeId: string; value: any }> = [];

        for (const entry of this.splitFriendlyEntries(trimmedValue)) {
            const parsedEntry = this.parseEntryWithMetadata(entry);
            if (!parsedEntry) {
                errors.push(`Invalid specifications entry "${entry}". Use "Attribute=Value".`);
                continue;
            }

            const attributeId = await this.resolveAttributeIdentifier(
                parsedEntry.key,
                storeId,
                attributeLookupCache
            );
            if (!attributeId) {
                errors.push(`Unknown specification attribute "${parsedEntry.key}".`);
                continue;
            }

            parsedSpecifications.push({
                attributeId,
                value: parsedEntry.value,
            });
        }

        return { value: parsedSpecifications, errors };
    }

    private async parseProductOptionsField(
        rawValue: any,
        storeId: string | undefined,
        optionLookupCache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<ParsedComplexFieldResult<Array<{ optionId: string; values: string[]; isVariation: boolean }>>> {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return { errors: [] };
        }

        if (Array.isArray(rawValue)) {
            const cleaned = this.cleanupEmbeddedDocuments(rawValue)
                .filter((item: any) => item && typeof item === 'object')
                .map((item: any) => {
                    const optionId = this.toIdString(item.optionId);
                    if (!optionId) return null;

                    const optionValues = Array.isArray(item.values)
                        ? item.values.map((value: any) => String(value).trim()).filter(Boolean)
                        : this.parseCommaSeparatedValues(String(item.values ?? ''));

                    return {
                        optionId,
                        values: optionValues,
                        isVariation: item.isVariation === undefined ? true : parseBoolean(item.isVariation),
                    };
                })
                .filter((item): item is { optionId: string; values: string[]; isVariation: boolean } => Boolean(item));

            return { value: cleaned, errors: [] };
        }

        if (typeof rawValue !== 'string') {
            return { errors: ['Field "productOptions" must be text or array format'] };
        }

        const trimmedValue = rawValue.trim();
        if (!trimmedValue) {
            return { value: [], errors: [] };
        }

        if (trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmedValue);
                return this.parseProductOptionsField(parsed, storeId, optionLookupCache);
            } catch (error) {
                return { errors: ['Field "productOptions" contains invalid JSON'] };
            }
        }

        const errors: string[] = [];
        const parsedProductOptions: Array<{ optionId: string; values: string[]; isVariation: boolean }> = [];

        for (const entry of this.splitFriendlyEntries(trimmedValue)) {
            const parsedEntry = this.parseEntryWithMetadata(entry);
            if (!parsedEntry) {
                errors.push(`Invalid productOptions entry "${entry}". Use "Option=Value1,Value2|variation=Yes".`);
                continue;
            }

            const optionEntry = await this.resolveProductOptionIdentifier(
                parsedEntry.key,
                storeId,
                optionLookupCache
            );
            if (!optionEntry) {
                errors.push(`Unknown product option "${parsedEntry.key}".`);
                continue;
            }

            const values = this.parseCommaSeparatedValues(parsedEntry.value).map(value => {
                const normalized = this.normalizeLookupKey(value);
                return optionEntry.valueLookup.get(normalized) || value;
            });

            const variationFlag = parsedEntry.metadata.variation ?? parsedEntry.metadata.isvariation;
            const isVariation = variationFlag === undefined ? true : parseBoolean(variationFlag);

            parsedProductOptions.push({
                optionId: optionEntry.id,
                values,
                isVariation,
            });
        }

        return { value: parsedProductOptions, errors };
    }

    private async parseProductAttributesField(
        rawValue: any,
        storeId: string | undefined,
        attributeLookupCache: Map<string, Map<string, string>>
    ): Promise<ParsedComplexFieldResult<Array<{ attributeId: string; values: string[]; isVariation: boolean }>>> {
        if (rawValue === null || rawValue === undefined || rawValue === '') {
            return { errors: [] };
        }

        if (Array.isArray(rawValue)) {
            const errors: string[] = [];
            const parsedAttributes: Array<{ attributeId: string; values: string[]; isVariation: boolean }> = [];

            for (const item of this.cleanupEmbeddedDocuments(rawValue)) {
                if (item === null || item === undefined) {
                    continue;
                }

                if (typeof item === 'string' || typeof item === 'number') {
                    const attributeId = await this.resolveAttributeIdentifier(
                        String(item),
                        storeId,
                        attributeLookupCache
                    );
                    if (!attributeId) {
                        errors.push(`Unknown attribute "${String(item)}".`);
                        continue;
                    }

                    parsedAttributes.push({
                        attributeId,
                        values: [],
                        isVariation: false,
                    });
                    continue;
                }

                if (typeof item !== 'object') {
                    continue;
                }

                const rawAttribute = this.toIdString((item as any).attributeId);
                if (!rawAttribute) {
                    continue;
                }

                const attributeId = await this.resolveAttributeIdentifier(
                    rawAttribute,
                    storeId,
                    attributeLookupCache
                );
                if (!attributeId) {
                    errors.push(`Unknown attribute "${rawAttribute}".`);
                    continue;
                }

                const values = Array.isArray((item as any).values)
                    ? (item as any).values.map((value: any) => String(value).trim()).filter(Boolean)
                    : this.parseCommaSeparatedValues(String((item as any).values ?? ''));

                parsedAttributes.push({
                    attributeId,
                    values,
                    isVariation: (item as any).isVariation === undefined
                        ? false
                        : parseBoolean((item as any).isVariation),
                });
            }

            return { value: parsedAttributes, errors };
        }

        if (typeof rawValue !== 'string') {
            return { errors: ['Field "attributes" must be text or array format'] };
        }

        const trimmedValue = rawValue.trim();
        if (!trimmedValue) {
            return { value: [], errors: [] };
        }

        if (trimmedValue.startsWith('[') || trimmedValue.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmedValue);
                return this.parseProductAttributesField(parsed, storeId, attributeLookupCache);
            } catch (error) {
                return { errors: ['Field "attributes" contains invalid JSON'] };
            }
        }

        const errors: string[] = [];
        const parsedAttributes: Array<{ attributeId: string; values: string[]; isVariation: boolean }> = [];

        for (const entry of this.splitFriendlyEntries(trimmedValue)) {
            const parsedEntry = this.parseEntryWithMetadata(entry);
            const attributeKey = parsedEntry ? parsedEntry.key : entry.trim();
            if (!attributeKey) {
                continue;
            }

            const attributeId = await this.resolveAttributeIdentifier(
                attributeKey,
                storeId,
                attributeLookupCache
            );
            if (!attributeId) {
                errors.push(`Unknown attribute "${attributeKey}".`);
                continue;
            }

            const values = parsedEntry
                ? this.parseCommaSeparatedValues(parsedEntry.value)
                : [];
            const variationFlag = parsedEntry
                ? parsedEntry.metadata.variation ?? parsedEntry.metadata.isvariation
                : undefined;
            const isVariation = variationFlag === undefined ? false : parseBoolean(variationFlag);

            parsedAttributes.push({
                attributeId,
                values,
                isVariation,
            });
        }

        return { value: parsedAttributes, errors };
    }

    private async parseSpecificationsRowsFromSheet(
        rows: ParsedExcelRow[],
        storeId: string | undefined,
        attributeLookupCache: Map<string, Map<string, string>>
    ): Promise<ParsedComplexFieldResult<Array<{ attributeId: string; value: any }>>> {
        const parsedSpecifications: Array<{ attributeId: string; value: any }> = [];
        const errors: string[] = [];

        for (const row of rows) {
            const attributeToken = this.asCellText(row.data.attribute);
            const value = row.data.value;

            if (!attributeToken && (value === undefined || value === null || this.asCellText(value) === '')) {
                continue;
            }

            if (!attributeToken) {
                errors.push(`ProductSpecifications row ${row.rowNumber}: attribute is required.`);
                continue;
            }

            const attributeId = await this.resolveAttributeIdentifier(
                attributeToken,
                storeId,
                attributeLookupCache
            );

            if (!attributeId) {
                errors.push(`ProductSpecifications row ${row.rowNumber}: unknown attribute "${attributeToken}".`);
                continue;
            }

            parsedSpecifications.push({
                attributeId,
                value,
            });
        }

        return { value: parsedSpecifications, errors };
    }

    private async parseOptionsRowsFromSheet(
        rows: ParsedExcelRow[],
        storeId: string | undefined,
        optionLookupCache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<ParsedComplexFieldResult<Array<{ optionId: string; values: string[]; isVariation: boolean }>>> {
        const parsedOptions: Array<{ optionId: string; values: string[]; isVariation: boolean }> = [];
        const errors: string[] = [];

        for (const row of rows) {
            const optionToken = this.asCellText(row.data.option);
            const valuesToken = this.asCellText(row.data.values);
            const variationToken = row.data.is_variation;

            if (!optionToken && !valuesToken && variationToken === undefined) {
                continue;
            }

            if (!optionToken) {
                errors.push(`ProductOptions row ${row.rowNumber}: option is required.`);
                continue;
            }

            const optionEntry = await this.resolveProductOptionIdentifier(
                optionToken,
                storeId,
                optionLookupCache
            );

            if (!optionEntry) {
                errors.push(`ProductOptions row ${row.rowNumber}: unknown option "${optionToken}".`);
                continue;
            }

            const values = this.parseCommaSeparatedValues(valuesToken).map(value => {
                const normalized = this.normalizeLookupKey(value);
                return optionEntry.valueLookup.get(normalized) || value;
            });

            const isVariation = variationToken === undefined || variationToken === null || variationToken === ''
                ? true
                : parseBoolean(variationToken);

            parsedOptions.push({
                optionId: optionEntry.id,
                values,
                isVariation,
            });
        }

        return { value: parsedOptions, errors };
    }

    private async parseAttributesRowsFromSheet(
        rows: ParsedExcelRow[],
        storeId: string | undefined,
        attributeLookupCache: Map<string, Map<string, string>>
    ): Promise<ParsedComplexFieldResult<Array<{ attributeId: string; values: string[]; isVariation: boolean }>>> {
        const parsedAttributes: Array<{ attributeId: string; values: string[]; isVariation: boolean }> = [];
        const errors: string[] = [];

        for (const row of rows) {
            const attributeToken = this.asCellText(row.data.attribute);
            const valuesToken = this.asCellText(row.data.values);
            const variationToken = row.data.is_variation;

            if (!attributeToken && !valuesToken && variationToken === undefined) {
                continue;
            }

            if (!attributeToken) {
                errors.push(`ProductAttributes row ${row.rowNumber}: attribute is required.`);
                continue;
            }

            const attributeId = await this.resolveAttributeIdentifier(
                attributeToken,
                storeId,
                attributeLookupCache
            );

            if (!attributeId) {
                errors.push(`ProductAttributes row ${row.rowNumber}: unknown attribute "${attributeToken}".`);
                continue;
            }

            const isVariation = variationToken === undefined || variationToken === null || variationToken === ''
                ? false
                : parseBoolean(variationToken);

            parsedAttributes.push({
                attributeId,
                values: this.parseCommaSeparatedValues(valuesToken),
                isVariation,
            });
        }

        return { value: parsedAttributes, errors };
    }

    private async parseVariantAttributesField(
        rawValue: any,
        storeId: string | undefined,
        optionLookupCache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<ParsedComplexFieldResult<Record<string, string>>> {
        if (rawValue === undefined || rawValue === null || rawValue === '') {
            return { value: {}, errors: [] };
        }

        const result: Record<string, string> = {};
        const errors: string[] = [];

        const resolveAndAssign = async (optionToken: string, optionValueToken: string) => {
            const optionEntry = await this.resolveProductOptionIdentifier(
                optionToken,
                storeId,
                optionLookupCache
            );

            if (!optionEntry) {
                errors.push(`Unknown variant option "${optionToken}".`);
                return;
            }

            const normalizedValue = this.normalizeLookupKey(optionValueToken);
            const mappedValue = optionEntry.valueLookup.get(normalizedValue) || optionValueToken;
            result[optionEntry.id] = mappedValue;
        };

        if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
            for (const [optionToken, optionValue] of Object.entries(rawValue)) {
                await resolveAndAssign(optionToken, this.asCellText(optionValue));
            }
            return { value: result, errors };
        }

        const text = this.asCellText(rawValue);
        if (!text) {
            return { value: {}, errors: [] };
        }

        if (text.startsWith('{')) {
            try {
                const parsed = JSON.parse(text);
                return this.parseVariantAttributesField(parsed, storeId, optionLookupCache);
            } catch (error) {
                errors.push('Invalid JSON format in variant attributes.');
                return { value: result, errors };
            }
        }

        for (const entry of this.splitFriendlyEntries(text)) {
            const parsedEntry = this.parseEntryWithMetadata(entry);
            if (!parsedEntry) {
                errors.push(`Invalid variant attribute entry "${entry}". Use "Option=Value".`);
                continue;
            }

            await resolveAndAssign(parsedEntry.key, parsedEntry.value);
        }

        return { value: result, errors };
    }

    private async parseVariantsRowsFromSheet(
        rows: ParsedExcelRow[],
        storeId: string | undefined,
        optionLookupCache: Map<string, Map<string, ProductOptionLookupEntry>>
    ): Promise<ParsedComplexFieldResult<any[]>> {
        const parsedVariantsWithOrder: Array<{ order: number; variant: any }> = [];
        const errors: string[] = [];

        for (const row of rows) {
            const order = this.parseCellNumber(row.data.variant_index) ?? row.rowNumber;
            const sku = this.asCellText(row.data.sku);
            const attributesToken = row.data.attributes;

            const parsedAttributes = await this.parseVariantAttributesField(
                attributesToken,
                storeId,
                optionLookupCache
            );
            if (parsedAttributes.errors.length > 0) {
                parsedAttributes.errors.forEach(error => {
                    errors.push(`ProductVariants row ${row.rowNumber}: ${error}`);
                });
            }

            const images = this.parseCommaSeparatedValues(this.asCellText(row.data.images));
            const price = this.parseCellNumber(row.data.price);
            const salePrice = this.parseCellNumber(row.data.salePrice);
            const stock = this.parseCellNumber(row.data.stock);
            const weight = this.parseCellNumber(row.data.weight);
            const costPrice = this.parseCellNumber(row.data.costPrice);
            const length = this.parseCellNumber(row.data.length);
            const width = this.parseCellNumber(row.data.width);
            const height = this.parseCellNumber(row.data.height);

            const variant: any = {};
            if (sku) variant.sku = sku;
            if (parsedAttributes.value && Object.keys(parsedAttributes.value).length > 0) {
                variant.attributes = parsedAttributes.value;
            }
            if (price !== undefined) variant.price = price;
            if (salePrice !== undefined) variant.salePrice = salePrice;
            if (stock !== undefined) variant.stock = stock;
            if (weight !== undefined) variant.weight = weight;
            if (costPrice !== undefined) variant.costPrice = costPrice;
            if (images.length > 0) variant.images = images;

            if (length !== undefined || width !== undefined || height !== undefined) {
                variant.dimensions = {
                    ...(length !== undefined ? { length } : {}),
                    ...(width !== undefined ? { width } : {}),
                    ...(height !== undefined ? { height } : {}),
                };
            }

            if (Object.keys(variant).length === 0) {
                continue;
            }

            parsedVariantsWithOrder.push({ order, variant });
        }

        parsedVariantsWithOrder.sort((a, b) => a.order - b.order);

        return {
            value: parsedVariantsWithOrder.map(item => item.variant),
            errors,
        };
    }

    /**
     * Import products from Excel
     */
    async importProducts(buffer: Buffer, _filters: ImportFilters = {}): Promise<ImportResult> {
        const workbookRows = await this.parseProductWorkbook(buffer);
        const rows = workbookRows.products;
        const result: ImportResult = {
            success: false,
            message: '',
            created: 0,
            updated: 0,
            errors: []
        };

        const variantRowsByProduct = this.mapChildRowsByProductKey(workbookRows.variants);
        const specificationRowsByProduct = this.mapChildRowsByProductKey(workbookRows.specifications);
        const optionRowsByProduct = this.mapChildRowsByProductKey(workbookRows.options);
        const attributeRowsByProduct = this.mapChildRowsByProductKey(workbookRows.attributes);

        // Validate all rows first
        const validatedRows: Array<{ rowNumber: number; data: any; productKey?: string }> = [];

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
                validatedRows.push({
                    rowNumber,
                    data: unflattened,
                    productKey: this.buildProductKeyFromProductRow(unflattened),
                });
            }
        }

        // If any errors, reject entire import
        if (result.errors.length > 0) {
            result.success = false;
            result.message = `Validation failed for ${result.errors.length} rows. No data was imported.`;
            return result;
        }

        const attributeLookupCache = new Map<string, Map<string, string>>();
        const optionLookupCache = new Map<string, Map<string, ProductOptionLookupEntry>>();

        // Process validated rows
        for (const { rowNumber, data, productKey } of validatedRows) {
            const sanitized = sanitizeData(data);
            const rowErrors: string[] = [];
            const storeIdForLookup = this.normalizeStoreId(sanitized.storeId);
            const specificationRows = productKey ? (specificationRowsByProduct.get(productKey) || []) : [];
            const optionRows = productKey ? (optionRowsByProduct.get(productKey) || []) : [];
            const attributeRows = productKey ? (attributeRowsByProduct.get(productKey) || []) : [];
            const variantRows = productKey ? (variantRowsByProduct.get(productKey) || []) : [];

            // Handle boolean fields
            const booleanFields = [
                'manageStock', 'downloadable', 'isActive', 'isFeatured', 'isOnSale', 'barcodeGenerated'
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

            // Handle nested boolean fields in returnSettings
            if (sanitized.returnSettings?.isReturnable !== undefined) {
                sanitized.returnSettings.isReturnable = parseBoolean(sanitized.returnSettings.isReturnable);
            }


            // Handle simple array fields
            const simpleArrayFields = ['categoryIds', 'images', 'tags'];
            simpleArrayFields.forEach(field => {
                if (sanitized[field] && typeof sanitized[field] === 'string') {
                    sanitized[field] = parseArray(sanitized[field]);
                }
            });

            if (workbookRows.hasSpecificationsSheet) {
                const parsedSpecifications = await this.parseSpecificationsRowsFromSheet(
                    specificationRows,
                    storeIdForLookup,
                    attributeLookupCache
                );
                if (parsedSpecifications.errors.length > 0) {
                    rowErrors.push(...parsedSpecifications.errors);
                } else {
                    sanitized.specifications = parsedSpecifications.value || [];
                }
            } else {
                const parsedSpecifications = await this.parseProductSpecificationsField(
                    sanitized.specifications,
                    storeIdForLookup,
                    attributeLookupCache
                );
                if (parsedSpecifications.errors.length > 0) {
                    rowErrors.push(...parsedSpecifications.errors);
                } else if (parsedSpecifications.value !== undefined) {
                    sanitized.specifications = parsedSpecifications.value;
                }
            }

            if (workbookRows.hasOptionsSheet) {
                const parsedProductOptions = await this.parseOptionsRowsFromSheet(
                    optionRows,
                    storeIdForLookup,
                    optionLookupCache
                );
                if (parsedProductOptions.errors.length > 0) {
                    rowErrors.push(...parsedProductOptions.errors);
                } else {
                    sanitized.productOptions = parsedProductOptions.value || [];
                }
            } else {
                const parsedProductOptions = await this.parseProductOptionsField(
                    sanitized.productOptions,
                    storeIdForLookup,
                    optionLookupCache
                );
                if (parsedProductOptions.errors.length > 0) {
                    rowErrors.push(...parsedProductOptions.errors);
                } else if (parsedProductOptions.value !== undefined) {
                    sanitized.productOptions = parsedProductOptions.value;
                }
            }

            if (workbookRows.hasAttributesSheet) {
                const parsedAttributes = await this.parseAttributesRowsFromSheet(
                    attributeRows,
                    storeIdForLookup,
                    attributeLookupCache
                );
                if (parsedAttributes.errors.length > 0) {
                    rowErrors.push(...parsedAttributes.errors);
                } else {
                    sanitized.attributes = parsedAttributes.value || [];
                }
            } else {
                const parsedAttributes = await this.parseProductAttributesField(
                    sanitized.attributes,
                    storeIdForLookup,
                    attributeLookupCache
                );
                if (parsedAttributes.errors.length > 0) {
                    rowErrors.push(...parsedAttributes.errors);
                } else if (parsedAttributes.value !== undefined) {
                    sanitized.attributes = parsedAttributes.value;
                }
            }

            if (workbookRows.hasVariantsSheet) {
                const parsedVariants = await this.parseVariantsRowsFromSheet(
                    variantRows,
                    storeIdForLookup,
                    optionLookupCache
                );
                if (parsedVariants.errors.length > 0) {
                    rowErrors.push(...parsedVariants.errors);
                } else {
                    sanitized.variants = parsedVariants.value || [];
                }
            }

            // Handle complex array fields (arrays of objects)
            const complexArrayFields = [
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
                            // Plain string is invalid for complex array fields
                            delete sanitized[field];
                        }
                    }

                    // Clean up invalid _id fields from array items (embedded documents)
                    if (Array.isArray(sanitized[field])) {
                        sanitized[field] = this.cleanupEmbeddedDocuments(sanitized[field]);
                    }
                }
            });

            if (Array.isArray(sanitized.specifications)) {
                sanitized.specifications = this.cleanupEmbeddedDocuments(sanitized.specifications)
                    .filter((item: any) => item && typeof item === 'object' && item.attributeId);
            }

            if (Array.isArray(sanitized.productOptions)) {
                sanitized.productOptions = this.cleanupEmbeddedDocuments(sanitized.productOptions)
                    .filter((item: any) => item && typeof item === 'object' && item.optionId);
            }

            if (Array.isArray(sanitized.attributes)) {
                sanitized.attributes = this.cleanupEmbeddedDocuments(sanitized.attributes)
                    .filter((item: any) => item && typeof item === 'object' && item.attributeId);
            }

            if (rowErrors.length > 0) {
                result.errors.push({
                    row: rowNumber,
                    errors: rowErrors
                });
                continue;
            }

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
                            row: rowNumber,
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
                    row: rowNumber,
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

        // Map model names to slug entity types for slug validation
        const slugEntityTypes: Record<string, 'product' | 'category' | 'page' | 'brand'> = {
            'Category': 'category',
            'Brand': 'brand',
        };

        for (const { rowNumber, data } of rows) {
            const errors: string[] = [];
            const unflattened = this.unflattenObject(data);

            errors.push(...validateRequiredFields(unflattened, requiredFields));

            if (Object.keys(references).length > 0) {
                const refErrors = await validateReferences(unflattened, references);
                errors.push(...refErrors);
            }

            // Validate slug uniqueness for slug-bearing entities
            const entityType = slugEntityTypes[Model.modelName];
            if (entityType && unflattened.slug && unflattened.storeId) {
                const isAvailable = await slugService.isSlugAvailable(
                    unflattened.storeId,
                    unflattened.slug,
                    entityType,
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

                    // Use save() for models with slug registry hooks (Category, Brand)
                    if (['Category', 'Brand'].includes(Model.modelName)) {
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
                    if (['Category', 'Brand'].includes(Model.modelName)) {
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

            // Validate slug uniqueness for slug-bearing entities during dry run
            if (unflattened.slug && unflattened.storeId) {
                // Determine entity type from required fields heuristic
                const entityType = requiredFields.includes('title') ? 'category' as const
                    : requiredFields.includes('name') && requiredFields.includes('slug') ? 'brand' as const
                        : null;
                if (entityType) {
                    const isAvailable = await slugService.isSlugAvailable(
                        unflattened.storeId,
                        unflattened.slug,
                        entityType,
                        unflattened._id
                    );
                    if (!isAvailable) {
                        errors.push(`Slug "${unflattened.slug}" is already in use by another entity`);
                    }
                }
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
