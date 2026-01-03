/**
 * Module Registry
 * Maps module types to their React components
 * Add new modules here as they are created
 */

import BannerModule from './standard/Banner';
import BannerSliderModule from './standard/BannerSlider';
import TestimonialsModule from './standard/Testimonials';
import BrandLogosModule from './standard/BrandLogos';
import ProductCarouselModule from './standard/ProductCarousel';
import ProductGridModule from './standard/ProductGrid';
import CategoryShowcaseModule from './standard/CategoryShowcase';
import TextBlockModule from './standard/TextBlock';
import IconBoxModule from './standard/IconBox';
import PricingTableModule from './standard/PricingTable';
import ImageModule from './standard/Image';
import ImageGalleryModule from './standard/ImageGallery';
import VideoModule from './standard/Video';
import DividerModule from './standard/Divider';
import SpacerModule from './standard/Spacer';
import HtmlModule from './standard/Html';
import RelatedProductsModule from './standard/RelatedProducts';
import RecentlyViewedModule from './standard/RecentlyViewed';
import PersonalizedProductsModule from './standard/PersonalizedProducts';
import CTAButtonModule from './standard/CTAButton';
import StripBannerModule from './standard/StripBanner';
import CardGroupModule from './standard/CardGroup';
import PageContentModule from './standard/PageContent';
import PageHeroModule from './standard/PageHero';
import CheckoutContentModule from './checkout/CheckoutContent';
import CartModule from './cart/CartModule';
import FormModule from './form/FormModule';
// Account Modules
import AccountSidebarModule from './account/AccountSidebar';
import AccountDashboardModule from './account/AccountDashboard';
import AccountOrdersModule from './account/AccountOrders';
import AccountProfileModule from './account/AccountProfile';
import AccountAddressesModule from './account/AccountAddresses';

// Blog Modules
import BlogHeroModule from './blog/BlogHero';
import BlogGridModule from './blog/BlogGrid';
import RelatedBlogsModule from './blog/RelatedBlogs';
import BlogCategoriesSidebarModule from './blog/BlogCategoriesSidebar';
import RecentPostsModule from './blog/RecentPosts';
import PopularPostsModule from './blog/PopularPosts';
import NewsletterSignupModule from './blog/NewsletterSignup';
import TagsCloudModule from './blog/TagsCloud';
import AuthorCardModule from './blog/AuthorCard';

export interface ModuleProps {
    config: Record<string, any>;
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

type ModuleComponent = React.ComponentType<ModuleProps>;

export const moduleRegistry: Record<string, ModuleComponent> = {
    // Core/Standard Modules
    'banner': BannerModule,
    'banner-slider': BannerSliderModule,
    'testimonials': TestimonialsModule,
    'brand-logos': BrandLogosModule,
    'product-carousel': ProductCarouselModule,
    'product-grid': ProductGridModule,
    'category-showcase': CategoryShowcaseModule,
    'text-block': TextBlockModule,
    'icon-box': IconBoxModule,
    'pricing-table': PricingTableModule,
    'image': ImageModule,
    'image-gallery': ImageGalleryModule,
    'video': VideoModule,
    'divider': DividerModule,
    'spacer': SpacerModule,
    'html': HtmlModule,
    // Product context modules
    'related-products': RelatedProductsModule,
    'recently-viewed': RecentlyViewedModule,
    'personalized-products': PersonalizedProductsModule,
    'cta-button': CTAButtonModule,
    'strip-banner': StripBannerModule,
    'card-group': CardGroupModule,
    // Blog modules
    'blog-hero': BlogHeroModule,
    'blog-grid': BlogGridModule,
    'blog-listing': BlogGridModule, // Alias for admin layout builder compatibility
    'related-blogs': RelatedBlogsModule,
    'blog-categories-sidebar': BlogCategoriesSidebarModule,
    'recent-posts': RecentPostsModule,
    'popular-posts': PopularPostsModule,
    'newsletter-signup': NewsletterSignupModule,
    'tags-cloud': TagsCloudModule,
    'author-card': AuthorCardModule,
    // Static page modules
    'page-content': PageContentModule,
    'page-hero': PageHeroModule,
    // Checkout module
    'checkout-content': CheckoutContentModule,
    // Cart module
    'cart-details': CartModule,
    // Form module
    'form': FormModule,
    // Account modules
    'account-sidebar': AccountSidebarModule,
    'account-dashboard': AccountDashboardModule,
    'account-orders': AccountOrdersModule,
    'account-profile': AccountProfileModule,
    'account-addresses': AccountAddressesModule,
};

/**
 * Register a new module type
 */
export function registerModule(type: string, component: ModuleComponent) {
    moduleRegistry[type] = component;
}

