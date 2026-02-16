import { Router } from 'express';
import {
    getAccountStatus,
    getProducts,
    checkProductReadiness,
    submitProduct,
    batchSubmitProducts,
    removeProduct,
    updateSupplementalData,
    batchUpdateSupplementalData,
    getFeedDiagnostics,
} from '../controllers/google-merchant.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkDemoMode } from '../middleware/checkDemoMode';

const router = Router();

// All routes require admin authentication
const adminAuth = [authenticate, authorize('admin', 'store_admin', 'super_admin')];

// Account status & diagnostics
router.get('/:storeId/status', ...adminAuth, getAccountStatus);
router.get('/:storeId/diagnostics', ...adminAuth, getFeedDiagnostics);

// Product feed management
router.get('/:storeId/products', ...adminAuth, getProducts);
router.get('/:storeId/products/:productId/readiness', ...adminAuth, checkProductReadiness);

// Submit / Remove
router.post('/:storeId/products/:productId/submit', ...adminAuth, checkDemoMode, submitProduct);
router.post('/:storeId/products/batch-submit', ...adminAuth, checkDemoMode, batchSubmitProducts);
router.delete('/:storeId/products/:productId', ...adminAuth, checkDemoMode, removeProduct);

// Supplemental data
router.put('/:storeId/products/:productId/supplemental', ...adminAuth, checkDemoMode, updateSupplementalData);
router.put('/:storeId/products/batch-supplemental', ...adminAuth, checkDemoMode, batchUpdateSupplementalData);

export default router;
