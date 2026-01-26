import { Router } from 'express';
import {
    getOrderAccounting,
    updateOrderAccounting,
    regenerateOrderAccounting,
    syncOrderReturns,
    fetchGatewayData,
    getReportSummary,
    getReportOrders,
    exportReport,
} from '../controllers/accounting.controller';
import { authenticate } from '../middleware/auth';


const router = Router();

// All routes require admin authentication
router.use(authenticate);

// Report routes (must come before :orderId routes to avoid conflicts)
router.get('/reports/summary', getReportSummary);
router.get('/reports/orders', getReportOrders);
router.get('/reports/export', exportReport);

// Order-specific accounting routes
router.get('/:orderId', getOrderAccounting);
router.put('/:orderId', updateOrderAccounting);
router.post('/:orderId/regenerate', regenerateOrderAccounting);
router.post('/:orderId/sync-returns', syncOrderReturns);
router.post('/:orderId/fetch-gateway-data', fetchGatewayData);

export default router;
