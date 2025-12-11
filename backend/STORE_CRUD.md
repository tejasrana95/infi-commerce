# Store CRUD Operations

## Overview

Complete CRUD (Create, Read, Update, Delete) operations for managing stores in the multi-store ecommerce platform.

## API Endpoints

### Base URL
`/api/stores`

## Endpoints

### 1. Create Store
**POST** `/api/stores`

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "name": "My Awesome Store",
  "slug": "my-awesome-store",
  "domain": "mystore.com",
  "description": "The best online store for amazing products",
  "logo": "https://example.com/logo.png",
  "currency": "USD",
  "timezone": "America/New_York",
  "settings": {
    "theme": "modern",
    "emailNotifications": true
  }
}
```

**Response** (201 Created):
```json
{
  "message": "Store created successfully",
  "store": {
    "_id": "store_id",
    "name": "My Awesome Store",
    "slug": "my-awesome-store",
    "domain": "mystore.com",
    "description": "The best online store for amazing products",
    "logo": "https://example.com/logo.png",
    "currency": "USD",
    "timezone": "America/New_York",
    "isActive": true,
    "settings": {
      "theme": "modern",
      "emailNotifications": true
    },
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Validation Rules**:
- `name`: Required, non-empty string
- `slug`: Required, lowercase letters, numbers, and hyphens only
- `domain`: Required, valid domain format
- `currency`: Optional, 3-letter code (default: USD)
- `timezone`: Optional (default: UTC)

---

### 2. Get All Stores
**GET** `/api/stores`

**Authentication**: Not required (Public)

**Query Parameters**:
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 10) - Items per page
- `isActive` (boolean) - Filter by active status
- `search` (string) - Search by name or domain

**Example**: `/api/stores?page=1&limit=10&isActive=true&search=awesome`

**Response** (200 OK):
```json
{
  "stores": [
    {
      "_id": "store_id",
      "name": "My Awesome Store",
      "slug": "my-awesome-store",
      "domain": "mystore.com",
      "isActive": true,
      ...
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

### 3. Get Store by ID
**GET** `/api/stores/:id`

**Authentication**: Not required (Public)

**Response** (200 OK):
```json
{
  "store": {
    "_id": "store_id",
    "name": "My Awesome Store",
    "slug": "my-awesome-store",
    "domain": "mystore.com",
    ...
  }
}
```

**Error** (404 Not Found):
```json
{
  "error": "Error",
  "message": "Store not found"
}
```

---

### 4. Get Store by Slug
**GET** `/api/stores/slug/:slug`

**Authentication**: Not required (Public)

**Example**: `/api/stores/slug/my-awesome-store`

**Response** (200 OK):
```json
{
  "store": {
    "_id": "store_id",
    "name": "My Awesome Store",
    "slug": "my-awesome-store",
    ...
  }
}
```

---

### 5. Update Store
**PUT** `/api/stores/:id`

**Authentication**: Required (Admin only)

**Request Body** (all fields optional):
```json
{
  "name": "Updated Store Name",
  "description": "New description",
  "logo": "https://example.com/new-logo.png",
  "currency": "EUR",
  "timezone": "Europe/London",
  "isActive": true,
  "settings": {
    "theme": "dark",
    "emailNotifications": false
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Store updated successfully",
  "store": {
    "_id": "store_id",
    "name": "Updated Store Name",
    ...
  }
}
```

**Validation**:
- Slug and domain uniqueness is checked
- Cannot update to a slug/domain that already exists

---

### 6. Delete Store
**DELETE** `/api/stores/:id`

**Authentication**: Required (Admin only)

**Response** (200 OK):
```json
{
  "message": "Store deleted successfully"
}
```

---

### 7. Toggle Store Status
**PATCH** `/api/stores/:id/toggle-status`

**Authentication**: Required (Admin only)

**Response** (200 OK):
```json
{
  "message": "Store activated successfully",
  "store": {
    "_id": "store_id",
    "isActive": true,
    ...
  }
}
```

## Testing Examples

### Using cURL

#### Create a Store
```bash
curl -X POST http://localhost:3001/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Test Store",
    "slug": "test-store",
    "domain": "teststore.com",
    "description": "A test store"
  }'
```

#### Get All Stores
```bash
curl http://localhost:3001/api/stores
```

#### Get Store by ID
```bash
curl http://localhost:3001/api/stores/STORE_ID
```

#### Update Store
```bash
curl -X PUT http://localhost:3001/api/stores/STORE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Updated Store Name",
    "isActive": true
  }'
```

#### Delete Store
```bash
curl -X DELETE http://localhost:3001/api/stores/STORE_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Using JavaScript/TypeScript

```typescript
// Create Store
const createStore = async () => {
  const response = await fetch('http://localhost:3001/api/stores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'My Store',
      slug: 'my-store',
      domain: 'mystore.com'
    })
  });
  const data = await response.json();
  return data.store;
};

// Get All Stores with Pagination
const getStores = async (page = 1, limit = 10) => {
  const response = await fetch(
    `http://localhost:3001/api/stores?page=${page}&limit=${limit}`
  );
  const data = await response.json();
  return data;
};

// Update Store
const updateStore = async (storeId, updates) => {
  const response = await fetch(`http://localhost:3001/api/stores/${storeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(updates)
  });
  const data = await response.json();
  return data.store;
};
```

## Features

### ✅ Implemented
- Create new stores with validation
- List all stores with pagination
- Search stores by name or domain
- Filter stores by active status
- Get store by ID or slug
- Update store details
- Delete stores
- Toggle store active/inactive status
- Duplicate slug/domain prevention
- Full Swagger documentation

### 🔒 Security
- Create, Update, Delete operations require authentication
- Read operations are public (for customer browsing)
- Validation on all inputs
- Unique constraints on slug and domain

### 📊 Pagination
- Default: 10 items per page
- Customizable page size
- Total count and page information included

### 🔍 Search & Filter
- Search by store name or domain
- Filter by active status
- Case-insensitive search

## Database Schema

```typescript
{
  name: string;           // Required
  slug: string;           // Required, unique, lowercase
  domain: string;         // Required, unique
  description?: string;   // Optional
  logo?: string;          // Optional, URL
  currency: string;       // Default: 'USD', 3 letters
  timezone: string;       // Default: 'UTC'
  isActive: boolean;      // Default: true
  settings: object;       // Default: {}
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

## Swagger Documentation

All endpoints are fully documented in Swagger UI:

**URL**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

**Tag**: `Stores`

Features:
- Interactive API testing
- Request/response examples
- Schema definitions
- Try it out functionality

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error",
  "message": "Descriptive error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Next Steps

1. **Test the endpoints** using Swagger UI or cURL
2. **Integrate with frontend** - Use these endpoints in your Next.js apps
3. **Add more features**:
   - Store settings management
   - Store themes
   - Store analytics
   - Multi-language support

---

**For more information, see the Swagger documentation at `/api-docs`**
