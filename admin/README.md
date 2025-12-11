# Infi Commerce Admin Panel

A modern, responsive admin panel for managing your e-commerce platform built with **Next.js 14**, **TypeScript**, **Material-UI v5**, and **Atomic Design Pattern**.

## ✨ Features

### 🔐 Authentication
- Secure admin login with JWT tokens
- Protected routes with authentication middleware
- Auto-redirect to dashboard on successful login
- Material-UI login form with gradient background

### 📊 Dashboard
- Overview of key metrics with StatCards
- Quick access to all management sections
- Fully responsive sidebar navigation
- Mobile-friendly drawer menu

### 📦 Product Management
- Create, read, update, delete products
- Product details: name, SKU, price, sale price, cost, stock
- Category and store assignment
- Active/inactive status toggle
- Responsive DataTable (mobile card view)

### 📂 Category Management
- Hierarchical category structure
- Parent-child category relationships
- Auto-generate slugs from category names
- Category descriptions and images
- Mobile-responsive table view

### 🏷️ Attribute Management
- Product attribute definitions
- Multiple attribute types: text, select, number, boolean
- Required/optional attribute settings
- Comma-separated values for select attributes

### 🏪 Store Management
- Multi-store support
- Store domains and currency settings
- Store-level configurations

### 💰 Sales & Promotions
- Create discount campaigns
- Percentage or fixed amount discounts
- Time-based promotions (start/end dates)
- Apply to products or categories

### 💱 Currency Management
- Multiple currency support
- Exchange rate management
- Currency symbols and codes (ISO 4217)

### 🌍 Geographic Management
- Countries, states, cities, zones
- Hierarchical geo structure
- ISO country codes

### 🗺️ Geo Groups
- Group multiple locations
- Used for shipping rules
- Multi-select location picker

### 🚚 Shipping Rules
- Weight-based shipping costs
- Order value-based rules
- Geographic restrictions
- Estimated delivery days

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Navigate to the admin directory:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. Run the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
admin/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── dashboard/          # Dashboard with StatCards (MUI)
│   │   ├── products/           # Product management (MUI)
│   │   ├── categories/         # Category management (MUI)
│   │   ├── attributes/         # Attribute management (MUI)
│   │   ├── stores/             # Store management (MUI)
│   │   ├── sales/              # Sales management (MUI)
│   │   ├── currencies/         # Currency management (MUI)
│   │   ├── geo/                # Geo management (MUI)
│   │   ├── geo-groups/         # Geo groups management (MUI)
│   │   ├── shipping/           # Shipping rules management (MUI)
│   │   ├── login/              # Login page (MUI gradient)
│   │   ├── layout.tsx          # Root layout with MUIThemeProvider
│   │   └── page.tsx            # Root redirect
│   ├── components/             # Atomic Design Components
│   │   ├── atoms/              # Basic components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── StatusChip.tsx
│   │   │   └── IconButton.tsx
│   │   ├── molecules/          # Composite components
│   │   │   ├── PageHeader.tsx
│   │   │   ├── DataTable.tsx   # Responsive table
│   │   │   ├── FormField.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── StatCard.tsx
│   │   ├── organisms/          # Complex components
│   │   │   ├── AppLayout.tsx   # Responsive drawer layout
│   │   │   └── LoginForm.tsx
│   │   ├── DashboardLayout.tsx # Layout wrapper
│   │   └── ProtectedRoute.tsx  # Auth protection
│   ├── theme/                  # Material-UI Theme
│   │   ├── theme.ts            # Custom theme config
│   │   └── MUIThemeProvider.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/                    # Utilities
│   │   └── api.ts              # Axios API client
│   └── types/                  # TypeScript types
│       └── index.ts            # Shared type definitions
├── .env.local                  # Environment variables
├── MIGRATION_GUIDE.md          # MUI migration guide
├── MUI_MIGRATION_SUMMARY.md    # Complete migration summary
└── package.json
```

## Tech Stack

### Core
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Material-UI v5** - Modern UI component library
- **Emotion** - CSS-in-JS styling

### Design
- **Atomic Design Pattern** - Scalable component architecture
- **Responsive Design** - Mobile-first approach
- **Custom Theme** - Brand colors (#667eea, #764ba2)

### State Management
- **React Context** - Authentication state
- **React Hooks** - Component state

### HTTP Client
- **Axios** - API requests with interceptors

## Mobile Responsiveness

The admin panel is fully responsive:
- **Navigation**: Hamburger menu on mobile, permanent sidebar on desktop
- **Tables**: Card view on mobile (< 960px), table view on desktop
- **Forms**: Full-width inputs on mobile
- **Grid**: Proper breakpoints (xs, sm, md, lg, xl)
- **Touch-friendly**: Large tap targets for mobile users

## API Integration

The admin panel integrates with the backend API using the following endpoints:

- **Authentication**: `/auth/admin/login`
- **Products**: `/products`
- **Categories**: `/categories`
- **Attributes**: `/attributes`
- **Stores**: `/stores`
- **Sales**: `/sales`
- **Currencies**: `/currencies`
- **Geo**: `/geo`
- **Geo Groups**: `/geo-groups`
- **Shipping**: `/shipping`

All requests include JWT authentication tokens in the `Authorization` header.

## Styling

The admin panel uses:
- **SCSS Modules** for component-specific styles
- **Responsive design** with mobile-first approach
- **Gradient themes** (purple-blue gradient)
- **Modern UI** with smooth transitions and shadows

## Authentication Flow

1. User enters credentials on `/login`
2. API validates and returns JWT token
3. Token stored in localStorage
4. Token included in all subsequent API requests
5. Automatic logout on 401 responses
6. Protected routes redirect to login if not authenticated

## Default Login

Make sure you have created an admin user in your backend. You can use the backend's admin registration endpoint or seed your database with an admin user.

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **SCSS** - Styling with modules
- **Axios** - HTTP client
- **React Hooks** - State management
- **JWT** - Authentication tokens

## Future Enhancements

- [ ] Dashboard analytics with charts (Recharts already installed)
- [ ] Image upload for products and categories
- [ ] Order management
- [ ] Customer management
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Export data (CSV, Excel)
- [ ] Email notifications
- [ ] Activity logs
- [ ] Role-based permissions (admin, manager, staff)

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.

## License

This project is part of the Infi Commerce e-commerce platform.
