import { Request, Response } from 'express';
import barcodeService from '../services/barcode.service';
import mongoose from 'mongoose';

class BarcodeController {
    /**
     * POST /api/barcode/generate
     * Generate barcode image(s) from product ID
     * For variable products, returns barcodes for all variants
     */
    async generateBarcode(req: Request, res: Response) {
        try {
            const { productId, format } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required',
                });
            }

            const results = await barcodeService.generateProductBarcode(
                new mongoose.Types.ObjectId(productId),
                format
            );

            return res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error: any) {
            console.error('Generate barcode error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate barcode',
            });
        }
    }

    /**
     * POST /api/admin/barcode/bulk-generate
     * Bulk generate barcodes
     */
    async bulkGenerateBarcodes(req: Request, res: Response) {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Product IDs array is required',
                });
            }

            const results = await barcodeService.bulkGenerateBarcodes(
                productIds.map((id: string) => new mongoose.Types.ObjectId(id))
            );

            return res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error: any) {
            console.error('Bulk generate barcodes error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to bulk generate barcodes',
            });
        }
    }

    /**
     * GET /api/admin/barcode/download/:productId
     * Download barcode image as PNG
     */
    async downloadBarcode(req: Request, res: Response) {
        try {
            const { productId } = req.params;

            const results = await barcodeService.generateProductBarcode(
                new mongoose.Types.ObjectId(productId)
            );

            if (!results || results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Barcode not found',
                });
            }

            // For now, take the first one (appropriate for simple products)
            const result = results[0];

            // Convert base64 data URL to buffer
            const base64Data = result.image.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Send as downloadable PNG file
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="barcode-${result.sku}.png"`);
            return res.send(buffer);
        } catch (error: any) {
            console.error('Download barcode error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to download barcode',
            });
        }
    }

    /**
     * POST /api/barcode/print-batch
     * Generate printable barcode PDF with advanced options
     * 
     * Request body:
     * - productIds: string[] (required)
     * - printerType: 'label' | 'regular' (default: 'regular')
     * - labelSize: string (for label printers: 'small', 'standard', 'medium', 'large', 'xl', 'shipping')
     * - pageSize: string (for regular printers: 'a4', 'letter', 'a5', 'legal')
     * - layout: string (for regular printers: '2x3', '2x4', '3x4', '3x5', '4x6', '4x8')
     * - format: 'CODE128' | 'EAN13' | 'QR' (default: 'CODE128')
     * - quantities: { productId: string, quantity: number }[]
     * - repeatToFill: boolean (default: false)
     * - includeName: boolean (default: true)
     * - includePrice: boolean (default: false)
     * - includeSku: boolean (default: true)
     */
    async generateBarcodeSheet(req: Request, res: Response) {
        try {
            const {
                productIds,
                printerType = 'regular',
                labelSize = 'standard',
                pageSize = 'letter',
                layout = '3x4',
                format = 'CODE128',
                quantities,
                repeatToFill = false,
                includeName = true,
                includePrice = false,
                includeSku = true,
            } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Product IDs array is required',
                });
            }

            const pdfBuffer = await barcodeService.generatePrintPDF(
                productIds.map((id: string) => new mongoose.Types.ObjectId(id)),
                {
                    printerType,
                    labelSize,
                    pageSize,
                    layout,
                    format,
                    quantities,
                    repeatToFill,
                    includeName,
                    includePrice,
                    includeSku,
                }
            );

            // Generate filename based on printer type
            const filename = printerType === 'label'
                ? `labels-${labelSize}-${Date.now()}.pdf`
                : `barcodes-${layout}-${Date.now()}.pdf`;

            // Send PDF as downloadable file
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.send(pdfBuffer);
        } catch (error: any) {
            console.error('Generate barcode sheet error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate barcode sheet',
            });
        }
    }

    /**
     * GET /api/barcode/print-options
     * Get available print options (label sizes, page sizes, layouts, formats)
     */
    getPrintOptions(_req: Request, res: Response) {
        return res.status(200).json({
            success: true,
            data: {
                labelSizes: barcodeService.getLabelSizes(),
                pageSizes: barcodeService.getPageSizes(),
                gridLayouts: barcodeService.getGridLayouts(),
                barcodeFormats: barcodeService.getSupportedFormats(),
            },
        });
    }

    /**
     * GET /api/admin/barcode/formats
     * Get supported barcode formats
     */
    getSupportedFormats(_req: Request, res: Response) {
        const formats = barcodeService.getSupportedFormats();

        return res.status(200).json({
            success: true,
            data: formats,
        });
    }
}

export default new BarcodeController();
