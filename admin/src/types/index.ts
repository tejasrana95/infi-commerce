export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

// ============ HEADER & FOOTER TYPES ============

// Header Top Bar Types
export interface HeaderTopBarItem {
  id: string;
  type: 'text' | 'link' | 'phone' | 'email' | 'social' | 'language' | 'currency';
  content?: string;
  label?: string;
  url?: string;
  icon?: string;
  position: 'left' | 'center' | 'right';
  order: number;
}

export interface HeaderTopBar {
  enabled: boolean;
  backgroundColor?: string;
  textColor?: string;
  height?: number;
  items: HeaderTopBarItem[];
}

// Header Main Types
export interface HeaderElement {
  id: string;
  type: 'logo' | 'menu' | 'search' | 'cart' | 'account' | 'wishlist' | 'currency' | 'custom';
  menuId?: string; // Reference to Menu._id
  width?: number; // Grid units out of 12
  settings?: {
    // Logo settings
    logoUrl?: string;
    logoHeight?: number;
    logoAlt?: string;
    // Search settings
    searchPlaceholder?: string;
    searchButtonText?: string;
    // Cart settings
    showCartCount?: boolean;
    cartIconStyle?: 'default' | 'bag' | 'basket';
    // Account settings
    showLoginRegister?: boolean;
    loginText?: string;
    registerText?: string;
    // Wishlist settings
    wishlistIconStyle?: 'default' | 'heart' | 'star';
    // Custom settings
    customHtml?: string;
  };
  order: number;
}

export interface HeaderSection {
  id: string;
  position: 'left' | 'center' | 'right';
  items: HeaderElement[];
}

export interface HeaderMainConfig {
  layout: 'default' | 'centered' | 'split' | 'minimal' | 'custom';
  backgroundColor?: string;
  height?: number;
  sticky?: boolean;
  transparent?: boolean;
  sections: HeaderSection[];
}

// Footer Types
export interface FooterElement {
  id: string;
  type: 'menu' | 'text' | 'html' | 'newsletter' | 'social' | 'contact' | 'payment-methods';
  menuId?: string;
  content?: string;
  settings?: {
    // Newsletter settings
    newsletterTitle?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    newsletterDescription?: string;
    // Social settings
    socialLinks?: Array<{
      id: string;
      platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'pinterest' | 'tiktok';
      url: string;
    }>;
    // Contact settings
    contactInfo?: {
      address?: string;
      phone?: string;
      email?: string;
      workingHours?: string;
    };
    // Payment methods
    paymentMethods?: Array<{
      id: string;
      name: string;
      icon: string;
    }>;
  };
}

export interface FooterColumn {
  id: string;
  title?: string;
  width: number; // Grid units out of 12
  items: FooterElement[];
}

export interface FooterSection {
  id: string;
  type: 'columns' | 'bottom-bar';
  backgroundColor?: string;
  textColor?: string;
  padding?: number;
  columns?: FooterColumn[];
  rows?: Array<{ id: string; columns: FooterColumn[] }>; // Multi-row support
  bottomBarContent?: string; // For copyright, etc.
}

export interface FooterConfig {
  sections: FooterSection[];
}

// Theme Configuration
export interface ProductCardConfig {
  // Card Design
  cardStyle: 'default' | 'minimal' | 'overlay' | 'horizontal' | 'bordered';

  // Image Settings
  imageAspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | 'auto';
  imageSize: 'small' | 'medium' | 'large';
  imageFit: 'cover' | 'contain';
  showImageHover: boolean;

  // Button Visibility
  showAddToCart: boolean;
  showBuyNow: boolean;
  showWishlist: boolean;
  showQuickView: boolean;
  showCompare: boolean;

  // Button Styles
  addToCartStyle: 'filled' | 'outlined' | 'text' | 'icon-only';
  buyNowStyle: 'filled' | 'outlined' | 'text';
  wishlistPosition: 'top-right' | 'top-left' | 'bottom';
  quickViewPosition: 'overlay' | 'top-right';

  // Typography
  titleLines: 1 | 2 | 3;
  titleFontSize: 'small' | 'medium' | 'large';
  titleFontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  priceFontSize: 'small' | 'medium' | 'large';

  // Display Options
  showBrand: boolean;
  showRating: boolean;
  showSalePercent: boolean;
  showStock: boolean;
  showSku: boolean;

  // Hover Effects
  hoverEffect: 'none' | 'zoom' | 'lift' | 'shadow' | 'overlay';

  // Spacing
  cardGap: number;
  cardPadding: number;
  cardBorderRadius: number;
}

// ============ CATEGORY PAGE CONFIGURATION ============

