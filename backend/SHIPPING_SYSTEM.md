# Shipping System - Complete Implementation

## ✅ **Shipping Controller & Routes Created Successfully!**

---

## 📦 **Overview**

Comprehensive shipping system with:
- ✅ **Shipping Rules** - Flexible rule-based shipping calculation
- ✅ **Shipping Calculator** - Real-time cost calculation
- ✅ **Cart Integration** - Shipping cost added to cart
- ✅ **Multiple Rate Types** - Flat, per-kg, percentage, free
- ✅ **Geo-based Rules** - Country/state/city specific
- ✅ **Weight-based** - Calculate by product weight
- ✅ **Order Value-based** - Free shipping over $X

---

## 🎯 **Endpoints**

### **Public Endpoints:**

#### 1. **POST /api/shipping/calculate**
Calculate available shipping options for a destination

**Request:**
```json
{
  "country": "US",
  "state": "CA",
  "city": "Los Angeles",
  "storeId": "693aa7e1f2f977c751e3d233"
}
```

**Response:**
```json
{
  "shippingOptions": [
    {
      "ruleId": "rule_123",
      "name": "Standard Shipping",
      "description": "3-5 business days",
      "cost": 10.00,
      "currency": "USD",
      "rateType": "flat",
      "estimatedDays": "3-5 business days"
    },
    {
      "ruleId": "rule_456",
      "name": "Express Shipping",
      "cost": 25.00,
      "currency": "USD",
      "rateType": "flat",
      "estimatedDays": "1-2 business days"
    }
  ],
  "orderSummary": {
    "subtotal": 150.00,
    "totalWeight": 2.5,
    "itemCount": 3
  }
}
```

---

#### 2. **POST /api/shipping/apply**
Apply selected shipping method to cart

**Request:**
```json
{
  "shippingRuleId": "rule_123",
  "shippingCost": 10.00,
  "shippingAddress": {
    "country": "US",
    "state": "CA",
    "city": "Los Angeles",
    "postalCode": "90001",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B"
  }
}
```

**Response:**
```json
{
  "message": "Shipping applied to cart",
  "cart": {
    "_id": "cart_id",
    "subtotal": 150.00,
    "shippingCost": 10.00,
    "tax": 0,
    "total": 160.00,
    "shippingMethod": {
      "ruleId": "rule_123",
      "name": "Standard Shipping",
      "cost": 10.00,
      "estimatedDays": "3-5 business days"
    },
    "shippingAddress": {
      "country": "US",
      "state": "CA",
      "city": "Los Angeles",
      "postalCode": "90001",
      "addressLine1": "123 Main St"
    }
  }
}
```

---

#### 3. **GET /api/shipping/cart/summary**
Get cart summary with shipping and totals

**Response:**
```json
{
  "summary": {
    "subtotal": 150.00,
    "shippingCost": 10.00,
    "tax": 0,
    "total": 160.00,
    "itemCount": 3,
    "shippingMethod": {
      "name": "Standard Shipping",
      "cost": 10.00
    },
    "shippingAddress": {
      "country": "US",
      "state": "CA"
    }
  },
  "cart": { ... }
}
```

---

### **Admin Endpoints:**

#### 4. **POST /api/shipping/rules** 🔐
Create shipping rule

**Request:**
```json
{
  "name": "Standard Shipping",
  "description": "3-5 business days",
  "storeId": "store_id",
  "rateType": "flat",
  "rate": 10,
  "currency": "USD",
  "isActive": true,
  "priority": 1,
  "conditions": {
    "countries": ["US", "CA"],
    "minOrderValue": 0,
    "maxOrderValue": 100
  }
}
```

---

#### 5. **GET /api/shipping/rules** 🔐
Get all shipping rules

#### 6. **GET /api/shipping/rules/:id** 🔐
Get shipping rule by ID

#### 7. **PUT /api/shipping/rules/:id** 🔐
Update shipping rule

#### 8. **DELETE /api/shipping/rules/:id** 🔐
Delete shipping rule

---

## 🎨 **Shipping Rule Types**

### 1. **Flat Rate**
Fixed cost regardless of weight or value

```json
{
  "rateType": "flat",
  "rate": 10
}
```
**Result**: Always $10

---

### 2. **Per Kilogram**
Cost based on total weight

```json
{
  "rateType": "per_kg",
  "rate": 5
}
```
**Result**: $5 × total weight (kg)

**Example**: 2.5 kg cart = $12.50

---

### 3. **Percentage**
Cost based on order value

```json
{
  "rateType": "percentage",
  "rate": 10
}
```
**Result**: 10% of subtotal

**Example**: $150 cart = $15 shipping

---

### 4. **Free Shipping**
No cost

```json
{
  "rateType": "free",
  "rate": 0
}
```
**Result**: $0

---

## 📋 **Shipping Rule Conditions**

### **Geographic Conditions:**

```json
{
  "conditions": {
    "countries": ["US", "CA", "MX"],
    "states": ["CA", "NY", "TX"],
    "cities": ["Los Angeles", "New York"]
  }
}
```

### **Weight Conditions:**

```json
{
  "conditions": {
    "minWeight": 0,
    "maxWeight": 5
  }
}
```

### **Order Value Conditions:**

```json
{
  "conditions": {
    "minOrderValue": 50,
    "maxOrderValue": 200
  }
}
```

---

## 💡 **Use Cases**

### **Use Case 1: Free Shipping Over $100**

```json
{
  "name": "Free Shipping",
  "rateType": "free",
  "rate": 0,
  "conditions": {
    "minOrderValue": 100
  },
  "priority": 10
}
```

---

### **Use Case 2: Domestic vs International**

