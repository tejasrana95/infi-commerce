import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);

// TODO: Add more routes
// router.use('/stores', storeRoutes);
// router.use('/products', productRoutes);
// router.use('/cart', cartRoutes);
// router.use('/orders', orderRoutes);
// router.use('/shipping', shippingRoutes);

export default router;
