# User and Customer Separation Architecture

## Overview

The authentication system has been refactored to **separate admin users from customers** for enhanced security and better data organization.

## Architecture

### Two Separate Models

#### 1. **User Model** (`/src/models/User.ts`)
- **Purpose**: Admin and store management accounts only
- **Roles**: `admin`, `store_admin`, `super_admin`
- **Use Case**: Backend administration, store management, content management
- **Security**: Higher password complexity (12 salt rounds), granular permissions

#### 2. **Customer Model** (`/src/models/Customer.ts`)
- **Purpose**: Customer/shopper accounts
- **Use Case**: Shopping, orders, wishlists, cart management
- **Features**: Addresses, wishlist, cart, preferences (currency, language, newsletter)

## API Endpoints

### Customer Authentication
**Base Path**: `/api/auth/customer`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register` | POST | Register new customer | No |
| `/login` | POST | Customer login | No |
| `/refresh` | POST | Refresh access token | No |
| `/me` | GET | Get customer profile | Yes |
| `/me` | PUT | Update customer profile | Yes |

**Example Customer Registration**:
```typescript
POST /api/auth/customer/register
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Admin Authentication
**Base Path**: `/api/auth/admin`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/register` | POST | Register new admin user | Yes (super_admin) |
| `/login` | POST | Admin login | No |
| `/refresh` | POST | Refresh access token | No |
| `/me` | GET | Get admin profile | Yes |
| `/me` | PUT | Update admin profile | Yes |

**Example Admin Login**:
```typescript
POST /api/auth/admin/login
{
  "email": "admin@example.com",
  "password": "SecureAdminPass123!"
}
```

## JWT Token Structure

### Customer Token
```json
{
  "id": "customer_id",
  "email": "customer@example.com",
  "type": "customer"
}
```

### Admin Token
```json
{
  "id": "user_id",
  "email": "admin@example.com",
  "role": "admin",
  "storeId": "store_id",
  "type": "admin"
}
```

## Security Benefits

### 1. **Separation of Concerns**
- Customer data is completely isolated from admin data
- Different database collections
- Different authentication flows

### 2. **Enhanced Security**
- Admin accounts have stronger password requirements (8+ chars vs 6+)
- Admin passwords use 12 salt rounds vs 10 for customers
- Token type validation prevents cross-use of tokens
- Granular permissions for admin users

### 3. **Better Data Management**
- Customers have shopping-specific fields (cart, wishlist, addresses)
- Admins have management-specific fields (permissions, storeId)
- Cleaner data models without mixed concerns

### 4. **Scalability**
- Can implement different rate limiting for customers vs admins
- Can scale customer and admin databases independently
- Easier to implement role-specific features

## Model Comparison

### User (Admin) Model Fields
```typescript
{
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: 'admin' | 'store_admin' | 'super_admin'
  storeId?: ObjectId
  isActive: boolean
  emailVerified: boolean
  permissions?: string[]
  lastLogin?: Date
}
```

### Customer Model Fields
```typescript
{
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  isActive: boolean
  emailVerified: boolean
  addresses: Address[]
  wishlist: ObjectId[]
  cart?: ObjectId
  preferences: {
    currency?: string
    language?: string
    newsletter?: boolean
  }
  lastLogin?: Date
}
```

## Migration from Old System

If you have existing data with the old unified User model:

### 1. **Identify User Types**
```javascript
// Find all customer users
const customers = await OldUser.find({ role: 'customer' });

