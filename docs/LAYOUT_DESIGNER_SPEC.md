# Layout Designer System - Technical Specification

> **Purpose**: This document defines the complete specification for the Layout Designer feature.  
> **Last Updated**: 2025-12-14  
> **Status**: Approved - Ready for Implementation

---

## 📋 Overview

The Layout Designer System allows store admins to visually design their storefront pages without coding. It's a modular, theme-based page builder similar to Shopify's theme editor or WordPress Elementor.

### Key Features
- **Page Layout Designer** - Homepage, Category, Product, Search, Blog, Static Pages
- **Module System** - Drag-and-drop content blocks
- **Menu Designer** - Mega menu, Flyout, Accordion navigation
- **Header & Footer Designer** - Global elements
- **Blog System** - Categories and posts with rich content
- **Static Page Management** - About, Contact, Privacy, etc.
- **Theme System** - Support for multiple themes (future marketplace)

### Design Decisions
| Decision | Choice | Reason |
|----------|--------|--------|
| Real-time preview | No | Too heavy; save & refresh approach |
| Version control | No | Not needed for MVP |
| Template library | Yes | Quick-start layouts |
| Header/Footer | Global | Same across all pages |
| Dynamic content | Placeholder modules | Movable but not removable |
| Rich Text Editor | TipTap | Modern, React-first, customizable |
| Drag-and-Drop | @dnd-kit | Modern, accessible, performant |

---

## 🏗️ Architecture

```
THEME → GLOBAL ELEMENTS (Header/Footer) → PAGE LAYOUTS → SECTIONS → MODULES
```

### Hierarchy
1. **Theme**: Colors, fonts, styling, available modules
2. **Global Elements**: Header layout, Footer layout (shared across pages)
3. **Page Layouts**: Per page type (homepage, category, product, etc.)
4. **Sections**: Full-width, container, or multi-column row
5. **Modules**: Actual content blocks (banner, text, carousel, etc.)

---

## 📦 Backend Models

