# Order System Documentation

## Overview
The order system manages the complete order lifecycle from creation to delivery, including payment processing, status tracking, and inventory management.

## Order Flow

### 1. **Pre-Order (Shopping Phase)**
```
User adds products to cart → Cart persisted in database
```

### 2. **Checkout Phase**
```
User proceeds to checkout
  ↓
Fill shipping address
  ↓
Fill billing address (or same as shipping)
  ↓
Select shipping method (calculated based on rules)
  ↓
Apply coupon code (optional)
  ↓
Review order summary:
  - Subtotal
  - Shipping cost
  - Discount
  - Tax
  - Total
```

### 3. **Order Creation**
```
POST /api/orders/create
  ↓
Validate cart items (stock, availability)
  ↓
Calculate shipping cost
  ↓
Apply coupon discount
  ↓
Create order with status: 'pending'
  ↓
Clear user's cart
  ↓
Return order ID and total
```

### 4. **Payment Processing**
```
Frontend redirects to payment gateway
  ↓
User completes payment
  ↓
Payment gateway sends callback/webhook
  ↓
POST /api/orders/:id/payment-success (if successful)
  OR
POST /api/orders/:id/payment-failed (if failed)
```

### 5. **Post-Payment (Success)**
```
Update order:
  - paymentStatus: 'paid'
  - status: 'processing'
  ↓
Reduce product inventory
  ↓
Increment coupon usage
  ↓
Send order confirmation email
  ↓
Show order confirmation page
```

### 6. **Order Fulfillment**
```
Admin updates status:
  processing → shipped → delivered
  ↓
Add tracking number (when shipped)
  ↓
Customer receives notifications
```

## Order Status Workflow

```
┌─────────┐
│ pending │ ← Order created, payment pending
└────┬────┘
     │
     ├─→ cancelled (if user/admin cancels)
     │
     ↓
┌────────────┐
│ processing │ ← Payment successful
└─────┬──────┘
      │
      ├─→ cancelled (if admin cancels)
      │
      ↓
┌─────────┐
│ shipped │ ← Order dispatched with tracking
└────┬────┘
     │
     ↓
┌───────────┐
│ delivered │ ← Order delivered to customer
└───────────┘
     │
     ├─→ refunded (if refund processed)
```

## Payment Status

- **pending**: Payment not yet completed
- **paid**: Payment successful
- **failed**: Payment failed (order kept for retry)
- **refunded**: Payment refunded

## API Endpoints

### Customer Endpoints

#### Create Order
```http
POST /api/orders/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "storeId": "store_id_here",
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "postalCode": "10001",
    "phone": "+1234567890"
  },
  "billingAddress": {
    // Same structure as shippingAddress
    // Or can be same object if billing = shipping
  },
  "paymentMethod": "razorpay",
  "couponCode": "SUMMER2024",
  "customerNote": "Please deliver after 6 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "id": "order_id_here",
      "orderNumber": "ORD-202412-000001",
      "total": 1250.50,
      "currency": "USD",
      "paymentMethod": "razorpay",
      "status": "pending"
    }
  }
}
```

#### Get User's Orders
```http
GET /api/orders/user/me?page=1&limit=10&status=processing
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-202412-000001",
      "total": 1250.50,
      "status": "processing",
      "paymentStatus": "paid",
      "createdAt": "2024-12-12T10:00:00Z",
      "items": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

#### Track Order (Public)
```http
GET /api/orders/:orderNumber/track
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "ORD-202412-000001",
    "status": "shipped",
    "paymentStatus": "paid",
    "trackingNumber": "TRACK123456",
    "shippedAt": "2024-12-13T14:30:00Z",
    "createdAt": "2024-12-12T10:00:00Z"
  }
}
```

#### Cancel Order
```http
POST /api/orders/:id/cancel
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": { /* order object */ }
}
```

**Note:** Can only cancel orders with status `pending` or `processing`

### Payment Endpoints

#### Payment Success Callback
```http
POST /api/orders/:id/payment-success
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "pay_abc123xyz",
  "paymentDetails": {
    "method": "card",
    "last4": "4242",
    "brand": "visa"
  }
}
```

#### Payment Failed Callback
```http
POST /api/orders/:id/payment-failed
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentDetails": {
    "error": "insufficient_funds",
    "message": "Payment failed due to insufficient funds"
  }
}
```

### Admin Endpoints

#### Get All Orders
```http
GET /api/orders?page=1&limit=20&status=processing&storeId=store_id&search=ORD-2024
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by order status
- `paymentStatus`: Filter by payment status
- `storeId`: Filter by store
- `search`: Search by order number or customer name