export interface CategoryHeaderConfig {
  showImage: boolean;
  showDescription: boolean;
  descriptionPosition: 'top' | 'bottom' | 'below-image';
  descriptionStyle: 'expanded' | 'collapsed';
  defaultExpanded: boolean;
  expandLabel: string;
  collapseLabel: string;
}

export interface CategoryGridConfig {
  productsPerPage: number;
  productsPerRow: {
    desktop: 3 | 4 | 5;
    tablet: 2 | 3;
    mobile: 1 | 2;
  };
  cardStyle: 'default' | 'compact' | 'detailed';
}

export interface CategorySortingConfig {
  defaultSort: 'featured' | 'newest' | 'oldest' | 'price-low' | 'price-high' | 'alphabetical' | 'bestselling';
  showSortDropdown: boolean;
  availableSortOptions: string[];
}

export interface CategoryPaginationConfig {
  type: 'pagination' | 'infinite-scroll' | 'load-more';
  position: 'left' | 'center' | 'right';
  showProductCount: boolean;
}

export interface CategoryFiltersConfig {
  enabled: boolean;
  position: 'left' | 'right' | 'top' | 'off-canvas';
  sidebarWidth: number;
  style: 'sticky' | 'static';
  defaultState: 'expanded' | 'collapsed';
  showPriceRange: boolean;
  priceRangeStyle: 'slider' | 'input' | 'range-buttons';
  showCategoryFilter: boolean;
  showAttributeFilters: boolean;
  showTagFilter: boolean;
  showBrandFilter: boolean;
  showRatingFilter: boolean;
  showAvailabilityFilter: boolean;
  // Off-canvas specific settings
  offCanvas?: {
    slideFrom: 'left' | 'right';
    drawerWidth: number;
    buttonText: string;
    buttonPosition: 'left' | 'right';
    showFilterCount: boolean;
  };
}

export interface SubcategoryDisplayConfig {
  display: 'filter' | 'cards' | 'both' | 'none';
  cardStyle: 'image' | 'minimal';
  position: 'above-products' | 'sidebar';
}

export interface CategoryEmptyStateConfig {
  message: string;
  showClearFilters: boolean;
}

export interface CategorySEOConfig {
  indexFilteredPages: boolean; // Whether to allow search engines to index filtered URLs
}

export interface CategoryConfig {
  header: CategoryHeaderConfig;
  grid: CategoryGridConfig;
  sorting: CategorySortingConfig;
  pagination: CategoryPaginationConfig;
  filters: CategoryFiltersConfig;
  subcategories: SubcategoryDisplayConfig;
  emptyState: CategoryEmptyStateConfig;
  seo: CategorySEOConfig;
}

export const DEFAULT_CATEGORY_CONFIG: CategoryConfig = {
  header: {
    showImage: true,
    showDescription: true,
    descriptionPosition: 'below-image',
    descriptionStyle: 'collapsed',
    defaultExpanded: false,
    expandLabel: 'Read more',
    collapseLabel: 'Show less',
  },
  grid: {
    productsPerPage: 24,
    productsPerRow: { desktop: 4, tablet: 3, mobile: 2 },
    cardStyle: 'default',
  },
  sorting: {
    defaultSort: 'featured',
    showSortDropdown: true,
    availableSortOptions: ['featured', 'newest', 'price-low', 'price-high', 'bestselling'],
  },
  pagination: {
    type: 'pagination',
    position: 'center',
    showProductCount: true,
  },
  filters: {
    enabled: true,
    position: 'left',
    sidebarWidth: 280,
    style: 'sticky',
    defaultState: 'expanded',
    showPriceRange: true,
    priceRangeStyle: 'slider',
    showCategoryFilter: true,
    showAttributeFilters: true,
    showTagFilter: false,
    showBrandFilter: true,
    showRatingFilter: true,
    showAvailabilityFilter: true,
    offCanvas: {
      slideFrom: 'left',
      drawerWidth: 320,
      buttonText: 'Filters',
      buttonPosition: 'left',
      showFilterCount: true,
    },
  },
  subcategories: {
    display: 'both',
    cardStyle: 'image',
    position: 'above-products',
  },
  emptyState: {
    message: 'No products found',
    showClearFilters: true,
  },
  seo: {
    indexFilteredPages: false,
  },
};

