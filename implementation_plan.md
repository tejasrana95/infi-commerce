# Multi-Store Ecommerce Platform Implementation Plan

A comprehensive ecommerce platform with multi-store support, featuring a Next.js frontend, Express.js backend API, and dedicated admin panel. The system will support international shipping, multi-currency, advanced SEO optimization for AI discoverability, and flexible payment gateway integration.

## User Review Required

> [!IMPORTANT]
> **Architecture Decision: Three Separate Applications**
> - **Backend API** (`api.domain.com`): Express.js REST API with PostgreSQL/MongoDB
> - **Admin Panel** (`admin.domain.com`): Next.js application for store management
> - **Customer Frontend** (`www.domain.com` or `store.domain.com`): Next.js storefront
> 
> Should these be in separate repositories or a monorepo structure?

> [!IMPORTANT]
> **Database Selection**
> - **PostgreSQL**: Better for complex relationships, ACID compliance, strong for multi-store data integrity
> - **MongoDB**: More flexible schema, easier for product variants and nested data
> 
> Which database would you prefer? (Recommendation: PostgreSQL for this use case)

> [!WARNING]
> **Multi-Store Strategy**
> - **Option A**: Subdomain-based stores (`store1.domain.com`, `store2.domain.com`)
> - **Option B**: Path-based stores (`domain.com/store1`, `domain.com/store2`)
> - **Option C**: Separate domains with shared backend (`store1.com`, `store2.com`)
> 
> Which approach fits your business model?

> [!IMPORTANT]
> **AI/SEO Optimization for Product Discovery**
> To make products discoverable by ChatGPT, Gemini, and M365 Copilot:
> - Implement comprehensive structured data (JSON-LD) with Product, Offer, Review schemas
> - Create detailed product descriptions with semantic markup
> - Generate AI-friendly content summaries
> - Implement OpenGraph and Twitter Card metadata
> - Create XML sitemaps with rich product information
> - Add robots.txt with AI crawler allowances
> 
> Note: Direct integration with AI tools for product suggestions requires API partnerships. We'll optimize for web crawling and structured data instead.

## Proposed Changes

### Backend API (Express.js) - New Project

#### Project Structure
```
backend/
├── src/
│   ├── config/          # Database, environment configs
│   ├── models/          # Database models/schemas
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Business logic
│   ├── utils/           # Helpers, calculators
│   └── server.ts        # Entry point
├── package.json
└── tsconfig.json
```

#### [NEW] Core Database Models
- **Store**: Multi-store configuration, settings, domains
- **User**: Customer accounts with authentication
- **Product**: Simple/variable/digital products with variants
- **Category**: Product categorization with hierarchy
- **Cart**: Persistent cart for logged-in users
- **Order**: Order management with status tracking
- **ShippingRule**: Geo-based and category-based shipping rules
- **PaymentGateway**: Payment gateway configurations per region
- **Currency**: Multi-currency support with exchange rates

#### [NEW] Key API Endpoints
**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (JWT)
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user profile
- `GET /api/auth/google` - Google OAuth login (NEW)
- `GET /api/auth/google/callback` - Google OAuth callback (NEW)
- `GET /api/auth/facebook` - Facebook OAuth login (NEW)
- `GET /api/auth/facebook/callback` - Facebook OAuth callback (NEW)
- `POST /api/auth/phone/send-otp` - Send OTP via Firebase (NEW)
- `POST /api/auth/phone/verify-otp` - Verify OTP (NEW)

**Products**
- `GET /api/stores/:storeId/products` - List products with filters
- `GET /api/stores/:storeId/products/:id` - Product details with SEO metadata
- `GET /api/stores/:storeId/categories` - Category tree

**Cart**
- `GET /api/cart` - Get user's cart (authenticated)
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item

**Checkout & Orders**
- `POST /api/checkout/calculate-shipping` - Calculate shipping based on rules
- `POST /api/checkout/create-order` - Create order
- `GET /api/orders/:id` - Order details
- `GET /api/user/orders` - User order history

**Shipping Calculator**
- Custom rule engine supporting:
  - Weight-based rates per kg
  - Geo-location based rates (country/region)
  - Category-based rules (e.g., free shipping for marble deity in India)
  - Conditional logic (if product.category === 'marble-deity' && country === 'IN' then free)

**Payment Gateway Selection**
- Logic to select gateway based on billing address:
  - India → Razorpay
  - International → Stripe/PayPal
- Webhook handlers for payment confirmations

**Admin APIs**
- Store CRUD operations
- Product management (simple/variable/digital)
- Shipping rule configuration
- Order management
- Analytics data endpoints

---

### Frontend (Next.js) - Current Project

