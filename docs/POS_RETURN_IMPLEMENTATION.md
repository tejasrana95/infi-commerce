# POS Return with Pro-Rata Refund Implementation

## Overview
This implementation adds comprehensive return/refund functionality to the POS system with proper pro-rata coupon distribution, handling tax, discounts, sales, and coupon codes correctly.

## Features Implemented

### 1. **Pro-Rata Coupon Distribution**
When a coupon is applied to an order and only some items are returned, the coupon discount is distributed proportionally:

**Example:**
- Product A: $100 (with tax, after sale)
- Product B: $50 (with tax, no sale)
- Product C: $100 (with tax, after sale)
- Coupon ABCXYZ: 10% off (applies only to Product C)
- Total: $100 + $50 + $90 = $240

**Refund Scenarios:**
- Return all items: Full $240 refund
- Return Product A only: $100 refund (no coupon applied to this product)
- Return Product B only: $50 refund (no coupon applied to this product)
- Return Product C only: $90 refund (10% coupon discount applied)

### 2. **Tax Handling**
- Tax amounts are properly calculated for returned items
- Tax is included in the refund amount
- Tax breakdown is shown in the refund calculation

### 3. **Item-Level Discounts**
- Sale prices are honored
- Item-level discounts are tracked
- Discounts are properly reflected in refund calculations

### 4. **Partial Returns**
- Return specific quantities of items
- Track already returned quantities per item
- Prevent returning more than purchased

### 5. **Coupon Maximum Cap**
- Percentage coupons with maximum caps are respected
- Pro-rata distribution considers the cap

## Technical Implementation

### Backend Components

#### 1. **ReturnCalculationService** (`backend/src/services/return-calculation.service.ts`)
Core service that handles all refund calculations:

```typescript
ReturnCalculationService.calculateRefund(orderDetails, returnItems)
```

**Key Features:**
- Validates return requests
- Calculates base refund amounts (price - tax breakdown)
- Applies pro-rata coupon distribution
- Handles coupon eligibility (store-wide vs category-specific)
- Respects coupon maximum caps
- Returns detailed breakdown

**Calculation Logic:**
1. Calculate base refund for each item (without coupon)
2. Identify coupon-eligible items
3. Calculate pro-rata share of coupon discount:
   ```
   proRataCouponDiscount = (returnEligibleTotal / originalEligibleTotal) * originalCouponDiscount
   ```
4. Distribute coupon discount proportionally among eligible items
5. Apply maximum cap if applicable

#### 2. **POS Service Updates** (`backend/src/services/pos.service.ts`)
Enhanced with two methods:

**a. `calculateRefund()`**
- Calculates refund without processing return
- Used by frontend to show real-time calculations
- Fetches coupon details from database
- Returns full breakdown

**b. `processReturn()` (Updated)**
- Processes actual return
- Updates order items with returned quantities
- Creates return record
- Restores inventory
- Updates POS session
- Validates backend vs frontend calculations

#### 3. **POS Controller** (`backend/src/controllers/pos.controller.ts`)
Added endpoint:
```
POST /api/pos/orders/calculate-refund
```

#### 4. **POS Routes** (`backend/src/routes/pos.routes.ts`)
Added route for refund calculation

### Frontend Components

#### 1. **Updated Types** (`pos/src/types/returns.ts`)
Enhanced interfaces:
```typescript
interface ReturnItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number; // Price paid (after discounts, with tax)
    quantityPurchased: number;
    quantityToReturn: number;
    reason: string;
    image: string;
    // Refund breakdown
    basePrice?: number;
    taxAmount?: number;
    discountAmount?: number;
    couponAmount?: number;
    totalRefund?: number;
}

interface RefundCalculation {
    refundAmount: number;
    itemRefunds: Array<...>;
    breakdown: {
        subtotal: number;
        itemDiscounts: number;
        couponDiscount: number;
        tax: number;
        total: number;
    };
}
```

#### 2. **ReturnOrderModal** (`pos/src/components/organisms/ReturnOrderModal.tsx`)
Enhanced with:
- Real-time refund calculation
- Detailed refund breakdown display
- Auto-calculation on quantity changes
- Loading states for calculations
- Error handling

**UI Flow:**
1. Search for order
2. Select items and quantities to return
3. Review refund breakdown with detailed splits
4. Process return with chosen refund method

#### 3. **API Service** (`pos/src/services/api.ts`)
Added method:
```typescript
async calculateRefund(orderId, items)
```

## Example Scenarios

### Scenario 1: Simple Return with Coupon
**Order:**
- Item A: $100 (qty: 1)
- Item B: $50 (qty: 1)  
- Item C: $100 (qty: 1, eligible for 10% coupon)
- Coupon: 10% off Item C
- Total: $240

**Return Item C:**
- Base price: $100
- Coupon discount: $10 (10% of $100)
- Refund: $90

### Scenario 2: Partial Quantity Return with Coupon
**Order:**
- Item A: $100 (qty: 3, all eligible for 10% coupon)
- Coupon: 10% off all items (max cap $25)
- Total: $270 (3 × $90 = $270)

**Return 1 of Item A:**
- Original eligible total: $300
- Coupon discount applied: $25 (capped)
- Return eligible total: $100
- Pro-rata coupon: ($100 / $300) × $25 = $8.33
- Refund: $100 - $8.33 = $91.67

### Scenario 3: Category-Specific Coupon
**Order:**
- Item A: $100 (Electronics)
- Item B: $50 (Books, eligible for coupon)
- Coupon: 20% off Books (max $15)
- Total: $140

**Return Item B:**
- Base price: $50
- Coupon discount: $10 (20% of $50, under cap)
- Refund: $40

## Validation

The system validates:
1. Items exist in the order
2. Return quantity doesn't exceed available quantity
3. Already returned quantities are tracked
4. Backend calculation matches frontend calculation (±$0.01 tolerance)

## Database Schema

### Order Model Updates
Already includes:
```typescript
items: Array<{
    ...
    returnedQuantity?: number;
    refundedAmount?: number;
}>

returns?: Array<{
    returnedAt: Date;
    items: Array<{
        productId: ObjectId;
        variantId?: string;
        quantity: number;
        reason: string;
        refundAmount: number;
    }>;
    totalRefundAmount: number;
    refundMethod: string;
    processedBy: ObjectId;
    note?: string;
    refundReference?: string;
}>
```

## Testing Checklist

- [ ] Return with no coupon
- [ ] Return with store-wide coupon (flat amount)
- [ ] Return with store-wide coupon (percentage)
- [ ] Return with store-wide coupon (percentage with max cap)
- [ ] Return with category-specific coupon
- [ ] Return all items
- [ ] Return single item
- [ ] Return partial quantity
- [ ] Return multiple different items
- [ ] Verify inventory restoration
- [ ] Verify POS session tracking
- [ ] Verify order status updates
- [ ] Verify refund calculation matches backend

## Future Enhancements

1. **Store Credit**: Add option to refund as store credit
2. **Exchange**: Allow item exchanges instead of refunds
3. **Restocking Fee**: Optional restocking fee configuration
4. **Return Window**: Enforce return policy timeframes
5. **Receipt Printing**: Print return receipt
6. **Approval Workflow**: Require manager approval for large refunds

## Notes

- All monetary calculations use 2 decimal precision
- Pro-rata distribution handles rounding by giving remainder to last item
- Frontend calculation is validated against backend to prevent tampering
- Coupon eligibility checks product categories (requires product data access in production)
