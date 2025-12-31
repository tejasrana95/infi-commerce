import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    getCustomerDownloads,
    generateDownloadUrl,
    downloadFile,
} from '../controllers/download.controller';

const router = express.Router();

/**
 * Customer download routes
 */
router.get('/', authenticate, getCustomerDownloads);
router.post('/:orderId/:itemId/generate-url', authenticate, generateDownloadUrl);
router.get('/file/:token', downloadFile);

export default router;
