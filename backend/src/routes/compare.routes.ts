import { Router } from 'express';
import {
    getCompareProducts,
    getCompareConfig,
} from '../controllers/compare.controller';

const router = Router();

// Public routes
// POST to allow sending array of product IDs in body
router.post('/products', getCompareProducts);

// Get compare configuration for a store
router.get('/config/:storeId', getCompareConfig);

export default router;
