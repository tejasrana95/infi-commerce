import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All POS routes require authentication and pos_user/store_admin/super_admin role
router.use(authenticate);
router.use(authorize('pos_user', 'store_admin', 'super_admin'));

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

// GET /api/pos/products/by-sku - Lookup product by exact SKU or barcode
router.get('/products/by-sku', authenticate, async (req, res) => {
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
