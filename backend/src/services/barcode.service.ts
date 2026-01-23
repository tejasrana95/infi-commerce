import bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';
import Product from '../models/Product';
import mongoose from 'mongoose';

// Label sizes for thermal/label printers (dimensions in points, 72 points = 1 inch)
const LABEL_SIZES: Record<string, { width: number; height: number; name: string }> = {
    'small': { width: 72, height: 36, name: '1" × 0.5"' },           // 25mm × 13mm - Jewelry
    'standard': { width: 144, height: 72, name: '2" × 1"' },         // 50mm × 25mm - Common retail
    'medium': { width: 162, height: 90, name: '2.25" × 1.25"' },     // 57mm × 32mm - Standard retail
    'large': { width: 216, height: 144, name: '3" × 2"' },           // 76mm × 50mm - Larger products
    'xl': { width: 288, height: 144, name: '4" × 2"' },              // 100mm × 50mm - Big items
    'shipping': { width: 288, height: 432, name: '4" × 6"' },        // 100mm × 150mm - Shipping labels
};

// Page sizes for regular printers
const PAGE_SIZES: Record<string, { width: number; height: number; name: string }> = {
    'a4': { width: 595, height: 842, name: 'A4' },
    'letter': { width: 612, height: 792, name: 'Letter' },
    'a5': { width: 420, height: 595, name: 'A5' },
    'legal': { width: 612, height: 1008, name: 'Legal' },
};

// Grid layouts for regular printer sheets
const GRID_LAYOUTS: Record<string, { cols: number; rows: number; name: string }> = {
    '2x3': { cols: 2, rows: 3, name: '2×3 (6 per sheet)' },
    '2x4': { cols: 2, rows: 4, name: '2×4 (8 per sheet)' },
    '3x4': { cols: 3, rows: 4, name: '3×4 (12 per sheet)' },
    '3x5': { cols: 3, rows: 5, name: '3×5 (15 per sheet)' },
    '4x6': { cols: 4, rows: 6, name: '4×6 (24 per sheet)' },
    '4x8': { cols: 4, rows: 8, name: '4×8 (32 per sheet)' },
};

// Barcode data interface
interface BarcodeData {
    name: string;
    sku: string;
    barcode: string;
    price?: number;
    image: Buffer;
}

// Print options interface
interface PrintOptions {
    printerType: 'label' | 'regular';
    // For label printers
    labelSize?: string;
    // For regular printers
    pageSize?: string;
    layout?: string;
    // Common options
    format?: 'CODE128' | 'EAN13' | 'QR';
    quantities?: { productId: string; quantity: number }[];
    repeatToFill?: boolean;
    includeName?: boolean;
    includePrice?: boolean;
    includeSku?: boolean;
}

class BarcodeService {
    /**
     * Generate barcode image buffer
     */
    async generateBarcodeImage(
        text: string,
        format: string = 'CODE128',
        height: number = 10
    ): Promise<Buffer> {
        try {
            // Normalize format to lowercase for lookup
            let normalizedFormat = format.toLowerCase();

            // Validate EAN-13 format - must be 12 or 13 digits only
            if (normalizedFormat === 'ean13') {
                const digitsOnly = text.replace(/\D/g, '');
                if (digitsOnly.length !== 12 && digitsOnly.length !== 13) {
                    console.warn(`EAN-13 requires 12-13 digits, got "${text}". Falling back to CODE128.`);
                    normalizedFormat = 'code128';
                } else {
                    // Use only digits for EAN-13
                    text = digitsOnly;
                }
            }

            // Map format to bwip-js bcid
            const formatMap: Record<string, string> = {
                'code128': 'code128',
                'ean13': 'ean13',
                'qr': 'qrcode',
                'qrcode': 'qrcode',
            };

            const bcid = formatMap[normalizedFormat] || 'code128';
            const isQR = normalizedFormat === 'qr' || normalizedFormat === 'qrcode';

            const options: any = {
                bcid: bcid,
                text: text,
                scale: 2,
            };

            if (isQR) {
                // QR code options
                options.width = 20;
                options.height = 20;
            } else {
                // Linear barcode options
                options.height = height;
                options.includetext = true;
                options.textxalign = 'center';
                options.textsize = 8;
            }

            const buffer = await bwipjs.toBuffer(options);
            return buffer;
        } catch (error) {
            console.error('Barcode generation error:', error);
            throw new Error(`Failed to generate barcode: ${error}`);
        }
    }