#### [MODIFY] [next.config.ts](file:///Volumes/Drive/Projects/BitBucket/infi-commerce/next.config.ts)
- Add environment variables for API URL
- Configure image optimization
- Set up internationalization (i18n) for multi-currency
- Add security headers
- Configure rewrites for multi-store routing

#### [NEW] Project Structure
```
src/
├── app/
│   ├── (store)/              # Store-specific routes
│   │   ├── [storeId]/
│   │   │   ├── page.tsx      # Store homepage
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   └── account/
│   ├── api/                  # Next.js API routes (if needed)
│   ├── layout.tsx
│   └── globals.scss
├── components/
│   ├── common/               # Shared components
│   ├── product/              # Product-related components
│   ├── cart/                 # Cart components
│   └── checkout/             # Checkout flow
├── lib/
│   ├── api-client.ts         # API communication
│   ├── analytics.ts          # Google Analytics 4
│   ├── auth.ts               # Authentication helpers
│   └── seo.ts                # SEO utilities
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript types
└── utils/                    # Utility functions
```

#### [MODIFY] [layout.tsx](file:///Volumes/Drive/Projects/BitBucket/infi-commerce/src/app/layout.tsx#L15-L18)
- Update metadata for SEO optimization
- Add JSON-LD structured data
- Integrate Google Analytics 4
- Add Open Graph and Twitter Card metadata

#### [NEW] SEO Implementation
**Metadata Generation**
- Dynamic metadata per page using Next.js `generateMetadata`
- Product schema with JSON-LD (Product, Offer, AggregateRating)
- Breadcrumb schema for navigation
- Organization schema for store information

**AI Crawler Optimization**
- Semantic HTML5 markup
- Descriptive alt text for images
- Rich product descriptions with natural language
- FAQ schema for product Q&A
- Review schema for customer reviews

#### [NEW] Google Analytics 4 Integration
- Track page views
- Track product views, add to cart, checkout steps
- Track purchase events with transaction data
- Custom events for user interactions
- E-commerce tracking with enhanced measurement

#### [NEW] Multi-Currency Support
- Currency selector component
- Price display with currency conversion
- Store currency preference in cookies/localStorage
- Sync with backend for checkout

#### [NEW] Cart Persistence
- Sync cart with backend for authenticated users
- LocalStorage fallback for guest users
- Merge cart on login

#### [NEW] Payment Integration
- Dynamic payment gateway selection based on region
- Razorpay integration for India
- Stripe integration for international
- PayPal as alternative option

---

### Admin Panel - New Next.js Application

#### Project Structure
```
admin/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── stores/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── shipping/
│   │   ├── settings/
│   │   └── analytics/
│   ├── components/
│   ├── lib/
│   └── types/
└── package.json
```

#### [NEW] Key Features
**Store Management**
- Create/edit/delete stores
- Configure store settings (domain, currency, timezone)
- Store-specific branding

**Product Management**
- Product CRUD with image upload
- Simple product creation
- Variable product with attributes (size, color, etc.)
- Digital product with file upload
- Inventory management
- SEO metadata editor

**Shipping Rules Configuration**
- Visual rule builder
- Weight-based rate configuration
- Geo-location based rules (country/region/city)
- Category-based rules
- Conditional logic editor
- Rule priority management

**Order Management**
- Order listing with filters
- Order details with status tracking
- Shipping label generation
- Refund processing

**Analytics Dashboard**
- Sales overview
- Product performance
- Customer insights
- Traffic sources (from Google Analytics API)

**Payment Gateway Settings**
- Configure Razorpay credentials
- Configure Stripe credentials
- Configure PayPal credentials
- Set region-based gateway rules

**Social Authentication Configuration (NEW)**
- Configure Google OAuth (Client ID, Client Secret)
- Configure Facebook OAuth (App ID, App Secret)
- Configure Firebase (Project ID, Service Account)
- Enable/disable social providers per store
- Test social login flows

---

### Additional Features

#### [NEW] Digital Product Support
**Backend**
- File upload and storage (AWS S3 or local storage)
- Secure download link generation with expiry
- Download tracking

**Frontend**
- Digital product display
- Instant download after purchase
- Download history in user account

#### [NEW] International Shipping
**Shipping Calculator Service**
- Weight calculation from product data
- Geo-location detection (IP-based or user input)
- Rule evaluation engine
- Rate calculation with currency conversion

**Example Rule Structure**
```typescript
{
  id: 'rule-1',
  name: 'USA Marble Deity Shipping',
  conditions: {
    country: 'US',
    category: 'marble-deity'
  },
  rate: {
    type: 'per-kg',
    amount: 1300,
    currency: 'INR'
  }
}
```

