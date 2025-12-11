# Role-Based Access Control (RBAC) - Security Documentation

## Overview

The Infi-Commerce API implements **Role-Based Access Control (RBAC)** to ensure that only authorized users can perform specific actions. This prevents security vulnerabilities like customers creating stores or accessing admin-only features.

## User Types & Roles

### 1. **Customers** (Customer Model)
- **Token Type**: `customer`
- **Permissions**: 
  - ✅ Browse stores (public)
  - ✅ View products
  - ✅ Manage own cart
  - ✅ Place orders
  - ✅ Manage own profile
  - ❌ **CANNOT** create/edit/delete stores
  - ❌ **CANNOT** access admin features

### 2. **Admins** (User Model)
Three admin roles with different permission levels:

#### **a) Store Admin** (`store_admin`)
- Manages a specific store
- **Permissions**:
  - ✅ Create stores
  - ✅ Update stores (own store)
  - ✅ Manage products in own store
  - ✅ View orders for own store
  - ❌ Cannot delete stores
  - ❌ Cannot toggle store status
  - ❌ Cannot manage other stores

#### **b) Admin** (`admin`)
- Platform administrator
- **Permissions**:
  - ✅ Create stores
  - ✅ Update any store
  - ✅ Delete stores
  - ✅ Toggle store status
  - ✅ Manage all products
  - ✅ View all orders

#### **c) Super Admin** (`super_admin`)
- Highest level of access
- **Permissions**:
  - ✅ All admin permissions
  - ✅ Create other admin users
  - ✅ Manage user roles
  - ✅ System configuration

## Authentication & Authorization Flow

### 1. **Authentication** (`authenticate` middleware)
Verifies that the user is logged in and has a valid JWT token.

```typescript
// Usage
router.get('/protected', authenticate, handler);
```

**What it checks**:
- ✅ Token exists in `Authorization` header
- ✅ Token is valid and not expired
- ✅ Token signature is correct

**Does NOT check**: User role or permissions

### 2. **Authorization** (`authorize` middleware)
Verifies that the authenticated user has the required role.

```typescript
// Usage - Only admins can access
router.post('/stores', authenticate, authorize('admin', 'super_admin'), createStore);
```

**What it checks**:
- ✅ User is authenticated (must come after `authenticate`)
- ✅ User's role matches one of the allowed roles
- ✅ Returns 403 Forbidden if role doesn't match

## Store CRUD Security

### Current Implementation

```typescript
// Public routes - Anyone can view
router.get('/', getStores);                    // ✅ Public
router.get('/:id', getStoreById);              // ✅ Public
router.get('/slug/:slug', getStoreBySlug);     // ✅ Public

// Protected routes - Admin only
router.post('/',                               // ✅ admin, store_admin, super_admin
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    createStore
);

router.put('/:id',                             // ✅ admin, store_admin, super_admin
    authenticate,
    authorize('admin', 'store_admin', 'super_admin'),
    updateStore
);

router.delete('/:id',                          // ✅ admin, super_admin ONLY
    authenticate,
    authorize('admin', 'super_admin'),
    deleteStore
);

router.patch('/:id/toggle-status',             // ✅ admin, super_admin ONLY
    authenticate,
    authorize('admin', 'super_admin'),
    toggleStoreStatus
);
```

### Security Test Results

#### ❌ **Customer Attempt to Create Store**
```bash
# Customer token used
curl -X POST /api/stores \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{"name":"Hacker Store",...}'

# Response: 403 Forbidden
{
  "error": "Forbidden: Insufficient permissions"
}
```

#### ✅ **Admin Successfully Creates Store**
```bash
# Admin token used
curl -X POST /api/stores \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"name":"Fashion Store",...}'

# Response: 201 Created
{
  "message": "Store created successfully",
  "store": {...}
}
```

## Token Structure

### Customer Token
```json
{
  "id": "customer_id",
  "email": "customer@example.com",
  "type": "customer",
  // NO role field - customers don't have roles
}
```

### Admin Token
```json
{
  "id": "user_id",
  "email": "admin@example.com",
  "role": "admin",           // ← Role is checked by authorize()
  "type": "admin",
  "storeId": "store_id"      // For store_admin
}
```

## Middleware Chain Order

**IMPORTANT**: Middleware must be applied in the correct order!

```typescript
// ✅ CORRECT ORDER
router.post('/',
    authenticate,      // 1. Check if user is logged in
    authorize('admin'), // 2. Check if user has admin role
    validate(...),     // 3. Validate request data
    handler            // 4. Execute business logic
);

// ❌ WRONG ORDER - Will fail!
router.post('/',
    authorize('admin'), // ERROR: req.user doesn't exist yet!
    authenticate,      // Too late
    handler
);
```

