import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import ExcelJS from 'exceljs';
import { config } from '../config';
import Store from '../models/Store';
import Product from '../models/Product';
import Brand from '../models/Brand';
import Attribute from '../models/Attribute';
import ProductOption from '../models/ProductOption';

type RowRecord = Record<string, unknown>;
type CategoryMap = Record<string, Types.ObjectId>;

interface CliArgs {
    storeId: string;
    productsFile: string;
    attributesFile: string;
    optionsFile: string;
    categoryMapFile?: string;
    imageBaseUrl?: string;
    dryRun: boolean;
}

interface ImportStats {
    brandsCreated: number;
    attributesCreated: number;
    attributesUpdated: number;
    optionsCreated: number;
    optionsUpdated: number;
    productsCreated: number;
    productsUpdated: number;
    productsSkipped: number;
}

const usage = `
OpenCart Product Importer

Usage:
  npx ts-node src/scripts/import-opencart.ts --store-id <mongo_store_id> [options]

Options:
  --products-file <path>     Path to products export xlsx
  --attributes-file <path>   Path to attributes export xlsx
  --options-file <path>      Path to options export xlsx
  --category-map <path>      Optional JSON: {"70":"<mongoCategoryId>", "71":"<mongoCategoryId>"}
  --image-base-url <url>     Optional prefix for image paths (e.g. https://cdn.example.com/)
  --dry-run                  Validate and map without writing to MongoDB
  --help                     Show this help

Defaults:
  --products-file /Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/products-2026-02-11.xlsx
  --attributes-file /Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/attributes-2026-02-11.xlsx
  --options-file /Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/options-2026-02-11.xlsx
`;

function parseArgs(argv: string[]): CliArgs {
    const defaults = {
        productsFile: '/Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/products-2026-02-11.xlsx',
        attributesFile: '/Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/attributes-2026-02-11.xlsx',
        optionsFile: '/Volumes/Drive/Projects/BitBucket/infi-commerce/backend/src/scripts/temp/options-2026-02-11.xlsx',
    };

    const args: Record<string, string | boolean> = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;
        const key = token.slice(2);
        const next = argv[i + 1];
        if (!next || next.startsWith('--')) {
            args[key] = true;
        } else {
            args[key] = next;
            i += 1;
        }
    }

    if (args.help) {
        console.log(usage);
        process.exit(0);
    }

    const storeId = asString(args['store-id']);
    if (!storeId) {
        throw new Error('Missing required argument: --store-id');
    }

    return {
        storeId,
        productsFile: asString(args['products-file']) || defaults.productsFile,
        attributesFile: asString(args['attributes-file']) || defaults.attributesFile,
        optionsFile: asString(args['options-file']) || defaults.optionsFile,
        categoryMapFile: asString(args['category-map']) || undefined,
        imageBaseUrl: asString(args['image-base-url']) || undefined,
        dryRun: Boolean(args['dry-run']),
    };
}

function asString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    return '';
}

function asNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function asBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', 'yes', '1'].includes(normalized)) return true;
        if (['false', 'no', '0'].includes(normalized)) return false;
    }
    return undefined;
}

function parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const text = asString(value);
    if (!text || text === '0000-00-00' || text === '0000-00-00 00:00:00') return undefined;

    const normalized = text.includes(' ') ? text.replace(' ', 'T') : text;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
}

function slugify(value: string): string {
    const normalized = value
        .normalize('NFKD')
        .replace(/[^\x00-\x7F]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return normalized || 'item';
}

function valueToString(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        if ('text' in value && typeof value.text === 'string') return value.text;
        if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.hyperlink;
        if ('richText' in value && Array.isArray(value.richText)) {
            return value.richText.map((chunk) => chunk.text).join('');
        }
        if ('result' in value && value.result !== undefined && value.result !== null) {
            return String(value.result);
        }
    }
    return String(value);
}

function loadSheetRows(workbook: ExcelJS.Workbook, sheetName: string): RowRecord[] {
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) return [];

    const headerRow = sheet.getRow(1);
    const headerValues = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
    const headers = headerValues.map((header: unknown) => asString(valueToString(header as ExcelJS.CellValue)));
    const rows: RowRecord[] = [];

    for (let i = 2; i <= sheet.rowCount; i += 1) {
        const row = sheet.getRow(i);
        const record: RowRecord = {};
        let hasData = false;

        for (let col = 1; col <= headers.length; col += 1) {
            const key = headers[col - 1];
            if (!key) continue;
            const cell = row.getCell(col).value;
            const parsed = valueToString(cell);
            record[key] = parsed;
            if (parsed !== '') hasData = true;
        }

        if (hasData) rows.push(record);
    }

    return rows;
}