export interface ThemeConfig {
  templateId: string; // ID of the specific template (e.g., 'modern-clean', 'classic-elegance')
  header?: {
    topBar?: HeaderTopBar;
    main: HeaderMainConfig;
    mobileMenu?: {
      enabled: boolean;
      menuId: string;
    };
  };
  footer?: FooterConfig;
  productCard?: ProductCardConfig;
  category?: CategoryConfig;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

// ============ END HEADER & FOOTER TYPES ============


export interface Store {
  _id: string;
  name: string;
  slug: string;
  domain: string;
  description?: string;
  logo?: string;
  favicon?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  settings?: {
    emailNotifications?: boolean;
    orderNotifications?: boolean;
    maintenanceMode?: boolean;
    allowGuestCheckout?: boolean;
    requireEmailVerification?: boolean;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    taxEnabled?: boolean;
    taxRate?: number;
    shippingEnabled?: boolean;
    [key: string]: any;
  };
  theme?: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  storeId: string | { _id: string; name: string; slug: string };
  parentCategory?: string | { _id: string; title: string; slug: string };
  image?: string;
  status: 'active' | 'inactive' | 'draft';

  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  };

  level: number;
  path: string;
  sortOrder: number;
  isVisible: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  _id?: string;
  label: string;
  value: string;
  colorCode?: string;
  image?: string;
}

export interface Attribute {
  _id: string;
  name: string;
  slug: string;
  type: 'select' | 'multiselect' | 'text' | 'color' | 'size';
  values: AttributeValue[];
  isFilterable: boolean;
  isVariation: boolean;
  sortOrder: number;
  storeId: string | Store; // Can be populated
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  storeId: string | Store; // Can be populated
  createdAt: string;
  updatedAt: string;
}

export interface ProductVideo {
  type: 'youtube' | 'vimeo' | 'url';
  url: string;
  thumbnail?: string;
  title?: string;
}

export interface ProductVariant {
  sku: string;
  attributes: Record<string, string>;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

export interface ProductAttribute {
  attributeId: string | Attribute;
  values: string[];
  isVariation: boolean;
}

export interface Product {
  _id: string;
  storeId: string | Store;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  type: 'simple' | 'variable' | 'digital';
  sku: string;

  // Pricing
  price: number;
  salePrice?: number;
  salePriceStartDate?: string;
  salePriceEndDate?: string;
  costPrice?: number;

  // Inventory
  stock: number;
  manageStock: boolean;
  stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder' | 'made_to_order';
  lowStockThreshold?: number;

  // Shipping
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'cm' | 'in';
  };

  // Media
  images: string[];
  featuredImage?: string;
  videos?: ProductVideo[];

  // Categorization
  categoryIds: (string | Category)[];
  tags: string[];
  brand?: string;

  // Attributes & Variants
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];

  // Digital
  downloadable: boolean;
  downloadFiles?: Array<{
    name: string;
    url: string;
    fileSize: number;
  }>;
  downloadLimit?: number;
  downloadExpiry?: number;

  // SEO
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    focusKeyword?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };

  // Status
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;

  // Stats
  views: number;
  salesCount: number;
  averageRating?: number;
  reviewCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  _id: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  isActive: boolean;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
  thousandsSeparator: string;
  decimalSeparator: string;
  createdAt: string;
  updatedAt: string;
}

export interface Geo {
  _id: string;
  name: string;
  type: 'country' | 'state' | 'city';
  code?: string;
  parentId?: string | Geo; // Can be populated
  isActive: boolean;
  isShippingAvailable?: boolean; // Only for countries
  createdAt: string;
  updatedAt: string;
}

