import bwipjs from 'bwip-js';
import Product from '../models/Product';
import Store from '../models/Store';
import mongoose from 'mongoose';

class BarcodeService {
    /**
     * Generate barcode image buffer
     */
    async generateBarcodeImage(
        text: string,
        format: 'CODE128' | 'EAN13' | 'QR' = 'CODE128',
        width: number = 40,
        height: number = 30
    ): Promise<Buffer> {
        try {
            const buffer = await bwipjs.toBuffer({
                bcid: format.toLowerCase().replace('code', 'code'),  // Convert format name
                text: text,
                scale: 3,
                height: height,
                width: width || undefined,
                includetext: true,
                textxalign: 'center',
            });

            return buffer;
        } catch (error) {
            console.error('Barcode generation error:', error);
            throw new Error('Failed to generate barcode');
        }
    }

    /**
     * Generate barcode for a product
     */
    async generateProductBarcode(
        productId: mongoose.Types.ObjectId
    ): Promise<{ barcode: string; image: Buffer }> {
        const product = await Product.findById(productId).populate('storeId');

        if (!product) {
            throw new Error('Product not found');
        }

        const store: any = product.storeId;
        const settings = store.posSettings?.barcodeSettings || {};

        // Use existing barcode or SKU
        const barcodeText = product.barcode || product.sku;

        const image = await this.generateBarcodeImage(
            barcodeText,
            settings.format || 'CODE128',
            settings.printWidth || 40,
            settings.printHeight || 30
        );

        // Mark barcode as generated
        product.barcodeGenerated = true;
        await product.save();

        return {
            barcode: barcodeText,
            image,
        };
    }

    /**
     * Bulk generate barcodes for multiple products
     */
    async bulkGenerateBarcodes(
        productIds: mongoose.Types.ObjectId[]
    ): Promise<Array<{ productId: mongoose.Types.ObjectId; barcode: string; error?: string }>> {
        const results: Array<{ productId: mongoose.Types.ObjectId; barcode: string; error?: string }> = [];

        for (const productId of productIds) {
            try {
                const result = await this.generateProductBarcode(productId);
                results.push({
                    productId,
                    barcode: result.barcode,
                });
            } catch (error: any) {
                results.push({
                    productId,
                    barcode: '',
                    error: error.message,
                });
            }
        }

        return results;
    }

    /**
     * Generate printable barcode sheet (multiple barcodes on one page)
     */
    async generateBarcodeSheet(
        productIds: mongoose.Types.ObjectId[],
        layout: '2x3' | '3x4' | '4x5' = '3x4'
    ): Promise<any> {
        const barcodes: any[] = [];

        for (const productId of productIds) {
            const product = await Product.findById(productId).populate('storeId');
            if (!product) continue;

            const store: any = product.storeId;
            const settings = store.posSettings?.barcodeSettings || {};

            const barcodeText = product.barcode || product.sku;
            const image = await this.generateBarcodeImage(
                barcodeText,
                settings.format || 'CODE128',
                settings.printWidth || 40,
                settings.printHeight || 30
            );

            barcodes.push({
                productId: product._id,
                name: product.name,
                sku: product.sku,
                barcode: barcodeText,
                image: image.toString('base64'),
            });
        }

        return {
            layout,
            barcodes,
        };
    }

    /**
     * Get supported barcode formats
     */
    getSupportedFormats(): string[] {
        return ['CODE128', 'EAN13', 'QR'];
    }
}

export default new BarcodeService();