    /**
     * Generate barcode(s) for a product
     * For variable products, returns barcodes for all variants
     */
    async generateProductBarcode(
        productId: mongoose.Types.ObjectId,
        format?: string
    ): Promise<Array<{ name: string; sku: string; barcode: string; image: string }>> {
        const product = await Product.findById(productId).populate('storeId');

        if (!product) {
            throw new Error('Product not found');
        }

        const store: any = product.storeId;
        const settings = store?.posSettings?.barcodeSettings || {};
        const barcodeFormat = format || settings.format || 'CODE128';

        const results: Array<{ name: string; sku: string; barcode: string; image: string }> = [];

        // Check if product is variable and has variants
        if (product.type === 'variable' && product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
                // Build variant name: ProductName + attribute values
                const attributeValues = variant.attributes
                    ? Object.values(variant.attributes).join(' ')
                    : '';
                const variantName = attributeValues
                    ? `${product.name} ${attributeValues}`
                    : product.name;

                const barcodeText = variant.sku || product.sku;

                try {
                    const image = await this.generateBarcodeImage(
                        barcodeText,
                        barcodeFormat,
                        10
                    );

                    const base64Image = image.toString('base64');
                    const dataUrl = `data:image/png;base64,${base64Image}`;

                    results.push({
                        name: variantName,
                        sku: variant.sku || product.sku,
                        barcode: barcodeText,
                        image: dataUrl,
                    });
                } catch (error) {
                    console.error(`Failed to generate barcode for variant ${variant.sku}:`, error);
                }
            }
        } else {
            // Simple or digital product
            const barcodeText = product.barcode || product.sku;

            const image = await this.generateBarcodeImage(
                barcodeText,
                barcodeFormat,
                10
            );

            const base64Image = image.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            results.push({
                name: product.name,
                sku: product.sku,
                barcode: barcodeText,
                image: dataUrl,
            });
        }

        // Mark barcode as generated
        product.barcodeGenerated = true;
        await product.save();

