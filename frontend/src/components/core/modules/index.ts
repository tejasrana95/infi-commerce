import dynamic from 'next/dynamic';

/**
 * Module Registry
 * Maps module types to their React components
 * Add new modules here as they are created
 */

const BannerModule = dynamic(() => import('./standard/Banner'));
const BannerSliderModule = dynamic(() => import('./standard/BannerSlider'));
const TestimonialsModule = dynamic(() => import('./standard/Testimonials'));
const BrandLogosModule = dynamic(() => import('./standard/BrandLogos'));
const ProductCarouselModule = dynamic(() => import('./standard/ProductCarousel'));
const ProductGridModule = dynamic(() => import('./standard/ProductGrid'));
const CategoryShowcaseModule = dynamic(() => import('./standard/CategoryShowcase'));
const HeadingModule = dynamic(() => import('./standard/Heading'));
const TextBlockModule = dynamic(() => import('./standard/TextBlock'));
const IconBoxModule = dynamic(() => import('./standard/IconBox'));
const IconGroupModule = dynamic(() => import('./standard/IconGroup'));
const AccordionModule = dynamic(() => import('./standard/Accordion'));
const PricingTableModule = dynamic(() => import('./standard/PricingTable'));
const ImageModule = dynamic(() => import('./standard/Image'));
const ImageGalleryModule = dynamic(() => import('./standard/ImageGallery'));
const VideoModule = dynamic(() => import('./standard/Video'));
const DividerModule = dynamic(() => import('./standard/Divider'));
const SpacerModule = dynamic(() => import('./standard/Spacer'));
const HtmlModule = dynamic(() => import('./standard/Html'));
const RelatedProductsModule = dynamic(() => import('./standard/RelatedProducts'));
const RecentlyViewedModule = dynamic(() => import('./standard/RecentlyViewed'));
const PersonalizedProductsModule = dynamic(() => import('./standard/PersonalizedProducts'));
const CTAButtonModule = dynamic(() => import('./standard/CTAButton'));
const StripBannerModule = dynamic(() => import('./standard/StripBanner'));
const CardGroupModule = dynamic(() => import('./standard/CardGroup'));
const PageContentModule = dynamic(() => import('./standard/PageContent'));
const PageHeroModule = dynamic(() => import('./standard/PageHero'));
const NumberBoxModule = dynamic(() => import('./standard/NumberBox'));
const FlipBoxModule = dynamic(() => import('./standard/FlipBox'));
const ProgressBarModule = dynamic(() => import('./standard/ProgressBar'));
const MarqueeModule = dynamic(() => import('./standard/Marquee'));
const IconModule = dynamic(() => import('./standard/Icon'));
const TableModule = dynamic(() => import('./standard/Table'));
const ContentCardGridModule = dynamic(() => import('./standard/ContentCardGrid'));
const HeroSliderModule = dynamic(() => import('./standard/HeroSlider'));
const HeroBannerModule = dynamic(() => import('./standard/HeroBanner'));
const IconListModule = dynamic(() => import('./standard/IconList'));
const SectionLayoutModule = dynamic(() => import('./standard/SectionLayout'));
const CheckoutContentModule = dynamic(() => import('./checkout/CheckoutContent'));
const CartModule = dynamic(() => import('./cart/CartModule'));
const FormModule = dynamic(() => import('./form/FormModule'));
// Account Modules
const AccountSidebarModule = dynamic(() => import('./account/AccountSidebar'));
const AccountDashboardModule = dynamic(() => import('./account/AccountDashboard'));
const AccountOrdersModule = dynamic(() => import('./account/AccountOrders'));
const AccountProfileModule = dynamic(() => import('./account/AccountProfile'));
const AccountAddressesModule = dynamic(() => import('./account/AccountAddresses'));
const AccountReturnsModule = dynamic(() => import('./account/AccountReturns'));
const AccountReturnDetailsModule = dynamic(() => import('./account/AccountReturnDetails'));

// Blog Modules
const BlogHeroModule = dynamic(() => import('./blog/BlogHero'));
const BlogGridModule = dynamic(() => import('./blog/BlogGrid'));
const RelatedBlogsModule = dynamic(() => import('./blog/RelatedBlogs'));
const BlogCategoriesSidebarModule = dynamic(() => import('./blog/BlogCategoriesSidebar'));
const RecentPostsModule = dynamic(() => import('./blog/RecentPosts'));
const PopularPostsModule = dynamic(() => import('./blog/PopularPosts'));
const NewsletterSignupModule = dynamic(() => import('./blog/NewsletterSignup'));
const TagsCloudModule = dynamic(() => import('./blog/TagsCloud'));
const AuthorCardModule = dynamic(() => import('./blog/AuthorCard'));

export interface ModuleProps {
    config: Record<string, any>;
    styling?: {
        className?: string;
        customCSS?: string;
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        borderWidth?: number;
        borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
        borderRadius?: number;
        marginTop?: number;
        marginBottom?: number;
        marginLeft?: number;
        marginRight?: number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        maxWidth?: number;
        boxShadow?: 'none' | 'small' | 'medium' | 'large';
        gap?: number;
        inputBackgroundColor?: string;
        inputTextColor?: string;
        buttonBackgroundColor?: string;
        buttonTextColor?: string;
    };
    sectionType?: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
    initialData?: any;
    priority?: boolean;
}

type ModuleComponent = React.ComponentType<any>;

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
    'heading': HeadingModule,
    'accordion': AccordionModule,
    'icon-box': IconBoxModule,
    'icon-group': IconGroupModule,
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
    // New modules
    'number-box': NumberBoxModule,
    'flip-box': FlipBoxModule,
    'progress-bar': ProgressBarModule,
    'marquee': MarqueeModule,
    'icon': IconModule,
    'table': TableModule,
    'content-card-grid': ContentCardGridModule,
    'hero-slider': HeroSliderModule,
    'hero-banner': HeroBannerModule,
    'icon-list': IconListModule,
    'section-layout': SectionLayoutModule,
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
    'account-returns': AccountReturnsModule,
    'account-return-details': AccountReturnDetailsModule,
};

/**
 * Register a new module type
 */
export function registerModule(type: string, component: ModuleComponent) {
    moduleRegistry[type] = component;
}
