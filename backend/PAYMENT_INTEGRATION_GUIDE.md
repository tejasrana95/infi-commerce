# Payment Integration Guide - Frontend

## Complete Payment Flow

### Step 1: Create Order
```javascript
const response = await fetch('/api/orders/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    storeId: 'store_123',
    shippingAddress: { /* ... */ },
    billingAddress: { /* ... */ },
    paymentMethod: 'razorpay', // or 'stripe', 'paypal', 'cod'
    couponCode: 'SUMMER2024'
  })
});

const { data } = await response.json();
const orderId = data.order.id;
```

### Step 2: Initialize Payment
```javascript
const paymentResponse = await fetch(`/api/orders/${orderId}/initialize-payment`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { data: paymentData } = await paymentResponse.json();
```

### Step 3: Handle Payment Based on Gateway

## Razorpay Integration

### Response Structure
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-202412-000001",
    "amount": 1250.50,
    "currency": "INR",
    "paymentMethod": "razorpay",
    "gatewayType": "razorpay",
    "paymentId": "order_razorpay_id",
    "razorpay": {
      "key": "rzp_test_xxxxx",
      "orderId": "order_razorpay_id",
      "amount": 125050,
      "currency": "INR",
      "name": "Your Store",
      "description": "Order ORD-202412-000001",
      "prefill": {
        "name": "John Doe",
        "email": "john@example.com",
        "contact": "+1234567890"
      }
    }
  }
}
```

### Frontend Implementation
```html
<!-- Add Razorpay script -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

```javascript
// Initialize payment
const paymentData = await initializePayment(orderId);

if (paymentData.gatewayType === 'razorpay') {
  const options = {
    key: paymentData.razorpay.key,
    amount: paymentData.razorpay.amount,
    currency: paymentData.razorpay.currency,
    name: paymentData.razorpay.name,
    description: paymentData.razorpay.description,
    order_id: paymentData.razorpay.orderId,
    prefill: paymentData.razorpay.prefill,
    handler: async function (response) {
      // Payment successful
      await fetch(`/api/orders/${orderId}/payment-success`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: response.razorpay_payment_id,
          paymentDetails: {
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          }
        })
      });
      
      // Redirect to success page
      window.location.href = `/order-confirmation/${orderNumber}`;
    },
    modal: {
      ondismiss: function() {
        // User closed the payment modal
        console.log('Payment cancelled');
      }
    }
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
}
```

## Stripe Integration

### Response Structure
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-202412-000001",
    "amount": 1250.50,
    "currency": "USD",
    "paymentMethod": "stripe",
    "gatewayType": "stripe",
    "paymentId": "pi_xxxxx",
    "stripe": {
      "clientSecret": "pi_xxxxx_secret_xxxxx",
      "publishableKey": "pk_test_xxxxx"
    }
  }
}
```

### Frontend Implementation
```html
<!-- Add Stripe script -->
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
// Initialize payment
const paymentData = await initializePayment(orderId);

if (paymentData.gatewayType === 'stripe') {
  const stripe = Stripe(paymentData.stripe.publishableKey);
  
  const { error } = await stripe.confirmPayment({
    clientSecret: paymentData.stripe.clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/order-confirmation/${orderNumber}`,
    },
  });

  if (error) {
    // Payment failed
    await fetch(`/api/orders/${orderId}/payment-failed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentDetails: {
          error: error.message
        }
      })
    });
  }
}
```

### Alternative: Stripe Elements (Custom Form)
```javascript
const stripe = Stripe(paymentData.stripe.publishableKey);
const elements = stripe.elements({ clientSecret: paymentData.stripe.clientSecret });

// Create card element
const cardElement = elements.create('card');
cardElement.mount('#card-element');

// Handle form submission
document.getElementById('payment-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const { error, paymentIntent } = await stripe.confirmCardPayment(
    paymentData.stripe.clientSecret,
    {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      }
    }
  );

  if (error) {
    // Show error
    console.error(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    // Payment successful
    await fetch(`/api/orders/${orderId}/payment-success`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentId: paymentIntent.id,
        paymentDetails: paymentIntent
      })
    });
    
    window.location.href = `/order-confirmation/${orderNumber}`;
  }
});
```

## PayPal Integration

### Response Structure
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "orderNumber": "ORD-202412-000001",
    "amount": 1250.50,
    "currency": "USD",
    "paymentMethod": "paypal",
    "gatewayType": "paypal",
    "paymentId": "paypal_order_id",
    "paypal": {
      "redirectUrl": "https://www.paypal.com/checkoutnow?token=xxxxx",
      "orderId": "paypal_order_id"
    }
  }
}
```

