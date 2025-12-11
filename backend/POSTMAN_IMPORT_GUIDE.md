# Importing Swagger/OpenAPI into Postman

## Quick Start (Recommended)

### Method 1: Import via URL ⚡ (Fastest)

1. **Make sure your server is running**:
   ```bash
   npm run dev
   # Server should be running on http://localhost:3001
   ```

2. **Open Postman**

3. **Click "Import"** button (top-left corner)

4. **Select "Link" tab**

5. **Paste the OpenAPI JSON URL**:
   ```
   http://localhost:3001/api-docs.json
   ```

6. **Click "Continue"**

7. **Review the import settings** (optional):
   - Collection name: "Infi-Commerce API"
   - You can customize the name if you want

8. **Click "Import"**

9. **Done!** 🎉 You'll see a new collection with all endpoints organized by tags:
   - Health
   - Customer Auth
   - Admin Auth
   - Stores
   - Products
   - Orders
   - etc.

---

## Method 2: Import from Downloaded File 📁

### Step 1: Download the OpenAPI Specification

The file has already been downloaded to:
```
/backend/swagger-spec.json
```

Or download it manually:
```bash
curl http://localhost:3001/api-docs.json -o swagger-spec.json
```

### Step 2: Import into Postman

1. **Open Postman**

2. **Click "Import"** button

3. **Select "File" tab**

4. **Click "Upload Files"**

5. **Select** `swagger-spec.json`

6. **Click "Import"**

---

## After Import: Setting Up Environment Variables

### Create a Postman Environment

1. **Click the "Environments" icon** (left sidebar)

2. **Click "+" to create new environment**

3. **Name it**: `Infi-Commerce Local`

4. **Add these variables**:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `baseUrl` | `http://localhost:3001` | `http://localhost:3001` |
| `adminToken` | (leave empty) | (will be set after login) |
| `customerToken` | (leave empty) | (will be set after login) |

5. **Save** and **select** this environment (dropdown in top-right)

### Update Collection to Use Variables

After import, update the collection settings:

1. **Right-click** on "Infi-Commerce API" collection

2. **Click "Edit"**

3. **Go to "Variables" tab**

4. **Add variable**:
   - Variable: `baseUrl`
   - Initial Value: `http://localhost:3001`
   - Current Value: `http://localhost:3001`

5. **Go to "Authorization" tab**

6. **Type**: Bearer Token

7. **Token**: `{{adminToken}}` or `{{customerToken}}`

8. **Save**

---

## Testing the API in Postman

### 1. Test Health Check (No Auth Required)

1. **Open**: `Health` → `GET /health`

2. **Click "Send"**