export interface GeoGroup {
  _id: string;
  name: string;
  storeId: string;
  description?: string;
  geos: string[]; // Deprecated, use countries
  countries?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRule {
  _id: string;
  name: string;
  description?: string;
  geoGroup?: string;
  minWeight?: number;
  maxWeight?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  shippingCost: number;
  estimatedDays?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Theme {
  _id: string;
  name: string;
  slug: string;
  version: string;
  description?: string;
  thumbnail?: string;
  author: string;
  isSystem: boolean;
  isActive: boolean;
  colors: Record<string, string>;
  typography: {
    headings: { fontFamily: string; fontWeight: string };
    body: { fontFamily: string; fontWeight: string };
  };
  createdAt: string;
  updatedAt: string;
}

// --- Layout Designer Types ---

export type LayoutType = 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'page' | 'cart' | 'checkout' | 'account';

export type ModuleType =
  // Standard modules
  | 'banner' | 'banner-slider' | 'text-block' | 'image' | 'image-gallery'
  | 'video' | 'spacer' | 'divider' | 'html' | 'newsletter' | 'testimonials'
  | 'countdown' | 'brand-logos'
  // Product modules
  | 'product-carousel' | 'product-grid' | 'category-showcase' | 'featured-product'
  | 'related-products' | 'recently-viewed'
  // Placeholder modules (required, page-specific)
  | 'category-header' | 'category-products' | 'category-filters' | 'category-pagination' | 'product-details'
  | 'search-results' | 'blog-listing' | 'blog-content';

export type SectionType = 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';

export interface LayoutModule {
  id: string;
  type: ModuleType;
  config: Record<string, any>;
  styling: {
    className?: string;
    customCSS?: string;
    marginTop?: number;
    marginBottom?: number;
    paddingTop?: number;
    paddingBottom?: number;
  };
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  isPlaceholder: boolean;
  isRemovable: boolean;
  order: number;
}

export interface LayoutColumn {
  id: string;
  width: number;
  modules: LayoutModule[];
}

export interface LayoutSection {
  id: string;
  name?: string;
  type: SectionType;
  settings: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
    maxWidth?: number;
    customClass?: string;
  };
  columns?: LayoutColumn[];
  modules: LayoutModule[];
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  order: number;
}

export interface Layout {
  _id: string;
  storeId: string | { _id: string; name: string };
  themeId?: string;
  name: string;
  description?: string;
  type: LayoutType;
  sections: LayoutSection[];
  settings: {
    backgroundColor?: string;
    customCSS?: string;
    customJS?: string;
    bodyClass?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
  };
  isDefault: boolean;
  isTemplate: boolean;
  templateCategory?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  label: string;
  type: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'mega-menu' | 'divider';
  url?: string;
  categoryId?: string;
  categorySlug?: string;
  productId?: string;
  productSlug?: string;
  pageId?: string;
  pageSlug?: string;
  blogCategoryId?: string;
  blogCategorySlug?: string;
  megaMenu?: {
    sections: Array<{
      id: string;
      type: 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';
      columns: Array<{
        id: string;
        width: number;
        items: Array<{
          id: string;
          type: 'category' | 'product' | 'image' | 'custom-link' | 'page' | 'divider';
          label?: string;
          // Category config
          categoryId?: string;
          productLimit?: number;
          autoAddProducts?: boolean;
          // Product config
          productIds?: string[];
          // Image config
          imageUrl?: string;
          imageLink?: string;
          imageAlt?: string;
          // Custom link config
          linkLabel?: string;
          linkTitle?: string;
          linkUrl?: string;
          linkOpenInNewTab?: boolean;
          // Page config
          pageId?: string;
        }>;
      }>;
      settings: {
        backgroundColor?: string;
        padding?: number;
      };
    }>;
  };
  icon?: string;
  badge?: {
    text: string;
    color: string;
  };
  openInNewTab: boolean;
  children: MenuItem[];
  order: number;
}

export interface Menu {
  _id: string;
  name: string;
  slug: string;
  location: 'header' | 'footer' | 'sidebar' | 'mobile' | 'custom';
  description?: string;
  items: MenuItem[];
  settings: {
    style: 'horizontal' | 'vertical' | 'mega' | 'flyout' | 'accordion';
    showIcons: boolean;
    maxDepth: number;
    mobileBreakpoint: number;
  };
  isActive: boolean;
  storeId: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  _id: string;
  title: string;
  slug: string;
  useLayout: boolean;
  layoutId?: string;
  content?: string;
  featuredImage?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  };
  status: 'published' | 'draft';
  showInFooter: boolean;
  footerGroup?: string;
  showInHeader: boolean;
  template: 'default' | 'full-width' | 'sidebar' | 'landing';
  sortOrder: number;
  storeId: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory?: string | BlogCategory;
  level: number;
  path: string;
  postCount: number;
  isActive: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  categoryIds: (string | BlogCategory)[];
  tags?: string[];
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
    userId?: string;
  };
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  publishedAt?: string;
  scheduledAt?: string;
  allowComments: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Content Module Types ---

export interface Banner {
  _id: string;
  storeId: string | { _id: string; name: string };
  name: string;
  image: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  alignment: 'left' | 'center' | 'right';
  overlay: {
    enabled: boolean;
    color: string;
    opacity: number;
  };
  textColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerSlide {
  bannerId?: string;
  image?: string;
  mobileImage?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  alignment?: 'left' | 'center' | 'right';
  textColor?: string;
  order: number;
}

export interface BannerSlider {
  _id: string;
  storeId: string | { _id: string; name: string };
  name: string;
  slides: BannerSlide[];
  settings: {
    autoplay: boolean;
    interval: number;
    showArrows: boolean;
    showDots: boolean;
    pauseOnHover: boolean;
    effect: 'slide' | 'fade';
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  _id: string;
  storeId: string | { _id: string; name: string };
  customerName: string;
  customerTitle?: string;
  customerImage?: string;
  content: string;
  rating?: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrandLogo {
  image: string;
  alt: string;
  link?: string;
  order: number;
}

export interface BrandShowcase {
  _id: string;
  storeId: string | { _id: string; name: string };
  name: string;
  logos: BrandLogo[];
  settings: {
    layout: 'grid' | 'carousel';
    columns: number;
    grayscale: boolean;
    hoverEffect: boolean;
    autoplay: boolean;
    interval: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
