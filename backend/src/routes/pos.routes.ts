import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { authenticate, authorize } from '../middleware/auth';
import Product from '../models/Product';
import posPaymentRoutes from './pos-payment.routes';
import posSyncController from '../controllers/pos-sync.controller';

const router = Router();

// All POS routes require authentication and pos_user/store_admin/super_admin role
router.use(authenticate);
router.use(authorize('pos_user', 'store_admin', 'super_admin'));

// Mount POS Payment Routes (e.g. /api/pos/payment/qr)
router.use('/payment', posPaymentRoutes);

// Sync Status
router.get('/sync-status', posSyncController.getSyncStatus);

// Session Management
router.post('/session/start', posController.startSession);
router.post('/session/end', posController.endSession);
router.get('/session/current', posController.getCurrentSession);
router.get('/session/history', posController.getSessionHistory);


// Dashboard
router.get('/dashboard', posController.getDashboard);

// Receipt
router.get('/receipt/:orderId', posController.getReceiptData);

// Password Verification
router.post('/verify-password', posController.verifyPassword);

// Held Orders Management
router.post('/held-orders', posController.createHeldOrder);
router.get('/held-orders', posController.getHeldOrders);
router.put('/held-orders/:id/transfer', posController.transferHeldOrder);
router.put('/held-orders/:id/resume', posController.resumeHeldOrder);
router.delete('/held-orders/:id', posController.deleteHeldOrder);

// Get POS Users (for transfer functionality)
router.get('/users', posController.getPOSUsers);

// Order Return Management
router.get('/orders/search', posController.searchOrders);
router.post('/orders/calculate-refund', posController.calculateRefund);
router.post('/orders/return', posController.processReturn);

// GET /api/pos/products/by-sku - Lookup product by exact SKU or barcode
router.get('/products/by-sku', authenticate, async (req: any, res: any) => {
  const { sku } = req.query;

  if (!sku) {
    return res.status(400).json({ success: false, message: 'SKU is required' });
  }

  const product = await Product.findOne({
    $or: [
      { sku: sku },
      { barcode: sku },
    ],
    storeId: req.user.storeId,
    isActive: true,
  }).populate('categoryIds brand');

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `No product found with SKU/barcode: ${sku}`
    });
  }

  res.json({ success: true, product });
});

export default router;
