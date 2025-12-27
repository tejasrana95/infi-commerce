import { Router } from 'express';
import customerAuthRoutes from './customer-auth.routes';
import adminAuthRoutes from './admin-auth.routes';
import storeRoutes from './store.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import attributeRoutes from './attribute.routes';
import productOptionRoutes from './productOption.routes';
import brandRoutes from './brand.routes';
import saleRoutes from './sale.routes';
import currencyRoutes from './currency.routes';
import geoRoutes from './geo.routes';
import geoGroupRoutes from './geo-group.routes';
import cartRoutes from './cart.routes';
import checkoutRoutes from './checkout.routes';
import shippingRoutes from './shipping.routes';
import couponRoutes from './coupon.routes';
import orderRoutes from './order.routes';
import paymentGatewayRoutes from './payment-gateway.routes';
import webhookRoutes from './webhook.routes';
import fileRoutes from './file.routes';
import customerRoutes from './customer.routes';
import adminRoutes from './admin.routes';
import reviewRoutes from './review.routes';
import taxRateRoutes from './taxRate.routes';
import wishlistRoutes from './wishlist.routes';
import notificationRoutes from './notification.routes';
import compareRoutes from './compare.routes';

// Layout Designer Routes
import themeRoutes from './theme.routes';
import menuRoutes from './menu.routes';
import layoutRoutes from './layout.routes';
import pageRoutes from './page.routes';
import blogRoutes from './blog.routes';
import globalElementsRoutes from './global-elements.routes';

// Content Module Routes
import bannerRoutes from './banner.routes';
import bannerSliderRoutes from './bannerSlider.routes';
import testimonialRoutes from './testimonial.routes';
import brandShowcaseRoutes from './brandShowcase.routes';

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

// Mount product option routes (for variants - formerly attributes)
router.use('/product-options', productOptionRoutes);

// Mount attribute routes (legacy - will be replaced with new attribute system)
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

// Mount checkout routes
router.use('/checkout', checkoutRoutes);

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

// Mount review routes
router.use('/reviews', reviewRoutes);

// Mount tax rate routes (global - not store-specific)
router.use('/tax-rates', taxRateRoutes);

// Mount wishlist routes
router.use('/wishlist', wishlistRoutes);

// Mount notification routes
router.use('/notifications', notificationRoutes);

// --- Layout Designer Routes ---
// Mount theme routes
router.use('/themes', themeRoutes);

// Mount menu routes
router.use('/menus', menuRoutes);

// Mount layout routes
router.use('/layouts', layoutRoutes);

// Mount page routes
router.use('/pages', pageRoutes);

// Mount blog routes
router.use('/blog', blogRoutes);

// Mount global elements routes
router.use('/global', globalElementsRoutes);

// --- Content Module Routes ---
router.use('/banners', bannerRoutes);
router.use('/banner-sliders', bannerSliderRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/brand-showcases', brandShowcaseRoutes);

// Mount compare routes
router.use('/compare', compareRoutes);

export default router;