### 1. Theme
```typescript
interface ITheme {
  _id: ObjectId;
  storeId?: ObjectId;           // null = system theme
  name: string;
  slug: string;
  version: string;
  author: string;
  thumbnail: string;
  isSystemTheme: boolean;
  supportedModules: string[];
  defaultSettings: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    borderRadius: string;
    spacing: string;
  };
  stylesheetUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Layout
```typescript
interface ILayout {
  _id: ObjectId;
  storeId: ObjectId;
  themeId?: ObjectId;
  name: string;
  type: 'homepage' | 'category' | 'product' | 'search' | 'blog-list' | 'blog-post' | 'page';
  sections: ISection[];
  settings: {
    backgroundColor?: string;
    customCSS?: string;
  };
  isDefault: boolean;
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

interface ISection {
  id: string;                   // UUID
  name: string;
  type: 'full-width' | 'container' | 'split-2' | 'split-3';
  settings: {
    backgroundColor?: string;
    backgroundImage?: string;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    marginTop?: number;
    marginBottom?: number;
  };
  columns?: IColumn[];          // For split layouts
  modules: IModule[];           // For non-split layouts
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  order: number;
}

interface IColumn {
  id: string;
  width: number;                // Percentage
  modules: IModule[];
}

interface IModule {
  id: string;
  type: ModuleType;
  config: Record<string, any>;  // Module-specific config
  styling: {
    className?: string;
    customCSS?: string;
    marginTop?: number;
    marginBottom?: number;
  };
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  isPlaceholder: boolean;       // Required dynamic modules
  isRemovable: boolean;         // false for placeholders
  order: number;
}
```

### 3. Menu
```typescript
interface IMenu {
  _id: ObjectId;
  storeId: ObjectId;
  name: string;
  slug: string;
  location: 'header-main' | 'header-top' | 'footer-primary' | 'footer-secondary' | 'sidebar';
  items: IMenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface IMenuItem {
  id: string;
  label: string;
  type: 'link' | 'category' | 'product' | 'page' | 'blog-category' | 'mega-menu' | 'divider';
  url?: string;
  categoryId?: ObjectId;
  productId?: ObjectId;
  pageId?: ObjectId;
  blogCategoryId?: ObjectId;
  megaMenu?: {
    columns: Array<{
      title: string;
      items: IMenuItem[];
      width: number;
    }>;
    featuredImage?: string;
    featuredLink?: string;
  };
  icon?: string;
  badge?: { text: string; color: string };
  openInNewTab: boolean;
  children: IMenuItem[];
  order: number;
}
```

### 4. Page (Static Pages)
```typescript
interface IPage {
  _id: ObjectId;
  storeId: ObjectId;
  title: string;
  slug: string;                 // "about-us", "contact"
  layoutId?: ObjectId;          // For layout-based pages
  content?: string;             // Rich text HTML for simple pages
  useLayout: boolean;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
  };
  status: 'draft' | 'published';
  showInFooter: boolean;
  footerGroup?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. BlogCategory
```typescript
interface IBlogCategory {
  _id: ObjectId;
  storeId: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: ObjectId;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. BlogPost
```typescript
interface IBlogPost {
  _id: ObjectId;
  storeId: ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;              // Rich text HTML
  featuredImage?: string;
  categoryIds: ObjectId[];
  tags: string[];
  author: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  relatedProducts?: ObjectId[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
  };
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: Date;
  scheduledAt?: Date;
  viewCount: number;
  allowComments: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 7. HeaderLayout
```typescript
interface IHeaderLayout {
  _id: ObjectId;
  storeId: ObjectId;
  name: string;
  sections: {
    topBar: {
      enabled: boolean;
      backgroundColor?: string;
      textColor?: string;
      content?: string;         // Simple text or HTML
      modules?: IModule[];
    };
    main: {
      backgroundColor?: string;
      sticky: boolean;
      layout: 'logo-left' | 'logo-center' | 'logo-right';
      showSearch: boolean;
      searchStyle: 'inline' | 'icon' | 'expandable';
      showCart: boolean;
      showAccount: boolean;
      modules: IModule[];
    };
    navigation: {
      enabled: boolean;
      backgroundColor?: string;
      menuId?: ObjectId;
    };
  };
  mobileSettings: {
    hamburgerPosition: 'left' | 'right';
    mobileMenuStyle: 'slide' | 'fullscreen';
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8. FooterLayout
```typescript
interface IFooterLayout {
  _id: ObjectId;
  storeId: ObjectId;
  name: string;
  sections: {
    main: {
      backgroundColor?: string;
      textColor?: string;
      columns: Array<{
        title?: string;
        type: 'menu' | 'text' | 'contact' | 'social' | 'newsletter';
        menuId?: ObjectId;
        content?: string;
        contactInfo?: {
          address?: string;
          phone?: string;
          email?: string;
        };
        width: number;
      }>;
    };
    bottom: {
      backgroundColor?: string;
      content?: string;         // Copyright text
      showPaymentIcons: boolean;
      paymentIcons?: string[];
      showSocialIcons: boolean;
      socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        linkedin?: string;
        pinterest?: string;
      };
    };
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🧩 Module Types

### Standard Modules
| Type | Purpose | Key Config |
|------|---------|------------|
| `banner` | Hero image with text overlay | image, mobileImage, title, subtitle, ctaText, ctaLink, alignment, overlay |
| `banner-slider` | Rotating banners | banners[], autoplay, interval, arrows, dots |
| `text-block` | Rich text content | content (HTML), alignment, maxWidth |
| `image` | Single image | src, alt, link, size, alignment |
| `image-gallery` | Image grid/masonry | images[], layout (grid/masonry), columns, gap |
| `video` | Video embed | source (youtube/vimeo/file), url, autoplay, muted, loop |
| `spacer` | Vertical space | height (px) |
| `divider` | Horizontal line | style (solid/dashed/dotted), color, width |
| `html` | Custom HTML | code |
| `newsletter` | Email signup form | title, description, buttonText, placeholder |
| `testimonials` | Customer reviews | items[], layout (carousel/grid), autoplay |
| `countdown` | Sale countdown | endDate, title, style |
| `brand-logos` | Brand showcase | logos[], layout (grid/carousel) |

### Product Modules
| Type | Purpose | Key Config |
|------|---------|------------|
| `product-carousel` | Horizontal scroll | source, limit, columns, showPrice, showRating, showCart, autoplay |
| `product-grid` | Product grid | source, limit, columns, showFilters, showSort |
| `category-showcase` | Category cards | categoryIds[], style (card/banner), columns |
| `featured-product` | Single highlight | productId, showDescription, showReviews |

#### Product Source Options
- `manual` - Admin-selected product IDs
- `category` - Products from specific category
- `bestselling` - Top selling products
- `new-arrivals` - Latest products
- `sale` - Products on sale
- `viewed` - Recently viewed (needs cookies)
- `related` - Related products (product page only)
- `attribute` - Filter by attribute values

### Placeholder Modules (Page-Specific, Required)
| Page Type | Module | Purpose |
|-----------|--------|---------|
| Category | `category-header` | Category name, description, image, breadcrumbs |
| Category | `category-products` | Product listing with filters/sort (configurable columns, per page) |
| Product | `product-details` | Gallery, title, price, variants, add to cart, tabs, reviews |
| Search | `search-results` | Search box + results grid |
| Blog List | `blog-listing` | Blog post grid with pagination |
| Blog Post | `blog-content` | Post title, featured image, content, author, date |

### Navigation Modules
| Type | Purpose | Key Config |
|------|---------|------------|
| `menu` | Render a menu | menuId, style (horizontal/vertical/mega/flyout) |
| `logo` | Store logo | size (small/medium/large), link |
| `search-bar` | Search input | style (full/icon), placeholder |
| `cart-icon` | Cart button | showCount, showAmount |
| `account-icon` | Account dropdown | showName |
| `social-icons` | Social links | platforms, style (icon/circle/square), size |
| `language-selector` | Language switch | (future feature) |
| `currency-selector` | Currency switch | (future feature) |

---

## 📡 API Endpoints

### Theme APIs
```
GET    /api/themes                      List themes
GET    /api/themes/:id                  Get theme
POST   /api/themes                      Create theme
PUT    /api/themes/:id                  Update theme
DELETE /api/themes/:id                  Delete theme
POST   /api/themes/:id/activate         Activate for store
```

### Layout APIs
```
GET    /api/layouts                     List layouts
GET    /api/layouts/:id                 Get layout
POST   /api/layouts                     Create layout
PUT    /api/layouts/:id                 Update layout
DELETE /api/layouts/:id                 Delete layout
POST   /api/layouts/:id/duplicate       Clone layout
GET    /api/layouts/templates           Template library
POST   /api/layouts/from-template/:id   Create from template
POST   /api/layouts/:id/set-default     Set as default for type
```

### Menu APIs
```
GET    /api/menus                       List menus
GET    /api/menus/:id                   Get menu with items
POST   /api/menus                       Create menu
PUT    /api/menus/:id                   Update menu
DELETE /api/menus/:id                   Delete menu
```

### Page APIs
```
GET    /api/pages                       List pages
GET    /api/pages/:id                   Get page
POST   /api/pages                       Create page
PUT    /api/pages/:id                   Update page
DELETE /api/pages/:id                   Delete page
```

### Blog APIs
```
GET    /api/blog/categories             List categories
POST   /api/blog/categories             Create category
PUT    /api/blog/categories/:id         Update category
DELETE /api/blog/categories/:id         Delete category

GET    /api/blog/posts                  List posts
GET    /api/blog/posts/:id              Get post
POST   /api/blog/posts                  Create post
PUT    /api/blog/posts/:id              Update post
DELETE /api/blog/posts/:id              Delete post
```

### Header/Footer APIs
```
GET    /api/headers                     List header layouts
GET    /api/headers/:id                 Get header
POST   /api/headers                     Create header
PUT    /api/headers/:id                 Update header
DELETE /api/headers/:id                 Delete header

GET    /api/footers                     List footer layouts
GET    /api/footers/:id                 Get footer
POST   /api/footers                     Create footer
PUT    /api/footers/:id                 Update footer
DELETE /api/footers/:id                 Delete footer
```

### Storefront APIs (Public)
```
GET    /api/storefront/layout/:type     Get active layout for page type
GET    /api/storefront/menu/:location   Get menu by location
GET    /api/storefront/header           Get active header
GET    /api/storefront/footer           Get active footer
GET    /api/storefront/page/:slug       Get page by slug
GET    /api/storefront/blog             List published posts
GET    /api/storefront/blog/:slug       Get post by slug
GET    /api/storefront/theme            Get active theme settings
```

---

## 🎨 Admin Panel Pages

### New Pages Required
```
/layouts                    - Layout list (by type tabs)
/layouts/[id]/edit          - Layout Designer (drag-drop)
/layouts/templates          - Template library

/menus                      - Menu list
/menus/[id]/edit            - Menu designer

/pages                      - Static pages list
/pages/new                  - Create page
/pages/[id]/edit            - Edit page

/blog/categories            - Blog category list
/blog/categories/[id]/edit  - Edit category
/blog/posts                 - Blog post list
/blog/posts/new             - Create post
/blog/posts/[id]/edit       - Post editor with rich text

/header                     - Header designer
/footer                     - Footer designer
/themes                     - Theme selector
```

### Navigation Structure
```
Appearance
├── Theme
├── Header
├── Footer
├── Layouts
│   ├── Homepage
│   ├── Category Page
│   ├── Product Page
│   ├── Search Page
│   └── Templates
└── Menus

Content
├── Pages
└── Blog
    ├── Posts
    └── Categories
```

---

## 📁 File Structure

### Backend
```
backend/src/
├── models/
│   ├── Theme.ts
│   ├── Layout.ts
│   ├── Menu.ts
│   ├── Page.ts
│   ├── BlogCategory.ts
│   ├── BlogPost.ts
│   ├── HeaderLayout.ts
│   └── FooterLayout.ts
├── controllers/
│   ├── theme.controller.ts
│   ├── layout.controller.ts
│   ├── menu.controller.ts
│   ├── page.controller.ts
│   ├── blog.controller.ts
│   ├── header.controller.ts
│   └── footer.controller.ts
├── routes/
│   ├── theme.routes.ts
│   ├── layout.routes.ts
│   ├── menu.routes.ts
│   ├── page.routes.ts
│   ├── blog.routes.ts
│   ├── header.routes.ts
│   ├── footer.routes.ts
│   └── storefront.routes.ts
└── seeds/
    └── layout-templates.ts
```

### Admin Panel
```
admin/src/
├── app/
│   ├── layouts/
│   ├── menus/
│   ├── pages/
│   ├── blog/
│   ├── header/
│   ├── footer/
│   └── themes/
└── components/
    └── organisms/
        ├── LayoutDesigner/
        │   ├── LayoutDesigner.tsx
        │   ├── SectionEditor.tsx
        │   ├── ModulePalette.tsx
        │   ├── ModuleRenderer.tsx
        │   └── ModuleConfigPanel.tsx
        ├── MenuDesigner/
        ├── HeaderDesigner/
        ├── FooterDesigner/
        └── modules/
            ├── BannerConfig.tsx
            ├── TextBlockConfig.tsx
            ├── ProductCarouselConfig.tsx
            └── ... (one per module type)
```

---

## 📅 Implementation Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| 1 | Backend Models & APIs | Week 1 |
| 2 | Admin CRUD Pages | Week 2 |
| 3 | Layout Designer UI | Week 3-4 |
| 4 | Menu Designer | Week 4 |
| 5 | Header/Footer Designer | Week 5 |
| 6 | Theme System + Templates | Week 6 |

---

## 📌 Dependencies

### NPM Packages (Admin)
```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-link": "^2.x"
}
```