### Frontend Implementation
```javascript
// Initialize payment
const paymentData = await initializePayment(orderId);

if (paymentData.gatewayType === 'paypal') {
  // Simply redirect to PayPal
  window.location.href = paymentData.paypal.redirectUrl;
}
```

### PayPal Return URL Handler
```javascript
// On your return URL page (e.g., /payment-return)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const PayerID = urlParams.get('PayerID');

if (token && PayerID) {
  // Payment successful - capture it
  await fetch(`/api/orders/${orderId}/payment-success`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentId: token,
      paymentDetails: {
        PayerID,
        token
      }
    })
  });
  
  window.location.href = `/order-confirmation/${orderNumber}`;
}
```

## Cash on Delivery (COD)

### Response Structure
```json
{
  "success": true,
  "message": "Cash on Delivery - No payment initialization needed",
  "data": {
    "paymentMethod": "cod",
    "requiresPayment": false
  }
}
```

### Frontend Implementation
```javascript
const paymentData = await initializePayment(orderId);

if (paymentData.paymentMethod === 'cod') {
  // No payment needed, directly go to confirmation
  window.location.href = `/order-confirmation/${orderNumber}`;
}
```

## Complete React Example

```jsx
import { useState } from 'react';

function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async (orderData) => {
    setLoading(true);
    
    try {
      // Step 1: Create order
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      const { data: order } = await orderResponse.json();
      
      // Step 2: Initialize payment
      const paymentResponse = await fetch(`/api/orders/${order.order.id}/initialize-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const { data: payment } = await paymentResponse.json();
      
      // Step 3: Handle based on gateway
      switch (payment.gatewayType) {
        case 'razorpay':
          handleRazorpay(payment, order.order.orderNumber);
          break;
        case 'stripe':
          await handleStripe(payment, order.order.orderNumber);
          break;
        case 'paypal':
          window.location.href = payment.paypal.redirectUrl;
          break;
        case 'cod':
          window.location.href = `/order-confirmation/${order.order.orderNumber}`;
          break;
      }
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  const handleRazorpay = (payment, orderNumber) => {
    const options = {
      ...payment.razorpay,
      handler: async (response) => {
        await fetch(`/api/orders/${payment.orderId}/payment-success`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentId: response.razorpay_payment_id,
            paymentDetails: response
          })
        });
        window.location.href = `/order-confirmation/${orderNumber}`;
      }
    };
    
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const handleStripe = async (payment, orderNumber) => {
    const stripe = window.Stripe(payment.stripe.publishableKey);
    const { error } = await stripe.confirmPayment({
      clientSecret: payment.stripe.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderNumber}`,
      },
    });
    
    if (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Your checkout form */}
      <button onClick={() => handlePayment(formData)} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
```

## Webhook Handling

Webhooks are automatically handled by the backend. No frontend action needed!

- Razorpay → `/api/webhooks/razorpay`
- Stripe → `/api/webhooks/stripe`
- PayPal → `/api/webhooks/paypal`

Configure these URLs in your payment gateway dashboards.

## Error Handling

```javascript
try {
  const payment = await initializePayment(orderId);
  // Handle payment...
} catch (error) {
  if (error.status === 400 && error.message.includes('already paid')) {
    // Order already paid
    window.location.href = `/order-confirmation/${orderNumber}`;
  } else if (error.status === 403) {
    // Not authorized
    alert('You are not authorized to pay for this order');
  } else {
    // Other errors
    alert('Payment initialization failed. Please try again.');
  }
}
```

## Testing

### Test Cards

**Razorpay:**
- Card: 4111 1111 1111 1111
- CVV: 123
- Expiry: Any future date

**Stripe:**
- Card: 4242 4242 4242 4242
- CVV: 123
- Expiry: Any future date

**PayPal:**
- Use PayPal Sandbox accounts

---

**That's it! Your payment integration is complete!** 🎉