#### Update Order Status
```http
PUT /api/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRACK123456",
  "adminNote": "Shipped via FedEx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": { /* updated order */ }
}
```

## Order Number Format

```
ORD-YYYYMM-XXXXXX

Example: ORD-202412-000001
```

- `ORD`: Prefix
- `YYYYMM`: Year and month
- `XXXXXX`: Sequential number (resets daily)

## Automatic Actions

### On Order Creation
- ✅ Validate cart items (stock, availability)
- ✅ Calculate shipping cost based on rules
- ✅ Apply coupon discount (if provided)
- ✅ Generate unique order number
- ✅ Clear user's cart
- ✅ Store coupon ID for later usage increment

### On Payment Success
- ✅ Update payment status to 'paid'
- ✅ Update order status to 'processing'
- ✅ Reduce product inventory
- ✅ Increment coupon usage count
- ✅ Send order confirmation email (TODO)

### On Payment Failed
- ✅ Update payment status to 'failed'
- ✅ Keep order as 'pending' for retry
- ✅ Store failure details

### On Order Cancellation
- ✅ Update status to 'cancelled'
- ✅ Restore product inventory
- ✅ Process refund if payment was made (TODO)

### On Status Update to 'shipped'
- ✅ Set `shippedAt` timestamp
- ✅ Store tracking number
- ✅ Send shipping notification (TODO)

### On Status Update to 'delivered'
- ✅ Set `deliveredAt` timestamp
- ✅ Send delivery confirmation (TODO)

## Integration with Other Systems

### Cart System
- Order creation pulls items from user's cart
- Cart is cleared after successful order creation
- Cart items are validated before order creation

### Product System
- Validates product availability
- Checks stock levels
- Reduces inventory on payment success
- Restores inventory on cancellation

### Coupon System
- Validates coupon code
- Calculates discount
- Increments usage on payment success
- Stores coupon ID in order for tracking

### Shipping System
- Calculates shipping cost based on rules
- Considers product weight and destination
- Applies category-specific rules

### Payment Gateways
- Supports multiple gateways (Razorpay, Stripe, PayPal, COD)
- Handles payment callbacks
- Stores payment details securely

## Error Handling

### Common Errors

**400 Bad Request**
- Cart is empty
- Insufficient stock
- Product not available
- Invalid coupon code
- Cannot cancel order in current status

**401 Unauthorized**
- Missing or invalid authentication token

**403 Forbidden**
- Not authorized to view/modify order
- Admin-only endpoint accessed by customer

**404 Not Found**
- Order not found
- Product not found

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security Considerations

1. **Authorization**
   - Users can only view/cancel their own orders
   - Admins can view/modify all orders
   - Store admins can view orders for their stores

2. **Payment Security**
   - Payment details stored securely
   - Payment gateway signatures verified
   - Sensitive data not exposed in responses

3. **Inventory Protection**
   - Stock validated before order creation
   - Atomic inventory updates
   - Stock restored on cancellation

## Testing Checklist

### Order Creation
- [ ] Create order with valid cart
- [ ] Validate empty cart error
- [ ] Validate insufficient stock error
- [ ] Apply valid coupon
- [ ] Apply invalid coupon
- [ ] Calculate shipping correctly
- [ ] Generate unique order numbers

### Payment Processing
- [ ] Handle successful payment
- [ ] Handle failed payment
- [ ] Verify inventory reduction
- [ ] Verify coupon usage increment

### Order Management
- [ ] Get user's orders
- [ ] Get order details
- [ ] Update order status
- [ ] Cancel order
- [ ] Track order by number

### Admin Functions
- [ ] Get all orders with filters
- [ ] Update order status
- [ ] Add tracking number
- [ ] Search orders

## Future Enhancements

- [ ] Email notifications (order confirmation, shipping, delivery)
- [ ] SMS notifications
- [ ] Invoice PDF generation
- [ ] Refund processing
- [ ] Return/exchange management
- [ ] Order analytics dashboard
- [ ] Bulk order export
- [ ] Shipping label generation
- [ ] Tax calculation
- [ ] Multi-package shipments