// Find all admin users
const admins = await OldUser.find({ role: { $in: ['admin', 'store_admin'] } });
```

### 2. **Migrate Customers**
```javascript
for (const oldUser of customers) {
  await Customer.create({
    email: oldUser.email,
    password: oldUser.password, // Already hashed
    firstName: oldUser.firstName,
    lastName: oldUser.lastName,
    phone: oldUser.phone,
    addresses: oldUser.addresses,
    isActive: oldUser.isActive,
    emailVerified: oldUser.emailVerified,
    createdAt: oldUser.createdAt,
    updatedAt: oldUser.updatedAt,
  });
}
```

### 3. **Migrate Admins**
```javascript
for (const oldUser of admins) {
  await User.create({
    email: oldUser.email,
    password: oldUser.password, // Already hashed
    firstName: oldUser.firstName,
    lastName: oldUser.lastName,
    phone: oldUser.phone,
    role: oldUser.role === 'admin' ? 'admin' : 'store_admin',
    storeId: oldUser.storeId,
    isActive: oldUser.isActive,
    emailVerified: oldUser.emailVerified,
    createdAt: oldUser.createdAt,
    updatedAt: oldUser.updatedAt,
  });
}
```

## Frontend Integration

### Customer App (Next.js Frontend)
```typescript
// Use customer endpoints
const API_BASE = 'http://localhost:3001/api/auth/customer';

// Register
await fetch(`${API_BASE}/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, firstName, lastName })
});

// Login
const response = await fetch(`${API_BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { customer, accessToken } = await response.json();
```

### Admin Panel (Next.js Admin)
```typescript
// Use admin endpoints
const API_BASE = 'http://localhost:3001/api/auth/admin';

// Login
const response = await fetch(`${API_BASE}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { user, accessToken } = await response.json();
```

## Best Practices

### 1. **Token Storage**
- Store customer and admin tokens separately
- Use different storage keys: `customer_token` vs `admin_token`
- Never mix customer and admin sessions

### 2. **API Calls**
- Always use the correct base path for the user type
- Include token type in Authorization header metadata if needed
- Validate token type on protected routes

### 3. **Error Handling**
- Different error messages for customers vs admins
- Customer-friendly messages for customer endpoints
- Technical details for admin endpoints

### 4. **Rate Limiting**
- Implement stricter rate limits for customer endpoints
- More lenient limits for admin endpoints
- Different rate limit strategies per user type

## Swagger Documentation

Both customer and admin endpoints are fully documented in Swagger UI:

- **Customer Auth**: Tag `Customer Auth`
- **Admin Auth**: Tag `Admin Auth`

Visit: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

## Security Considerations

### ⚠️ Important Notes

1. **Admin Registration**: In production, the `/api/auth/admin/register` endpoint should be protected and only accessible to `super_admin` users

2. **First Admin Setup**: For initial setup, you may need to manually create the first super admin in the database:
```javascript
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const createFirstAdmin = async () => {
  const hashedPassword = await bcrypt.hash('YourSecurePassword', 12);
  await User.create({
    email: 'superadmin@example.com',
    password: hashedPassword,
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin',
    isActive: true,
    emailVerified: true,
  });
};
```

3. **Token Validation**: Always validate the `type` field in JWT tokens to prevent customers from accessing admin endpoints and vice versa

4. **CORS Configuration**: Configure different CORS policies for customer and admin frontends

## File Structure

```
src/
├── models/
│   ├── User.ts           # Admin user model
│   └── Customer.ts       # Customer model
├── controllers/
│   ├── admin-auth.controller.ts    # Admin authentication
│   └── customer-auth.controller.ts # Customer authentication
├── routes/
│   ├── admin-auth.routes.ts        # Admin routes
│   ├── customer-auth.routes.ts     # Customer routes
│   └── index.ts                    # Route aggregator
└── middleware/
    └── auth.ts                     # Shared authentication middleware
```

## Summary

This architecture provides:
- ✅ **Better Security**: Separate models and authentication flows
- ✅ **Cleaner Code**: No mixed concerns in models
- ✅ **Scalability**: Independent scaling of customer and admin systems
- ✅ **Flexibility**: Different features and permissions per user type
- ✅ **Maintainability**: Easier to understand and modify

---

**For questions or issues, refer to the Swagger documentation or contact the development team.**
