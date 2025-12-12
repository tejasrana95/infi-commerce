# Coupon System Documentation

## Overview
The coupon system allows store admins to create discount codes with flexible rules and conditions. Coupons can be applied to entire stores or specific categories, with various usage limits and date ranges.

## Coupon Model Features

### Discount Types
- **Flat**: Fixed amount discount (e.g., $10 off)
- **Percentage**: Percentage-based discount (e.g., 20% off)

### Applicability
- **Store-wide**: Apply to all products in the store
- **Category-specific**: Apply only to products in specified categories

### Conditions
- **Minimum Cart Value**: Require a minimum purchase amount
- **Maximum Discount Amount**: Cap the discount for percentage-based coupons
- **Usage Limits**: Total number of times the coupon can be used
- **Per-Customer Limit**: Maximum uses per customer
- **Date Range**: Start and end dates for coupon validity

### Methods
- `isCurrentlyValid()`: Check if coupon is active and within date range
- `canCustomerUse(customerId)`: Check if customer can use the coupon
- `calculateDiscount(cartValue, applicableAmount)`: Calculate discount amount
- `incrementUsage(customerId)`: Track coupon usage

## API Endpoints

### Admin Endpoints (Require Authentication)

#### Create Coupon
```
POST /api/coupons
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "code": "SUMMER2024",
  "storeId": "store_id_here",
  "description": "Summer sale discount",
  "discountType": "percentage",
  "discountValue": 20,
  "applyTo": "store",
  "minCartValue": 100,
  "maxDiscountAmount": 50,
  "usageLimit": 1000,
  "perCustomerLimit": 1,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon created successfully",
  "data": { /* coupon object */ }
}
```

#### Get All Coupons
```
GET /api/coupons?storeId=<store_id>&isActive=true&page=1&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [ /* array of coupons */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### Get Coupon by ID
```
GET /api/coupons/:id
Authorization: Bearer <token>
```

#### Update Coupon
```
PUT /api/coupons/:id
Authorization: Bearer <token>
```

**Request Body:** (partial update)
```json
{
  "isActive": false,
  "endDate": "2024-09-30T23:59:59Z"
}
```

#### Delete Coupon
```
DELETE /api/coupons/:id
Authorization: Bearer <token>
```

### Public Endpoints

#### Validate Coupon
```
POST /api/coupons/validate
```

**Request Body:**
```json
{
  "code": "SUMMER2024",
  "storeId": "store_id_here",
  "cartId": "cart_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon is valid",
  "data": {
    "coupon": {
      "code": "SUMMER2024",
      "description": "Summer sale discount",
      "discountType": "percentage",
      "discountValue": 20
    },
    "applicableAmount": 150,
    "discountAmount": 30,
    "finalAmount": 120
  }
}
```

#### Get Active Coupons for Store
```
GET /api/coupons/store/:storeId/active
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "SUMMER2024",
      "description": "Summer sale discount",
      "discountType": "percentage",
      "discountValue": 20,
      "minCartValue": 100,
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z"
    }
  ]
}
```

#### Apply Coupon
```
POST /api/coupons/:id/apply
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cartId": "cart_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "usageCount": 1
  }
}
```

## Usage Flow

### Customer Flow
1. **Browse Coupons**: GET `/api/coupons/store/:storeId/active` to see available coupons
2. **Validate Coupon**: POST `/api/coupons/validate` with coupon code and cart
3. **Apply Coupon**: POST `/api/coupons/:id/apply` during checkout
4. **Complete Order**: Coupon usage is tracked automatically

### Admin Flow
1. **Create Coupon**: POST `/api/coupons` with coupon details
2. **Monitor Usage**: GET `/api/coupons` to see all coupons and usage stats
3. **Update Coupon**: PUT `/api/coupons/:id` to modify settings
4. **Deactivate**: Update `isActive: false` or delete the coupon

## Example Scenarios

### Scenario 1: Store-wide Percentage Discount
```json
{
  "code": "WELCOME10",
  "discountType": "percentage",
  "discountValue": 10,
  "applyTo": "store",
  "minCartValue": 50,
  "maxDiscountAmount": 20,
  "perCustomerLimit": 1
}
```
- 10% off entire cart
- Minimum purchase: $50
- Maximum discount: $20
- One-time use per customer

### Scenario 2: Category-specific Flat Discount
```json
{
  "code": "ELECTRONICS50",
  "discountType": "flat",
  "discountValue": 50,
  "applyTo": "categories",
  "categoryIds": ["electronics_category_id"],
  "usageLimit": 100
}
```
- $50 off electronics category
- Limited to 100 total uses
- No minimum purchase required

### Scenario 3: Limited-time Flash Sale
```json
{
  "code": "FLASH24H",
  "discountType": "percentage",
  "discountValue": 30,
  "applyTo": "store",
  "startDate": "2024-07-01T00:00:00Z",
  "endDate": "2024-07-01T23:59:59Z",
  "usageLimit": 500
}
```
- 30% off everything
- Valid for 24 hours only
- Limited to 500 uses

## Error Handling

### Common Errors
- **400**: Invalid coupon code, expired, or usage limit reached
- **401**: Authentication required
- **403**: Insufficient permissions (admin/store_admin only)
- **404**: Coupon not found

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Integration with Cart System

The coupon validation automatically:
1. Fetches the user's cart
2. Calculates applicable amount based on coupon rules
3. Applies category filters if needed
4. Checks minimum cart value
5. Calculates final discount amount
6. Returns discount details for checkout

## Notes

- Coupon codes are automatically converted to uppercase
- Customer usage is tracked by user ID
- Coupons can be deactivated without deletion
- Usage count is incremented only when `apply` endpoint is called
- Validation endpoint does not increment usage (preview only)