#### [NEW] Multi-Payment Gateway
**Gateway Selection Logic**
```typescript
function selectPaymentGateway(billingAddress) {
  if (billingAddress.country === 'IN') {
    return 'razorpay';
  } else {
    return ['stripe', 'paypal']; // Show both options
  }
}
```

**Integration Requirements**
- Razorpay SDK integration
- Stripe SDK integration
- PayPal SDK integration
- Webhook handlers for each gateway
- Payment status synchronization

## Verification Plan

### Automated Tests

**Backend API Tests**
```bash
# Unit tests for shipping calculator
npm test -- src/services/shipping-calculator.test.ts

# Integration tests for cart persistence
npm test -- src/controllers/cart.test.ts

# Payment gateway integration tests
npm test -- src/services/payment.test.ts
```

**Frontend Tests**
```bash
# Component tests
npm test

# E2E tests with Playwright (to be added)
npm run test:e2e
```

### Manual Verification

**Multi-Store Functionality**
1. Create two stores via admin panel
2. Access each store via different subdomains/paths
3. Verify products are store-specific
4. Verify separate cart and checkout flows

**Cart Persistence**
1. Add products to cart while logged in
2. Log out and log in from different browser
3. Verify cart items are preserved

**Shipping Calculator**
1. Create shipping rule: "USA - $13/kg for marble deity"
2. Create shipping rule: "India - Free shipping for marble deity"
3. Add marble deity product to cart
4. Change shipping address to USA → Verify $13/kg rate
5. Change shipping address to India → Verify free shipping

**Payment Gateway Selection**
1. Set billing address to India → Verify Razorpay appears
2. Set billing address to USA → Verify Stripe/PayPal appears
3. Complete test payment with each gateway

**SEO & AI Optimization**
1. Use Google Rich Results Test to validate structured data
2. Check robots.txt and sitemap.xml generation
3. Verify Open Graph tags with Facebook Debugger
4. Test product page metadata with SEO tools

**Google Analytics**
1. Set up GA4 property
2. Navigate through site and verify events in GA4 real-time
3. Add product to cart → Verify "add_to_cart" event
4. Complete purchase → Verify "purchase" event with transaction data

**Multi-Currency**
1. Select different currency (USD, EUR, INR)
2. Verify prices update across site
3. Complete checkout and verify order total in selected currency

### Browser Testing
```typescript
// Use browser_subagent to test:
// 1. Complete checkout flow
// 2. Product browsing and filtering
// 3. User registration and login
// 4. Cart operations
// 5. Responsive design on mobile/tablet
```

### User Acceptance Testing
After deployment, request user to:
1. Test complete purchase flow on staging environment
2. Verify admin panel functionality for store management
3. Test shipping calculator with real-world scenarios
4. Validate payment gateway integration with test transactions
5. Review SEO implementation and structured data

---

## Implementation Phases

**Phase 1: Backend Foundation** (Week 1-2)
- Set up Express.js project with TypeScript
- Design and implement database schema
- Implement authentication system
- Create core API endpoints (products, stores, users)

**Phase 2: Frontend Core** (Week 2-3)
- Set up Next.js routing for multi-store
- Implement product listing and detail pages
- Build cart functionality with persistence
- Integrate authentication

**Phase 3: Advanced Features** (Week 3-4)
- Implement shipping calculator with custom rules
- Integrate payment gateways
- Add multi-currency support
- Implement digital product downloads

**Phase 4: Admin Panel** (Week 4-5)
- Build admin authentication
- Create store management interface
- Implement product management (simple/variable/digital)
- Build shipping rule configuration UI

**Phase 5: SEO & Analytics** (Week 5-6)
- Implement comprehensive SEO optimization
- Add structured data for AI discoverability
- Integrate Google Analytics 4
- Create sitemaps and robots.txt

**Phase 6: Testing & Deployment** (Week 6-7)
- Write automated tests
- Perform manual testing
- Deploy to staging
- User acceptance testing
- Production deployment

---

## Technology Stack Summary

**Backend**
- Express.js with TypeScript
- PostgreSQL (recommended) or MongoDB
- JWT for authentication
- AWS S3 for file storage (digital products)
- Redis for session management (optional)

**Frontend**
- Next.js 16 with TypeScript
- Tailwind CSS + SCSS
- React 19
- Google Analytics 4
- Payment SDKs (Razorpay, Stripe, PayPal)

**Admin Panel**
- Next.js with TypeScript
- Tailwind CSS
- Chart.js or Recharts for analytics

**DevOps**
- Docker for containerization
- GitHub Actions for CI/CD
- Vercel/AWS for hosting
