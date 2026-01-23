import { Request, Response } from 'express';
import barcodeService from '../services/barcode.service';
import mongoose from 'mongoose';

class BarcodeController {
    /**
     * POST /api/admin/barcode/generate
     * Generate barcode image from product ID
     */
    async generateBarcode(req: Request, res: Response) {
        try {
            const { productId } = req.body;

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required',
                });
            }

            const result = await barcodeService.generateProductBarcode(
                new mongoose.Types.ObjectId(productId)
            );

            // Return barcode as base64 data URL for easy embedding
            const base64Image = result.image.toString('base64');
            const dataUrl = `data:image/png;base64,${base64Image}`;

            res.status(200).json({
                success: true,
                data: {
                    barcode: result.barcode,
                    image: dataUrl,
                },
            });
        } catch (error: any) {
            console.error('Generate barcode error:', error);
            res.status(500).json({
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

            res.status(200).json({
                success: true,
                data: results,
            });
        } catch (error: any) {
            console.error('Bulk generate barcodes error:', error);
            res.status(500).json({
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

            const result = await barcodeService.generateProductBarcode(
                new mongoose.Types.ObjectId(productId)
            );

            // Send as downloadable PNG file
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="barcode-${result.barcode}.png"`);
            res.send(result.image);
        } catch (error: any) {
            console.error('Download barcode error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to download barcode',
            });
        }
    }

    /**
     * POST /api/admin/barcode/print-batch
     * Generate printable barcode sheet
     */
    async generateBarcodeSheet(req: Request, res: Response) {
        try {
            const { productIds, layout = '3x4' } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Product IDs array is required',
                });
            }

            const result = await barcodeService.generateBarcodeSheet(
                productIds.map((id: string) => new mongoose.Types.ObjectId(id)),
                layout
            );

            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            console.error('Generate barcode sheet error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate barcode sheet',
            });
        }
    }

    /**
     * GET /api/admin/barcode/formats
     * Get supported barcode formats
     */
    getSupportedFormats(req: Request, res: Response) {
        const formats = barcodeService.getSupportedFormats();

        res.status(200).json({
            success: true,
            data: formats,
        });
    }
}

export default new BarcodeController();
