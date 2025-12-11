import { Router } from 'express';
import customerAuthRoutes from './customer-auth.routes';
import adminAuthRoutes from './admin-auth.routes';
import storeRoutes from './store.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import attributeRoutes from './attribute.routes';
import saleRoutes from './sale.routes';
import currencyRoutes from './currency.routes';
import geoRoutes from './geo.routes';
import geoGroupRoutes from './geo-group.routes';
import cartRoutes from './cart.routes';
import shippingRoutes from './shipping.routes';

const router = Router();

// Mount authentication routes
// Separate routes for customers and admins for better security
router.use('/auth/customer', customerAuthRoutes);
router.use('/auth/admin', adminAuthRoutes);

// Mount store routes
router.use('/stores', storeRoutes);

// Mount category routes
router.use('/categories', categoryRoutes);

// Mount product routes
router.use('/products', productRoutes);

// Mount attribute routes
router.use('/attributes', attributeRoutes);

// Mount sale routes
router.use('/sales', saleRoutes);

// Mount currency routes
router.use('/currencies', currencyRoutes);

// Mount geo routes
router.use('/geo', geoRoutes);

// Mount geo group routes
router.use('/geo-groups', geoGroupRoutes);

// Mount cart routes
router.use('/cart', cartRoutes);

// Mount shipping routes
router.use('/shipping', shippingRoutes);

// TODO: Add more routes
// router.use('/orders', orderRoutes);

export default router;
