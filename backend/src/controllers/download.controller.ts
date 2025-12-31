import { Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import Order from '../models/Order';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

/**
 * @swagger
 * /api/downloads:
 *   get:
 *     summary: Get customer's available downloads
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of downloadable items retrieved successfully
 */
export const getCustomerDownloads = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.user?.id;

    if (!customerId) {
        throw new AppError('Authentication required', 401);
    }

    // Find all paid orders for this customer
    const orders = await Order.find({
        customerId,
        paymentStatus: 'paid',
    }).sort({ createdAt: -1 });

    // Extract downloadable items from orders
    const downloads: any[] = [];
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        for (let j = 0; j < order.items.length; j++) {
            const item = order.items[j];
            if (item.downloadable && item.downloadFiles && item.downloadFiles.length > 0) {
                const now = new Date();
                const isExpired = item.downloadExpiresAt && item.downloadExpiresAt < now;
                const limitReached = item.downloadLimit && item.downloadCount! >= item.downloadLimit;

                downloads.push({
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    itemIndex: j,
                    productId: item.productId,
                    productName: item.name,
                    image: item.image,
                    files: item.downloadFiles,
                    downloadLimit: item.downloadLimit,
                    downloadCount: item.downloadCount || 0,
                    downloadExpiresAt: item.downloadExpiresAt,
                    isExpired,
                    limitReached,
                    canDownload: !isExpired && !limitReached,
                    purchasedAt: order.createdAt,
                });
            }
        }
    }

    res.json({
        success: true,
        downloads,
    });
});

/**
 * @swagger
 * /api/downloads/{orderId}/{itemId}/generate-url:
 *   post:
 *     summary: Generate a secure download URL
 *     tags: [Downloads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileIndex]
 *             properties:
 *               fileIndex: { type: number }
 *     responses:
 *       200:
 *         description: Secure download URL generated
 */
export const generateDownloadUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerId = req.user?.id;
    const { orderId, itemId } = req.params;
    const { fileIndex } = req.body;

    if (!customerId) {
        throw new AppError('Authentication required', 401);
    }

    // Find the order
    const order = await Order.findOne({
        _id: orderId,
        customerId,
        paymentStatus: 'paid',
    });

    if (!order) {
        throw new AppError('Order not found or not paid', 404);
    }

    // Find the item by index (itemId is actually the index)
    const itemIndex = parseInt(itemId);
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
        throw new AppError('Item not found', 404);
    }
    const item = order.items[itemIndex];
    if (!item || !item.downloadable) {
        throw new AppError('Item not found or not downloadable', 404);
    }

    // Check if file index is valid
    if (!item.downloadFiles || fileIndex >= item.downloadFiles.length) {
        throw new AppError('Invalid file index', 400);
    }

    // Check expiry
    const now = new Date();
    if (item.downloadExpiresAt && item.downloadExpiresAt < now) {
        throw new AppError('Download has expired', 403);
    }

    // Check limit
    if (item.downloadLimit && item.downloadCount! >= item.downloadLimit) {
        throw new AppError('Download limit reached', 403);
    }

    const file = item.downloadFiles[fileIndex];

    // Generate JWT token for secure download (expires in 1 hour)
    const token = jwt.sign(
        {
            customerId,
            orderId: order._id,
            itemId,
            fileIndex,
            fileUrl: file.url,
        },
        config.jwt.secret,
        { expiresIn: '1h' }
    );

    // Construct download URL
    const downloadUrl = `${config.apiUrl}/api/downloads/file/${token}`;

    res.json({
        success: true,
        downloadUrl,
        fileName: file.name,
        fileSize: file.fileSize,
        expiresIn: 3600, // seconds
    });
});

/**
 * @swagger
 * /api/downloads/file/{token}:
 *   get:
 *     summary: Download file with secure token
 *     tags: [Downloads]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File download
 */
export const downloadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.params;

    // Verify JWT token
    let decoded: any;
    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new AppError('Invalid or expired download token', 403);
    }

    const { customerId, orderId, itemId, fileIndex, fileUrl } = decoded;

    // Find the order
    const order = await Order.findOne({
        _id: orderId,
        customerId,
        paymentStatus: 'paid',
    });

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    // Find the item by index (itemId is actually the index)
    const itemIndex = parseInt(itemId);
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= order.items.length) {
        throw new AppError('Item not found', 404);
    }
    const item = order.items[itemIndex];
    if (!item || !item.downloadable) {
        throw new AppError('Item not found or not downloadable', 404);
    }

    // Check expiry again (belt and suspenders)
    const now = new Date();
    if (item.downloadExpiresAt && item.downloadExpiresAt < now) {
        throw new AppError('Download has expired', 403);
    }

    // Check limit
    if (item.downloadLimit && item.downloadCount! >= item.downloadLimit) {
        throw new AppError('Download limit reached', 403);
    }

    // Increment download count
    item.downloadCount = (item.downloadCount || 0) + 1;
    await order.save();

    // Check if file is a URL or local path
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Stream from external URL to hide the source address
        try {
            const externalResponse = await axios({
                method: 'get',
                url: fileUrl,
                responseType: 'stream',
                timeout: 30000, // 30 seconds timeout
            });

            const fileName = item.downloadFiles![fileIndex].name;

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

            if (externalResponse.headers['content-type']) {
                res.setHeader('Content-Type', externalResponse.headers['content-type']);
            }

            if (externalResponse.headers['content-length']) {
                res.setHeader('Content-Length', externalResponse.headers['content-length']);
            }

            externalResponse.data.pipe(res);
        } catch (error: any) {
            console.error('Error streaming external file:', error);
            throw new AppError('Failed to stream file from external source', 502);
        }
    } else {
        // Serve local file
        const fileName = item.downloadFiles![fileIndex].name;
        const filePath = path.join(process.cwd(), fileUrl);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new AppError('File not found on server', 404);
        }

        res.download(filePath, fileName);
    }
});