        return results;
    }

    /**
     * Bulk generate barcodes for multiple products
     */
    async bulkGenerateBarcodes(
        productIds: mongoose.Types.ObjectId[]
    ): Promise<Array<{ productId: mongoose.Types.ObjectId; name: string; sku: string; barcode: string; image: string; error?: string }>> {
        const results: Array<{ productId: mongoose.Types.ObjectId; name: string; sku: string; barcode: string; image: string; error?: string }> = [];

        for (const productId of productIds) {
            try {
                const variantResults = await this.generateProductBarcode(productId);
                for (const result of variantResults) {
                    results.push({
                        productId,
                        ...result
                    });
                }
            } catch (error: any) {
                results.push({
                    productId,
                    name: '',
                    sku: '',
                    barcode: '',
                    image: '',
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * Collect barcode data from products with quantities
     */
    private async collectBarcodeData(
        productIds: mongoose.Types.ObjectId[],
        format: string,
        quantities?: { productId: string; quantity: number }[]
    ): Promise<BarcodeData[]> {
        const barcodes: BarcodeData[] = [];
        const quantityMap = new Map(quantities?.map(q => [q.productId, q.quantity]) || []);

        for (const productId of productIds) {
            const product = await Product.findById(productId);
            if (!product) continue;

            const quantity = quantityMap.get(productId.toString()) || 1;

            // Check if product is variable and has variants
            if (product.type === 'variable' && product.variants && product.variants.length > 0) {
                for (const variant of product.variants) {
                    const attributeValues = variant.attributes
                        ? Object.values(variant.attributes).join(' ')
                        : '';
                    const variantName = attributeValues
                        ? `${product.name} ${attributeValues}`
                        : product.name;

                    const barcodeText = variant.sku || product.sku;

                    try {
                        const image = await this.generateBarcodeImage(barcodeText, format, 10);

                        // Add the barcode 'quantity' times
                        for (let i = 0; i < quantity; i++) {
                            barcodes.push({
                                name: variantName,
                                sku: variant.sku || product.sku,
                                barcode: barcodeText,
                                price: variant.price || product.price,
                                image,
                            });
                        }
                    } catch (error) {
                        console.error(`Failed to generate barcode for variant ${variant.sku}:`, error);
                    }
                }
            } else {
                const barcodeText = product.barcode || product.sku;

                try {
                    const image = await this.generateBarcodeImage(barcodeText, format, 10);

                    // Add the barcode 'quantity' times
                    for (let i = 0; i < quantity; i++) {
                        barcodes.push({
                            name: product.name,
                            sku: product.sku,
                            barcode: barcodeText,
                            price: product.price,
                            image,
                        });
                    }
                } catch (error) {
                    console.error(`Failed to generate barcode for product ${productId}:`, error);
                }
            }
        }

        return barcodes;
    }

    /**
     * Generate PDF for label/thermal printers
     * Each label is on its own page with page size matching the label
     */
    async generateLabelPrinterPDF(
        productIds: mongoose.Types.ObjectId[],
        options: PrintOptions
    ): Promise<Buffer> {
        const labelSize = LABEL_SIZES[options.labelSize || 'standard'];
        if (!labelSize) {
            throw new Error(`Invalid label size: ${options.labelSize}`);
        }

        const format = options.format || 'CODE128';
        const barcodes = await this.collectBarcodeData(productIds, format, options.quantities);

        if (barcodes.length === 0) {
            throw new Error('No barcodes to generate');
        }

        return new Promise((resolve, reject) => {
            // Create PDF with page size matching the label
            const doc = new PDFDocument({
                size: [labelSize.width, labelSize.height],
                margin: 2,
            });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const padding = 4;
            const usableWidth = labelSize.width - (padding * 2);
            const usableHeight = labelSize.height - (padding * 2);

            for (let i = 0; i < barcodes.length; i++) {
                if (i > 0) {
                    doc.addPage();
                }

                const barcode = barcodes[i];
                let yOffset = padding;

                // Calculate dynamic sizing based on label size
                const isSmallLabel = labelSize.height < 50;
                const isMediumLabel = labelSize.height < 100;

                // Draw product name (if enabled and space permits)
                if (options.includeName !== false && !isSmallLabel) {
                    const nameSize = isMediumLabel ? 6 : 8;
                    const displayName = barcode.name.length > 25
                        ? barcode.name.substring(0, 25) + '...'
                        : barcode.name;
                    doc.fontSize(nameSize).text(displayName, padding, yOffset, {
                        width: usableWidth,
                        align: 'center',
                        height: nameSize + 2,
                    });
                    yOffset += nameSize + 4;
                }

                // Draw barcode image
                const barcodeMaxHeight = usableHeight - yOffset - (isSmallLabel ? 10 : 20);
                const barcodeHeight = Math.min(barcodeMaxHeight, usableHeight * 0.5);

                doc.image(barcode.image, padding, yOffset, {
                    fit: [usableWidth, barcodeHeight],
                    align: 'center',
                    valign: 'center',
                });
                yOffset += barcodeHeight + 2;

                // Draw SKU (if enabled)
                if (options.includeSku !== false) {
                    const skuSize = isSmallLabel ? 5 : 6;
                    doc.fontSize(skuSize).text(barcode.sku, padding, yOffset, {
                        width: usableWidth,
                        align: 'center',
                    });
                    yOffset += skuSize + 2;
                }

                // Draw price (if enabled)
                if (options.includePrice && barcode.price && !isSmallLabel) {
                    const priceSize = isMediumLabel ? 6 : 7;
                    doc.fontSize(priceSize).text(`$${barcode.price.toFixed(2)}`, padding, yOffset, {
                        width: usableWidth,
                        align: 'center',
                    });
                }
            }

            doc.end();
        });
    }

    /**
     * Generate printable barcode sheet as PDF for regular printers
     */
    async generateBarcodeSheet(
        productIds: mongoose.Types.ObjectId[],
        options: PrintOptions
    ): Promise<Buffer> {
        const pageSize = PAGE_SIZES[options.pageSize || 'letter'];
        const layout = GRID_LAYOUTS[options.layout || '3x4'];

        if (!pageSize) {
            throw new Error(`Invalid page size: ${options.pageSize}`);
        }
        if (!layout) {
            throw new Error(`Invalid layout: ${options.layout}`);
        }

        const format = options.format || 'CODE128';
        let barcodes = await this.collectBarcodeData(productIds, format, options.quantities);

        if (barcodes.length === 0) {
            throw new Error('No barcodes to generate');
        }

        const labelsPerPage = layout.cols * layout.rows;

        // Repeat to fill page if enabled
        if (options.repeatToFill && barcodes.length < labelsPerPage) {
            const originalBarcodes = [...barcodes];
            while (barcodes.length < labelsPerPage) {
                barcodes.push(originalBarcodes[barcodes.length % originalBarcodes.length]);
            }
        }

        // Calculate label dimensions
        const margin = 20;
        const labelSpacing = 4;
        const labelWidth = (pageSize.width - (margin * 2) - ((layout.cols - 1) * labelSpacing)) / layout.cols;
        const labelHeight = (pageSize.height - (margin * 2) - ((layout.rows - 1) * labelSpacing)) / layout.rows;

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: [pageSize.width, pageSize.height],
                margin: 0,
            });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            let labelIndex = 0;

            for (const barcode of barcodes) {
                // Add new page if needed
                if (labelIndex > 0 && labelIndex % labelsPerPage === 0) {
                    doc.addPage();
                }

                const pageIndex = labelIndex % labelsPerPage;
                const col = pageIndex % layout.cols;
                const row = Math.floor(pageIndex / layout.cols);

                const x = margin + col * (labelWidth + labelSpacing);
                const y = margin + row * (labelHeight + labelSpacing);

                // Draw label border (cutting guides)
                doc.rect(x, y, labelWidth, labelHeight).stroke('#e0e0e0');

                const padding = 4;
                let yOffset = y + padding;

                // Draw product name (if enabled)
                if (options.includeName !== false) {
                    const displayName = barcode.name.length > 20
                        ? barcode.name.substring(0, 20) + '...'
                        : barcode.name;
                    doc.fontSize(8).text(displayName, x + padding, yOffset, {
                        width: labelWidth - (padding * 2),
                        align: 'center',
                    });
                    yOffset += 12;
                }

                // Draw barcode image
                const imgWidth = labelWidth - 20;
                const imgHeight = labelHeight - 60;
                doc.image(barcode.image, x + 10, yOffset, {
                    fit: [imgWidth, imgHeight],
                    align: 'center',
                    valign: 'center',
                });
                yOffset += imgHeight + 4;

                // Draw SKU (if enabled)
                if (options.includeSku !== false) {
                    doc.fontSize(7).text(`SKU: ${barcode.sku}`, x + padding, yOffset, {
                        width: labelWidth - (padding * 2),
                        align: 'center',
                    });
                    yOffset += 10;
                }

                // Draw price (if enabled)
                if (options.includePrice && barcode.price) {
                    doc.fontSize(7).text(`$${barcode.price.toFixed(2)}`, x + padding, yOffset, {
                        width: labelWidth - (padding * 2),
                        align: 'center',
                    });
                }

                labelIndex++;
            }

            doc.end();
        });
    }

    /**
     * Main entry point for generating print-ready PDF
     */
    async generatePrintPDF(
        productIds: mongoose.Types.ObjectId[],
        options: PrintOptions
    ): Promise<Buffer> {
        if (options.printerType === 'label') {
            return this.generateLabelPrinterPDF(productIds, options);
        } else {
            return this.generateBarcodeSheet(productIds, options);
        }
    }

    /**
     * Get available label sizes
     */
    getLabelSizes(): Array<{ key: string; name: string; width: number; height: number }> {
        return Object.entries(LABEL_SIZES).map(([key, value]) => ({
            key,
            ...value,
        }));
    }

    /**
     * Get available page sizes
     */
    getPageSizes(): Array<{ key: string; name: string; width: number; height: number }> {
        return Object.entries(PAGE_SIZES).map(([key, value]) => ({
            key,
            ...value,
        }));
    }

    /**
     * Get available grid layouts
     */
    getGridLayouts(): Array<{ key: string; name: string; cols: number; rows: number }> {
        return Object.entries(GRID_LAYOUTS).map(([key, value]) => ({
            key,
            ...value,
        }));
    }

    /**
     * Get supported barcode formats
     */
    getSupportedFormats(): string[] {
        return ['CODE128', 'EAN13', 'QR'];
    }
}

export default new BarcodeService();