## Security Best Practices

### 1. **Always Use Both Middlewares**
```typescript
// ❌ BAD - Only checks authentication, not role
router.post('/stores', authenticate, createStore);

// ✅ GOOD - Checks both authentication AND role
router.post('/stores', authenticate, authorize('admin'), createStore);
```

### 2. **Principle of Least Privilege**
Give users only the minimum permissions they need:

```typescript
// ❌ TOO PERMISSIVE
router.delete('/stores/:id', 
    authenticate, 
    authorize('admin', 'store_admin'), // store_admin shouldn't delete!
    deleteStore
);

// ✅ RESTRICTIVE
router.delete('/stores/:id',
    authenticate,
    authorize('admin', 'super_admin'), // Only high-level admins
    deleteStore
);
```

### 3. **Public vs Protected Routes**
```typescript
// Public - No authentication needed
router.get('/stores', getStores);

// Protected - Authentication required
router.get('/orders/my-orders', authenticate, getMyOrders);

// Admin-only - Authentication + Authorization required
router.post('/stores', authenticate, authorize('admin'), createStore);
```

## Common Security Scenarios

### Scenario 1: Customer tries to access admin endpoint
```
Request: POST /api/stores (with customer token)
Result: 403 Forbidden - "Insufficient permissions"
Reason: Customer role not in allowed roles
```

### Scenario 2: No token provided
```
Request: POST /api/stores (no Authorization header)
Result: 401 Unauthorized - "No token provided"
Reason: authenticate middleware blocks request
```

### Scenario 3: Expired token
```
Request: POST /api/stores (with expired token)
Result: 401 Unauthorized - "Invalid or expired token"
Reason: JWT verification fails
```

### Scenario 4: Store admin tries to delete store
```
Request: DELETE /api/stores/:id (with store_admin token)
Result: 403 Forbidden - "Insufficient permissions"
Reason: store_admin not in allowed roles (only admin, super_admin)
```

## Error Responses

### 401 Unauthorized
User is not authenticated or token is invalid.

```json
{
  "error": "No token provided"
}
// or
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
User is authenticated but doesn't have required permissions.

```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

## Future Enhancements

### 1. **Granular Permissions**
Instead of just roles, implement specific permissions:

```typescript
// User model already has permissions field
permissions: ['store.create', 'store.update', 'product.create']

// Check specific permission
authorize.permission('store.create')
```

### 2. **Resource-Based Authorization**
Store admins should only manage their own store:

```typescript
// Check if user owns the resource
const checkStoreOwnership = async (req, res, next) => {
  if (req.user.role === 'store_admin') {
    const store = await Store.findById(req.params.id);
    if (store._id.toString() !== req.user.storeId) {
      return res.status(403).json({ error: 'Cannot access other stores' });
    }
  }
  next();
};
```

### 3. **Rate Limiting by Role**
Different rate limits for different user types:

```typescript
// Customers: 100 requests/hour
// Admins: 1000 requests/hour
```

## Testing Authorization

### Manual Testing
```bash
# 1. Login as customer
CUSTOMER_TOKEN=$(curl -X POST /api/auth/customer/login ...)

# 2. Try to create store (should fail)
curl -X POST /api/stores \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{...}'
# Expected: 403 Forbidden

# 3. Login as admin
ADMIN_TOKEN=$(curl -X POST /api/auth/admin/login ...)

# 4. Create store (should succeed)
curl -X POST /api/stores \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{...}'
# Expected: 201 Created
```

### Automated Testing
```typescript
describe('Store CRUD Authorization', () => {
  it('should block customers from creating stores', async () => {
    const response = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(storeData);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Insufficient permissions');
  });

  it('should allow admins to create stores', async () => {
    const response = await request(app)
      .post('/api/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(storeData);
    
    expect(response.status).toBe(201);
  });
});
```

## Summary

✅ **Security is properly implemented**:
- Customers **CANNOT** create, update, or delete stores
- Only admins with appropriate roles can manage stores
- Public endpoints (GET) remain accessible to everyone
- Token validation prevents unauthorized access
- Role validation prevents privilege escalation

🔒 **Key Takeaways**:
1. Always use `authenticate` before `authorize`
2. Apply `authorize` to all admin-only endpoints
3. Use principle of least privilege
4. Test with different user roles
5. Monitor for unauthorized access attempts

---

**For implementation details, see:**
- `/src/middleware/auth.ts` - Authentication & authorization logic
- `/src/routes/store.routes.ts` - Store CRUD with role checks
- `/src/controllers/store.controller.ts` - Business logic