**Domestic (US):**
```json
{
  "name": "US Standard",
  "rateType": "flat",
  "rate": 5,
  "conditions": {
    "countries": ["US"]
  },
  "priority": 5
}
```

**International:**
```json
{
  "name": "International",
  "rateType": "flat",
  "rate": 25,
  "conditions": {
    "countries": ["CA", "MX", "GB", "AU"]
  },
  "priority": 1
}
```

---

### **Use Case 3: Weight-Based Shipping**

**Light Items (0-2 kg):**
```json
{
  "name": "Light Package",
  "rateType": "flat",
  "rate": 8,
  "conditions": {
    "minWeight": 0,
    "maxWeight": 2
  }
}
```

**Heavy Items (2+ kg):**
```json
{
  "name": "Heavy Package",
  "rateType": "per_kg",
  "rate": 5,
  "conditions": {
    "minWeight": 2
  }
}
```

---

## 🔄 **Checkout Flow with Shipping**

### **Step 1: User adds items to cart**
```
Cart:
  - Item 1: $50
  - Item 2: $100
  Subtotal: $150
  Shipping: Not calculated
  Total: $150
```

### **Step 2: User enters shipping address**
```javascript
// Frontend
const address = {
  country: 'US',
  state: 'CA',
  city: 'Los Angeles',
  postalCode: '90001'
};
```

### **Step 3: Calculate shipping options**
```javascript
const response = await fetch('/api/shipping/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    country: address.country,
    state: address.state,
    city: address.city,
    storeId: 'store_id'
  })
});

const { shippingOptions } = await response.json();
// Returns: [Standard $10, Express $25]
```

### **Step 4: User selects shipping method**
```javascript
const selectedShipping = shippingOptions[0]; // Standard $10
```

### **Step 5: Apply shipping to cart**
```javascript
await fetch('/api/shipping/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shippingRuleId: selectedShipping.ruleId,
    shippingCost: selectedShipping.cost,
    shippingAddress: address
  })
});
```

### **Step 6: Get final cart summary**
```javascript
const summary = await fetch('/api/shipping/cart/summary');
/*
{
  subtotal: $150,
  shippingCost: $10,
  tax: $0,
  total: $160
}
*/
```

### **Step 7: Proceed to payment**
```
Final Order:
  Subtotal: $150
  Shipping: $10
  Tax: $0
  Total: $160
```

---

## 🎯 **Frontend Integration**

### **React/Next.js Example:**

```typescript
// components/Checkout.tsx
import { useState, useEffect } from 'react';

function CheckoutPage() {
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [address, setAddress] = useState({
    country: '',
    state: '',
    city: '',
    postalCode: '',
    addressLine1: ''
  });

  // Calculate shipping when address changes
  const calculateShipping = async () => {
    const res = await fetch('/api/shipping/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: address.country,
        state: address.state,
        city: address.city,
        storeId: 'your-store-id'
      })
    });
    
    const data = await res.json();
    setShippingOptions(data.shippingOptions);
  };

  // Apply shipping to cart
  const applyShipping = async (option) => {
    await fetch('/api/shipping/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shippingRuleId: option.ruleId,
        shippingCost: option.cost,
        shippingAddress: address
      })
    });
    
    setSelectedShipping(option);
  };

  return (
    <div>
      <h2>Shipping Address</h2>
      <input 
        value={address.country}
        onChange={(e) => setAddress({...address, country: e.target.value})}
        placeholder="Country"
      />
      {/* More address fields... */}
      
      <button onClick={calculateShipping}>
        Calculate Shipping
      </button>

      {shippingOptions.length > 0 && (
        <div>
          <h3>Shipping Options</h3>
          {shippingOptions.map(option => (
            <div key={option.ruleId}>
              <input 
                type="radio"
                name="shipping"
                onChange={() => applyShipping(option)}
              />
              <label>
                {option.name} - ${option.cost}
                <small>{option.estimatedDays}</small>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 **Cart Model Updates**

The Cart model now includes:

```typescript
{
  // Existing fields
  subtotal: number,
  
  // NEW: Shipping fields
  shippingAddress: {
    country: string,
    state: string,
    city: string,
    postalCode: string,
    addressLine1: string,
    addressLine2: string
  },
  shippingMethod: {
    ruleId: ObjectId,
    name: string,
    cost: number,
    estimatedDays: string
  },
  shippingCost: number,
  
  // NEW: Totals
  tax: number,
  total: number  // Auto-calculated: subtotal + shipping + tax
}
```

---

## ✅ **Summary**

### **Created Files:**
1. ✅ `/src/controllers/shipping.controller.ts` - Shipping controller
2. ✅ `/src/routes/shipping.routes.ts` - Shipping routes
3. ✅ Updated `/src/models/Cart.ts` - Added shipping fields

### **Endpoints (8):**
```
POST   /api/shipping/calculate      - Calculate shipping (public)
POST   /api/shipping/apply          - Apply to cart (public)
GET    /api/shipping/cart/summary   - Get summary (public)
POST   /api/shipping/rules          - Create rule (admin)
GET    /api/shipping/rules          - List rules (admin)
GET    /api/shipping/rules/:id      - Get rule (admin)
PUT    /api/shipping/rules/:id      - Update rule (admin)
DELETE /api/shipping/rules/:id      - Delete rule (admin)
```

### **Features:**
- ✅ Multiple rate types (flat, per-kg, percentage, free)
- ✅ Geographic conditions (country, state, city)
- ✅ Weight-based calculation
- ✅ Order value-based rules
- ✅ Priority system
- ✅ Cart integration
- ✅ Auto-calculate totals

**The shipping system is production-ready!** 🚚✨

---

**Test in Swagger UI**: `http://localhost:3001/api-docs`