3. **Expected Response** (200 OK):
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-11T11:00:00.000Z"
   }
   ```

### 2. Login as Admin

1. **Open**: `Admin Auth` → `POST /api/auth/admin/login`

2. **Body** (already populated from Swagger):
   ```json
   {
     "email": "testadmin@example.com",
     "password": "AdminPass123!"
   }
   ```

3. **Click "Send"**

4. **Copy the `accessToken` from response**

5. **Set it as environment variable**:
   - Click "Environments" → Select "Infi-Commerce Local"
   - Paste token into `adminToken` Current Value
   - Save

### 3. Create a Store (Admin Only)

1. **Open**: `Stores` → `POST /api/stores`

2. **Go to "Authorization" tab**:
   - Type: Bearer Token
   - Token: `{{adminToken}}`

3. **Body**:
   ```json
   {
     "name": "My Test Store",
     "slug": "my-test-store",
     "domain": "myteststore.com",
     "description": "A test store created from Postman"
   }
   ```

4. **Click "Send"**

5. **Expected Response** (201 Created):
   ```json
   {
     "message": "Store created successfully",
     "store": {
       "_id": "...",
       "name": "My Test Store",
       "slug": "my-test-store",
       ...
     }
   }
   ```

### 4. Test Customer Login

1. **Open**: `Customer Auth` → `POST /api/auth/customer/login`

2. **Body**:
   ```json
   {
     "email": "testcustomer@example.com",
     "password": "Test123!"
   }
   ```

3. **Click "Send"**

4. **Copy `accessToken`** and save to `customerToken` environment variable

### 5. Test Authorization (Customer tries to create store)

1. **Open**: `Stores` → `POST /api/stores`

2. **Authorization**: Use `{{customerToken}}`

3. **Click "Send"**

4. **Expected Response** (403 Forbidden):
   ```json
   {
     "error": "Forbidden: Insufficient permissions"
   }
   ```

---

## Postman Collection Structure

After import, you'll see this structure:

```
📁 Infi-Commerce API
├── 📁 Health
│   └── GET /health
├── 📁 Customer Auth
│   ├── POST /api/auth/customer/register
│   ├── POST /api/auth/customer/login
│   ├── POST /api/auth/customer/refresh
│   ├── GET /api/auth/customer/me
│   └── PUT /api/auth/customer/me
├── 📁 Admin Auth
│   ├── POST /api/auth/admin/register
│   ├── POST /api/auth/admin/login
│   ├── POST /api/auth/admin/refresh
│   ├── GET /api/auth/admin/me
│   └── PUT /api/auth/admin/me
├── 📁 Stores
│   ├── GET /api/stores
│   ├── POST /api/stores
│   ├── GET /api/stores/{id}
│   ├── GET /api/stores/slug/{slug}
│   ├── PUT /api/stores/{id}
│   ├── DELETE /api/stores/{id}
│   └── PATCH /api/stores/{id}/toggle-status
└── 📁 (Other endpoints as they're added)
```

---

## Pro Tips 💡

### 1. Use Pre-request Scripts for Auto-Login

Add this to your collection's Pre-request Script:

```javascript
// Auto-login if token is expired
const adminToken = pm.environment.get("adminToken");

if (!adminToken) {
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/api/auth/admin/login",
        method: 'POST',
        header: {
            'Content-Type': 'application/json',
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: "testadmin@example.com",
                password: "AdminPass123!"
            })
        }
    }, function (err, response) {
        if (!err) {
            const token = response.json().accessToken;
            pm.environment.set("adminToken", token);
        }
    });
}
```

### 2. Use Tests to Auto-Save Tokens

Add this to login request's Tests tab:

```javascript
// Auto-save token after login
if (pm.response.code === 200) {
    const response = pm.response.json();
    
    // Check if it's admin or customer login
    if (response.user) {
        // Admin login
        pm.environment.set("adminToken", response.accessToken);
        console.log("Admin token saved!");
    } else if (response.customer) {
        // Customer login
        pm.environment.set("customerToken", response.accessToken);
        console.log("Customer token saved!");
    }
}
```

### 3. Create Multiple Environments

Create separate environments for different stages:

- **Local Development**: `http://localhost:3001`
- **Staging**: `https://staging-api.yourapp.com`
- **Production**: `https://api.yourapp.com`

### 4. Use Collection Runner for Testing

1. **Click "Runner"** button
2. **Select** "Infi-Commerce API" collection
3. **Select** environment
4. **Run** all requests to test the entire API

---

## Troubleshooting

### Issue: "Could not get response"

**Solution**: Make sure your server is running:
```bash
npm run dev
# Server should show: 🚀 Server running on port 3001
```

### Issue: "401 Unauthorized"

**Solution**: 
1. Login first (admin or customer)
2. Copy the `accessToken` from response
3. Set it in environment variable
4. Use `{{adminToken}}` or `{{customerToken}}` in Authorization header

### Issue: "403 Forbidden"

**Solution**: You're using the wrong token type
- Use `{{adminToken}}` for admin endpoints (stores, etc.)
- Use `{{customerToken}}` for customer endpoints (cart, orders, etc.)

### Issue: Import shows no endpoints

**Solution**:
1. Check that server is running
2. Verify URL: `http://localhost:3001/api-docs.json`
3. Try downloading the file first, then import from file

---

## Alternative: Use Swagger UI

If you prefer, you can also test directly in Swagger UI:

1. **Open**: http://localhost:3001/api-docs

2. **Click "Authorize"** button (top-right)

3. **Enter token**: `Bearer YOUR_TOKEN_HERE`

4. **Click "Authorize"**

5. **Test any endpoint** by clicking "Try it out"

---

## Keeping Postman Collection Updated

When you add new endpoints:

1. **Re-import** the collection (same steps as above)

2. **Postman will ask**: "Replace existing collection?"

3. **Click "Replace"**

4. **Your environment variables will be preserved**

---

## Summary

✅ **Easiest Method**: Import via URL (`http://localhost:3001/api-docs.json`)

✅ **What You Get**:
- All API endpoints organized by tags
- Request examples pre-filled
- Response schemas documented
- Authentication requirements shown

✅ **Next Steps**:
1. Import collection
2. Create environment with `baseUrl`, `adminToken`, `customerToken`
3. Login to get tokens
4. Test endpoints

**Happy testing!** 🚀

---

## Quick Reference

| What | Where |
|------|-------|
| **OpenAPI JSON URL** | `http://localhost:3001/api-docs.json` |
| **Swagger UI** | `http://localhost:3001/api-docs` |
| **Downloaded File** | `/backend/swagger-spec.json` |
| **Base URL** | `http://localhost:3001` |
| **Admin Login** | `POST /api/auth/admin/login` |
| **Customer Login** | `POST /api/auth/customer/login` |