function splitCsv(value: unknown): string[] {
    const text = asString(value);
    if (!text) return [];
    return text.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizeImagePath(imagePath: string, imageBaseUrl?: string): string {
    if (!imagePath) return '';
    if (!imageBaseUrl) return imagePath;
    const base = imageBaseUrl.endsWith('/') ? imageBaseUrl : `${imageBaseUrl}/`;
    const cleaned = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${base}${cleaned}`;
}

async function ensureUniqueSlug(
    model: mongoose.Model<any>,
    storeId: Types.ObjectId,
    preferred: string,
    excludeId?: Types.ObjectId
): Promise<string> {
    const base = slugify(preferred);
    let attempt = base;
    let count = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const filter: Record<string, unknown> = {
            storeId,
            slug: attempt,
        };
        if (excludeId) {
            filter._id = { $ne: excludeId };
        }

        const exists = await model.exists(filter);
        if (!exists) return attempt;

        count += 1;
        attempt = `${base}-${count}`;
    }
}

function resolveOptionType(openCartType: string, optionName: string): 'select' | 'multiselect' | 'color' | 'size' {
    const type = openCartType.toLowerCase();
    const name = optionName.toLowerCase();

    if (name.includes('color') || name.includes('colour')) return 'color';
    if (name.includes('size')) return 'size';
    if (['checkbox'].includes(type)) return 'multiselect';
    return 'select';
}

async function loadWorkbook(filePath: string): Promise<ExcelJS.Workbook> {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`File not found: ${resolved}`);
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(resolved);
    return workbook;
}

function loadCategoryMap(filePath?: string): CategoryMap {
    if (!filePath) return {};
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`Category map file not found: ${resolved}`);
    }
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, string>;
    const map: CategoryMap = {};

    Object.entries(parsed).forEach(([openCartCategoryId, mongoCategoryId]) => {
        if (!mongoose.Types.ObjectId.isValid(mongoCategoryId)) {
            throw new Error(`Invalid ObjectId for category map key ${openCartCategoryId}: ${mongoCategoryId}`);
        }
        map[openCartCategoryId] = new mongoose.Types.ObjectId(mongoCategoryId);
    });

    return map;
}

function dedupeStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function truncate(value: string, maxLength: number): string {
    if (!value) return value;
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength).trim();
}

async function runImport(args: CliArgs): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(args.storeId)) {
        throw new Error('Invalid --store-id (must be a MongoDB ObjectId)');
    }

    console.log(`Connecting to MongoDB: ${config.database.mongoUri}`);
    await mongoose.connect(config.database.mongoUri);

    const storeId = new mongoose.Types.ObjectId(args.storeId);
    const store = await Store.findById(storeId).lean();
    if (!store) {
        throw new Error(`Store not found for id ${args.storeId}`);
    }

    const productsWorkbook = await loadWorkbook(args.productsFile);
    const attributesWorkbook = await loadWorkbook(args.attributesFile);
    const optionsWorkbook = await loadWorkbook(args.optionsFile);
    const categoryMap = loadCategoryMap(args.categoryMapFile);

    const productsRows = loadSheetRows(productsWorkbook, 'Products');
    const additionalImagesRows = loadSheetRows(productsWorkbook, 'AdditionalImages');
    const specialsRows = loadSheetRows(productsWorkbook, 'Specials');
    const productOptionsRows = loadSheetRows(productsWorkbook, 'ProductOptions');
    const productOptionValuesRows = loadSheetRows(productsWorkbook, 'ProductOptionValues');
    const productAttributesRows = loadSheetRows(productsWorkbook, 'ProductAttributes');
    const productSeoRows = loadSheetRows(productsWorkbook, 'ProductSEOKeywords');

    const attributesRows = loadSheetRows(attributesWorkbook, 'Attributes');
    const optionsRows = loadSheetRows(optionsWorkbook, 'Options');
    const optionValuesRows = loadSheetRows(optionsWorkbook, 'OptionValues');

    const stats: ImportStats = {
        brandsCreated: 0,
        attributesCreated: 0,
        attributesUpdated: 0,
        optionsCreated: 0,
        optionsUpdated: 0,
        productsCreated: 0,
        productsUpdated: 0,
        productsSkipped: 0,
    };
    const warnings = new Set<string>();

    // Build lookup maps from OpenCart export.
    const additionalImagesByProduct = new Map<string, string[]>();
    additionalImagesRows.forEach((row) => {
        const productId = asString(row.product_id);
        const imagePath = asString(row.image);
        if (!productId || !imagePath) return;
        const list = additionalImagesByProduct.get(productId) || [];
        list.push(imagePath);
        additionalImagesByProduct.set(productId, list);
    });

    const specialsByProduct = new Map<string, RowRecord>();
    specialsRows.forEach((row) => {
        const productId = asString(row.product_id);
        if (!productId || specialsByProduct.has(productId)) return;
        specialsByProduct.set(productId, row);
    });

    const seoByProduct = new Map<string, string>();
    productSeoRows.forEach((row) => {
        const productId = asString(row.product_id);
        const keyword = asString(row['keyword(en-gb)']);
        if (!productId || !keyword || seoByProduct.has(productId)) return;
        seoByProduct.set(productId, keyword);
    });

    const productOptionNamesByProduct = new Map<string, string[]>();
    productOptionsRows.forEach((row) => {
        const productId = asString(row.product_id);
        const optionName = asString(row.option);
        if (!productId || !optionName) return;
        const existing = productOptionNamesByProduct.get(productId) || [];
        existing.push(optionName);
        productOptionNamesByProduct.set(productId, dedupeStrings(existing));
    });

    const productOptionValuesByProduct = new Map<string, Map<string, string[]>>();
    productOptionValuesRows.forEach((row) => {
        const productId = asString(row.product_id);
        const optionName = asString(row.option);
        const optionValueLabel = asString(row.option_value);
        if (!productId || !optionName || !optionValueLabel) return;

        const optionMap = productOptionValuesByProduct.get(productId) || new Map<string, string[]>();
        const existing = optionMap.get(optionName) || [];
        existing.push(optionValueLabel);
        optionMap.set(optionName, dedupeStrings(existing));
        productOptionValuesByProduct.set(productId, optionMap);
    });

    const productAttributesByProduct = new Map<string, Array<{ attributeId: string; value: string }>>();
    productAttributesRows.forEach((row) => {
        const productId = asString(row.product_id);
        const attributeId = asString(row.attribute_id);
        const value = asString(row['text(en-gb)']);
        if (!productId || !attributeId || !value) return;
        const existing = productAttributesByProduct.get(productId) || [];
        existing.push({ attributeId, value });
        productAttributesByProduct.set(productId, existing);
    });

    // Build brands from manufacturer values in products file.
    const manufacturerNames = dedupeStrings(productsRows.map((row) => asString(row.manufacturer)));
    const brandByName = new Map<string, Types.ObjectId>();

    for (const manufacturer of manufacturerNames) {
        const baseSlug = slugify(manufacturer);
        let brand = await Brand.findOne({ storeId, slug: baseSlug });
        if (!brand) {
            const uniqueSlug = await ensureUniqueSlug(Brand, storeId, baseSlug);
            brand = new Brand({
                storeId,
                name: manufacturer,
                slug: uniqueSlug,
                isActive: true,
            });
            if (!args.dryRun) {
                await brand.save();
            }
            stats.brandsCreated += 1;
        }
        brandByName.set(manufacturer, brand._id as Types.ObjectId);
    }

    // Build ProductOption definitions from options file.
    const optionValuesByOptionId = new Map<string, RowRecord[]>();
    optionValuesRows.forEach((row) => {
        const optionId = asString(row.option_id);
        if (!optionId) return;
        const list = optionValuesByOptionId.get(optionId) || [];
        list.push(row);
        optionValuesByOptionId.set(optionId, list);
    });

    const optionIdByName = new Map<string, Types.ObjectId>();
    const optionValueCodeByOptionName = new Map<string, Map<string, string>>();

    for (const optionRow of optionsRows) {
        const optionId = asString(optionRow.option_id);
        const optionName = asString(optionRow['name(en-gb)']);
        if (!optionId || !optionName) continue;

        const openCartType = asString(optionRow.type);
        const localType = resolveOptionType(openCartType, optionName);
        const valueRows = optionValuesByOptionId.get(optionId) || [];
        const values = dedupeStrings(valueRows.map((row) => asString(row['name(en-gb)'])))
            .map((label) => ({ label, value: slugify(label) }));

        let optionDoc = await ProductOption.findOne({ storeId, name: optionName });
        if (!optionDoc) {
            const uniqueSlug = await ensureUniqueSlug(ProductOption, storeId, optionName);
            optionDoc = new ProductOption({
                storeId,
                name: optionName,
                slug: uniqueSlug,
                type: localType,
                values,
                sortOrder: asNumber(optionRow.sort_order) || 0,
                isFilterable: true,
            });
            if (!args.dryRun) {
                await optionDoc.save();
            }
            stats.optionsCreated += 1;
        } else {
            optionDoc.type = localType;
            optionDoc.sortOrder = asNumber(optionRow.sort_order) || optionDoc.sortOrder || 0;

            const existingOptionDoc = optionDoc;
            const existingValues = new Map(existingOptionDoc.values.map((entry) => [entry.label.toLowerCase(), entry]));
            values.forEach((value) => {
                if (!existingValues.has(value.label.toLowerCase())) {
                    existingOptionDoc.values.push(value);
                }
            });

            if (!args.dryRun) {
                await existingOptionDoc.save();
            }
            stats.optionsUpdated += 1;
        }

        if (!optionDoc) continue;

        optionIdByName.set(optionName, optionDoc._id as Types.ObjectId);
        const valueMap = new Map<string, string>();
        optionDoc.values.forEach((value) => valueMap.set(value.label.toLowerCase(), value.value));
        optionValueCodeByOptionName.set(optionName, valueMap);
    }

    // Build Attribute definitions from attributes file.
    const attributeObjectIdByOpenCartId = new Map<string, Types.ObjectId>();
    for (const attributeRow of attributesRows) {
        const openCartAttributeId = asString(attributeRow.attribute_id);
        const attributeName = asString(attributeRow['name(en-gb)']);
        if (!openCartAttributeId || !attributeName) continue;

        let attributeDoc = await Attribute.findOne({ storeId, name: attributeName });
        if (!attributeDoc) {
            const uniqueSlug = await ensureUniqueSlug(Attribute, storeId, attributeName);
            attributeDoc = new Attribute({
                storeId,
                name: attributeName,
                slug: uniqueSlug,
                type: 'text',
                isFilterable: true,
                isComparable: true,
                isRequired: false,
                sortOrder: asNumber(attributeRow.sort_order) || 0,
            });
            if (!args.dryRun) {
                await attributeDoc.save();
            }
            stats.attributesCreated += 1;
        } else {
            attributeDoc.sortOrder = asNumber(attributeRow.sort_order) || attributeDoc.sortOrder || 0;
            if (!args.dryRun) {
                await attributeDoc.save();
            }
            stats.attributesUpdated += 1;
        }

        attributeObjectIdByOpenCartId.set(openCartAttributeId, attributeDoc._id as Types.ObjectId);
    }

    for (const row of productsRows) {
        const openCartProductId = asString(row.product_id);
        const name = asString(row['name(en-gb)']);
        const sku = asString(row.sku) || asString(row.model) || `OC-${openCartProductId}`;

        if (!name || !sku) {
            warnings.add(`Skipping product ${openCartProductId}: missing required name/sku`);
            stats.productsSkipped += 1;
            continue;
        }

        const existingProduct = await Product.findOne({ sku });
        if (existingProduct && existingProduct.storeId.toString() !== storeId.toString()) {
            warnings.add(`Skipping SKU ${sku}: exists in another store (${existingProduct.storeId.toString()})`);
            stats.productsSkipped += 1;
            continue;
        }

        const preferredSlug = seoByProduct.get(openCartProductId) || name;
        const uniqueSlug = await ensureUniqueSlug(
            Product,
            storeId,
            preferredSlug,
            existingProduct ? (existingProduct._id as Types.ObjectId) : undefined
        );

        const basePrice = asNumber(row.price) || 0;
        const quantity = asNumber(row.quantity) || 0;
        const isActive = asBoolean(row.status) ?? true;
        const canSubtractStock = asBoolean(row.subtract) ?? true;

        const tags = dedupeStrings(splitCsv(row['tags(en-gb)']));

        const mappedCategoryIds = splitCsv(row.categories)
            .map((openCartCategoryId) => categoryMap[openCartCategoryId])
            .filter((id): id is Types.ObjectId => Boolean(id));

        splitCsv(row.categories).forEach((openCartCategoryId) => {
            if (!categoryMap[openCartCategoryId]) {
                warnings.add(`Product ${openCartProductId}: no category map for OpenCart category ${openCartCategoryId}`);
            }
        });

        const mainImage = normalizeImagePath(asString(row.image_name), args.imageBaseUrl);
        const extraImages = (additionalImagesByProduct.get(openCartProductId) || [])
            .map((img) => normalizeImagePath(img, args.imageBaseUrl));
        const images = dedupeStrings([mainImage, ...extraImages].filter(Boolean));

        const special = specialsByProduct.get(openCartProductId);
        const specialPrice = special ? asNumber(special.price) : undefined;
        const salePrice = specialPrice !== undefined && specialPrice < basePrice ? specialPrice : undefined;
        const salePriceStartDate = special ? parseDate(special.date_start) : undefined;
        const salePriceEndDate = special ? parseDate(special.date_end) : undefined;

        const optionNames = dedupeStrings([
            ...(productOptionNamesByProduct.get(openCartProductId) || []),
            ...Array.from(productOptionValuesByProduct.get(openCartProductId)?.keys() || []),
        ]);

        const productOptions = optionNames
            .map((optionName) => {
                const optionId = optionIdByName.get(optionName);
                if (!optionId) {
                    warnings.add(`Product ${openCartProductId}: option "${optionName}" not found in options workbook`);
                    return null;
                }

                const labels = productOptionValuesByProduct.get(openCartProductId)?.get(optionName) || [];
                const valueMap = optionValueCodeByOptionName.get(optionName) || new Map<string, string>();
                const mappedValues = dedupeStrings(labels.map((label) => valueMap.get(label.toLowerCase()) || slugify(label)));

                return {
                    optionId,
                    values: mappedValues,
                    isVariation: true,
                };
            })
            .filter((item): item is { optionId: Types.ObjectId; values: string[]; isVariation: boolean } => Boolean(item));

        const productAttributes = productAttributesByProduct.get(openCartProductId) || [];
        const specifications = productAttributes
            .map((entry) => {
                const attributeId = attributeObjectIdByOpenCartId.get(entry.attributeId);
                if (!attributeId) {
                    warnings.add(`Product ${openCartProductId}: attribute ${entry.attributeId} missing in attributes workbook`);
                    return null;
                }
                return { attributeId, value: entry.value };
            })
            .filter((item): item is { attributeId: Types.ObjectId; value: string } => Boolean(item));

        const legacyAttributes = specifications.map((spec) => ({
            attributeId: spec.attributeId,
            values: [spec.value],
            isVariation: false,
        }));

        const manufacturer = asString(row.manufacturer);
        const brandId = manufacturer ? brandByName.get(manufacturer) : undefined;

        const productPayload = {
            storeId,
            name: truncate(name, 200),
            slug: uniqueSlug,
            description: asString(row['description(en-gb)']) || name,
            shortDescription: (asString(row['meta_description(en-gb)']) || '').slice(0, 500) || undefined,
            type: (productOptions.length > 0 ? 'variable' : 'simple') as 'simple' | 'variable',
            sku,
            price: basePrice,
            salePrice,
            salePriceStartDate,
            salePriceEndDate,
            stock: Math.max(0, quantity),
            manageStock: canSubtractStock,
            stockStatus: quantity > 0 ? 'in_stock' : 'out_of_stock',
            weight: asNumber(row.weight) || undefined,
            dimensions: {
                length: asNumber(row.length) || undefined,
                width: asNumber(row.width) || undefined,
                height: asNumber(row.height) || undefined,
                unit: asString(row.length_unit) === 'in' ? 'in' : 'cm',
            },
            images,
            featuredImage: images[0] || undefined,
            categoryIds: mappedCategoryIds,
            tags,
            brand: brandId,
            seo: {
                metaTitle: truncate(asString(row['meta_title(en-gb)']), 60) || undefined,
                metaDescription: truncate(asString(row['meta_description(en-gb)']), 160) || undefined,
                metaKeywords: dedupeStrings(splitCsv(row['meta_keywords(en-gb)'])),
            },
            isActive,
            isFeatured: false,
            productOptions,
            specifications,
            attributes: legacyAttributes,
            downloadable: false,
        } as Record<string, unknown>;

        if (args.dryRun) {
            if (existingProduct) {
                stats.productsUpdated += 1;
            } else {
                stats.productsCreated += 1;
            }
            continue;
        }

        if (existingProduct) {
            Object.assign(existingProduct, productPayload);
            await existingProduct.save();
            stats.productsUpdated += 1;
        } else {
            const productDoc = new Product(productPayload);
            await productDoc.save();
            stats.productsCreated += 1;
        }
    }

    console.log('\nImport completed.\n');
    console.table(stats);

    if (warnings.size > 0) {
        console.log(`\nWarnings (${warnings.size}):`);
        Array.from(warnings).slice(0, 100).forEach((warning) => console.log(`- ${warning}`));
        if (warnings.size > 100) {
            console.log(`... ${warnings.size - 100} more warnings`);
        }
    }
}

async function main(): Promise<void> {
    try {
        const args = parseArgs(process.argv.slice(2));
        console.log(`Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE IMPORT'}`);
        await runImport(args);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Import failed: ${message}`);
        process.exitCode = 1;
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

main();
