# Infi-Commerce - Multi-Store Ecommerce Platform

A comprehensive multi-store ecommerce platform with Express.js backend API, Next.js customer frontend, and Next.js admin panel.

## Project Structure

```
infi-commerce/
├── backend/          # Express.js API
├── frontend/         # Next.js customer-facing storefront
├── admin/            # Next.js admin panel
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd infi-commerce
```

2. Install dependencies for all projects
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Admin
cd ../admin
npm install
```

3. Set up environment variables

Copy `.env.example` to `.env` in each project and configure:
- Backend: MongoDB connection, JWT secrets, payment gateway credentials
- Frontend: API URL, Google Analytics ID
- Admin: API URL

### Running the Projects

**Backend API** (Port 5000)
```bash
cd backend
npm run dev
```

**Frontend** (Port 3000)
```bash
cd frontend
npm run dev
```

**Admin Panel** (Port 3001)
```bash
cd admin
npm run dev
```

## Features

### Multi-Store Support
- Subdomain-based store routing
- Store-specific products, categories, and settings
- Multi-currency support

### Product Management
- Simple, variable, and digital products
- Product variants with attributes
- Inventory management
- SEO optimization for each product

### Advanced Shipping
- Weight-based shipping calculator
- Geo-location based rates (country/region/city)
- Category-based rules
- Custom conditional logic

### Payment Gateways
- Razorpay (India)
- Stripe (International)
- PayPal
- Automatic gateway selection based on billing address

### SEO & AI Optimization
- Structured data (JSON-LD)
- Open Graph and Twitter Cards
- XML sitemaps
- Optimized for AI crawler discoverability

### Analytics
- Google Analytics 4 integration
- Complete e-commerce tracking
- Custom event tracking

## Tech Stack

**Backend**
- Express.js with TypeScript
- MongoDB with Mongoose
- JWT authentication
- Payment gateway SDKs (Razorpay, Stripe, PayPal)

**Frontend & Admin**
- Next.js 16 with TypeScript
- Tailwind CSS + SCSS
- React 19

## License

ISC
