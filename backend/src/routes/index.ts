import { Router } from 'express';
import customerAuthRoutes from './customer-auth.routes';
import adminAuthRoutes from './admin-auth.routes';
import storeRoutes from './store.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import attributeRoutes from './attribute.routes';
import brandRoutes from './brand.routes';
import saleRoutes from './sale.routes';
import currencyRoutes from './currency.routes';
import geoRoutes from './geo.routes';
import geoGroupRoutes from './geo-group.routes';
import cartRoutes from './cart.routes';
import shippingRoutes from './shipping.routes';
import couponRoutes from './coupon.routes';
import orderRoutes from './order.routes';
import paymentGatewayRoutes from './payment-gateway.routes';
import webhookRoutes from './webhook.routes';
import fileRoutes from './file.routes';
import customerRoutes from './customer.routes';
import adminRoutes from './admin.routes';

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

// Mount brand routes
router.use('/brands', brandRoutes);

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

// Mount coupon routes
router.use('/coupons', couponRoutes);

// Mount order routes
router.use('/orders', orderRoutes);

// Mount payment gateway routes
router.use('/payment-gateways', paymentGatewayRoutes);

// Mount webhook routes
router.use('/webhooks', webhookRoutes);

// Mount file routes
router.use('/files', fileRoutes);

// Mount customer management routes
router.use('/customers', customerRoutes);

// Mount admin management routes
router.use('/admins', adminRoutes);

export default router;

