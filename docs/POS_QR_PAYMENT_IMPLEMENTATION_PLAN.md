# POS QR Payment Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding **region-agnostic QR code-based payment support** in the POS checkout system. The solution supports multiple payment gateways based on store location:

| Region | Supported QR Methods |
|--------|---------------------|
| **India** | Razorpay QR (UPI), Custom UPI QR |
| **US/Canada** | PayPal QR, Stripe Terminal, Venmo QR |
| **UK/Europe** | PayPal QR, Stripe Terminal |
| **Global** | Custom QR (any payment method) |

The architecture is designed to be **extensible** for any region or payment gateway.

---

## Current State Analysis

### Existing Infrastructure
| Component | Current State |
|-----------|---------------|
| **Payment Gateways** | Razorpay, Stripe, PayPal (online payments only) |
| **POS Payment Methods** | `cash`, `card`, `qr` (labels only, no gateway integration) |
| **Store Settings** | `posSettings` with basic config, no payment gateway control |
| **Payment Model** | Supports `paymentId`, `paymentDetails` for tracking |
| **QR Capability** | Only for product barcode scanning, not payment |

### Gaps Identified
1. No QR code generation for payments
2. No payment gateway integration in POS checkout
3. No POS-specific payment configuration
4. No QR payment verification flow
5. No payment reference tracking for POS transactions
6. No region-based gateway selection

---

## Recommended Approach: Hybrid Payment Configuration

### Why Separate POS Payment Config?

| Aspect | Use Existing Gateway Config | Separate POS Payment Config |
|--------|----------------------------|------------------------------|
| **Simplicity** | ✅ Single source of truth | ❌ Duplicate configuration |
| **Flexibility** | ❌ Online-focused design | ✅ POS-specific features |
| **Scalability** | ❌ Mixed concerns | ✅ Clean separation |
| **Use Case Fit** | ❌ Card terminals, QR display differ | ✅ Purpose-built |

**Recommendation:** Create a **separate `posPaymentSettings`** within store settings that **references** existing payment gateway credentials but adds POS-specific configuration.

---

## Architecture Design

### Data Model Extensions

```typescript
// Store Model - New posPaymentSettings
posPaymentSettings: {
  // Master switch for each payment method in POS
  enabledMethods: {
    cash: boolean;      // Default: true
    card: boolean;      // Default: true  
    qr: boolean;        // Default: false (Generic QR - covers UPI/PayPal/Venmo etc.)
  };
  
  // Cash settings
  cashSettings: {
    enableRoundOff: boolean;
    roundOffTo: 'nearest1' | 'nearest5' | 'nearest10';
    requireExactAmount: boolean;
  };
  
  // Card terminal settings (future)
  cardSettings: {
    terminalType: 'manual' | 'integrated';
    terminalId?: string;
    gatewayId?: ObjectId; // Reference to PaymentGatewayConfig
  };
  
  // QR Payment Settings (Region-Agnostic)
  qrSettings: {
    mode: 'gateway' | 'custom';
    
    // Gateway-based QR (Dynamic QR per transaction)
    gatewayConfig?: {
      gatewayId: ObjectId;  // Reference to PaymentGatewayConfig
      gatewayType: 'razorpay' | 'stripe' | 'paypal';
      
      // Gateway-specific options
      razorpayOptions?: {
        qrType: 'upi_qr' | 'bharat_qr';  // UPI or BharatQR
      };
      stripeOptions?: {
        // Stripe Terminal or Payment Links
        method: 'terminal' | 'payment_link';
      };
      paypalOptions?: {
        // PayPal QR or Venmo (US only)
        method: 'paypal_qr' | 'venmo_qr';
      };
    };
    
    // Custom static QR code (works globally)
    customConfig?: {
      qrCodeImage: string;      // File path from FileManager
      paymentIdentifier?: string; // UPI ID, PayPal.me link, Venmo handle, etc.
      paymentType?: string;     // 'upi' | 'paypal' | 'venmo' | 'bank_transfer' | 'other'
      merchantName?: string;    // Display name
      description?: string;     // Payment instructions
    };
    
    // Verification settings
    verification: {
      mode: 'manual' | 'auto' | 'webhook';
      // manual: Staff confirms payment received
      // auto: Poll gateway for payment status (gateway mode only)
      // webhook: Wait for payment webhook (gateway mode only)
      pollingInterval?: number;  // Seconds (for auto mode)
      timeout?: number;          // Max wait time in seconds
    };
    
    // Display settings
    displaySettings: {
      showAmount: boolean;
      showMerchantName: boolean;
      showPaymentId: boolean;    // Show UPI ID / PayPal.me / Venmo handle
      instructions?: string;     // Custom instructions per region
      qrLabel?: string;          // "Scan to Pay" / "Pay with UPI" / "Pay with PayPal"
    };
  };
}
```

### Payment Reference Tracking

```typescript
// Order Model - Enhanced payment tracking for POS
posPaymentDetails?: {
  method: 'cash' | 'card' | 'qr';
  
  // Cash payment details
  cashDetails?: {
    amountReceived: number;
    changeGiven: number;
    roundOffAmount: number;
  };
  
  // Card payment details
  cardDetails?: {
    terminalId?: string;
    transactionId?: string;
    authCode?: string;
    cardLast4?: string;
    cardNetwork?: string; // Visa, Mastercard, etc.
  };
  
  // QR payment details (Generic - works for all regions)
  qrDetails?: {
    mode: 'gateway' | 'custom';
    paymentType: string;  // 'upi' | 'paypal' | 'venmo' | 'stripe' | 'custom'
    
    // Gateway payment tracking
    gatewayDetails?: {
      gatewayType: string;
      gatewayOrderId: string;     // Razorpay order_id, Stripe payment_intent, PayPal order_id
      gatewayPaymentId: string;   // Payment confirmation ID
      qrCodeId?: string;          // For dynamic QR tracking
      
      // Region-specific references
      transactionRef?: string;    // UTR (India), Transaction ID (PayPal/Stripe)
      payerIdentifier?: string;   // Payer VPA (UPI), PayPal email, Venmo handle
      
      status: 'pending' | 'completed' | 'failed' | 'refunded';
    };
    
    // Manual entry for custom QR
    manualEntry?: {
      referenceNumber: string;    // Transaction reference entered by staff
      payerName?: string;
      payerIdentifier?: string;   // Payer's payment ID (UPI VPA, PayPal email, etc.)
      verifiedBy: ObjectId;       // Staff who verified
      verifiedAt: Date;
      notes?: string;
    };
  };
  
  // Common metadata
  capturedAt: Date;
  capturedBy: ObjectId;
}
```

---

## Gateway QR Capabilities by Region

### Razorpay (India) ✅ Full Support

| Feature | Support | Notes |
|---------|---------|-------|
| **UPI QR** | ✅ Yes | Generate unique QR per transaction |
| **BharatQR** | ✅ Yes | Supports cards + UPI |
| **Amount Embedding** | ✅ Yes | Pre-filled amount in QR |
| **Webhook** | ✅ Yes | `qrcode.credited` event |
| **Refund** | ✅ Yes | Full refund support |

**Best For:** India-based stores

### Stripe (Global) ✅ Wide Support

| Feature | Support | Notes |
|---------|---------|-------|
| **Payment Links** | ✅ Yes | Generate QR from payment link |
| **Stripe Terminal** | ✅ Yes | Integrated card readers |
| **UPI (India)** | ✅ Yes | Via Payment Intents |
| **Webhook** | ✅ Yes | `payment_intent.succeeded` |
| **Refund** | ✅ Yes | Full/partial refunds |

**Supported Regions:** US, UK, EU, Canada, Australia, Singapore, India, 40+ countries
**Best For:** Global/multi-region stores

### PayPal (Global) ✅ Wide Support

| Feature | Support | Notes |
|---------|---------|-------|
| **PayPal QR Code** | ✅ Yes | In-store QR payments |
| **Venmo QR (US)** | ✅ Yes | US customers with Venmo |
| **QR Code API** | ✅ Yes | Generate dynamic QR |
| **Webhook (IPN)** | ✅ Yes | Instant Payment Notification |
| **Refund** | ✅ Yes | Full refund support |

**Supported Regions:** US, UK, EU, Canada, Australia, 200+ countries
**Best For:** US/UK stores, international customers

### Summary by Region

| Region | Recommended Gateway | Alternative |
|--------|-------------------|-------------|
| **India** | Razorpay (UPI QR) | Stripe (UPI), Custom QR |
| **United States** | PayPal + Venmo | Stripe Payment Links |
| **United Kingdom** | PayPal QR | Stripe Payment Links |
| **Europe** | PayPal QR | Stripe Payment Links |
| **Australia/NZ** | Stripe | PayPal |
| **Southeast Asia** | Stripe | Custom QR |
| **Other** | Custom QR | Stripe Payment Links |

---

## Implementation Phases

### Phase 1: Database & API Foundation
**Duration:** 2-3 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 1.1 | Extend Store model with `posPaymentSettings` | `backend/src/models/store.model.ts` |
| 1.2 | Extend Order model with `posPaymentDetails` | `backend/src/models/order.model.ts` |
| 1.3 | Create migration script for existing stores | `backend/src/scripts/migrate-pos-payment-settings.ts` |
| 1.4 | Update Store validation schema | `backend/src/controllers/store.controller.ts` |
| 1.5 | Create POS Payment Settings API endpoints | `backend/src/routes/store.routes.ts` |

### Phase 2: Gateway QR Integration
**Duration:** 3-4 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 2.1 | Create POS Payment Service interface | `backend/src/services/pos-payment.service.ts` |
| 2.2 | Implement Razorpay QR service (India) | `backend/src/services/razorpay-qr.service.ts` |
| 2.3 | Implement PayPal QR service (US/UK/Global) | `backend/src/services/paypal-qr.service.ts` |
| 2.4 | Implement Stripe Payment Link QR service | `backend/src/services/stripe-qr.service.ts` |
| 2.5 | Create Gateway Factory for QR services | `backend/src/services/qr-gateway-factory.ts` |
| 2.6 | Add QR code generation endpoint | `backend/src/routes/pos.routes.ts` |
| 2.7 | Implement payment status polling endpoint | `backend/src/controllers/pos.controller.ts` |
| 2.8 | Add webhook handlers for all gateways | `backend/src/controllers/webhook.controller.ts` |

### Phase 3: Admin Configuration UI
**Duration:** 2-3 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 3.1 | Create POS Payment Settings page | `admin/src/app/stores/[id]/pos/payment/page.tsx` |
| 3.2 | Add payment method enable/disable toggles | Component in above page |
| 3.3 | Create QR Settings configuration component | `admin/src/components/pos/QRSettingsForm.tsx` |
| 3.4 | Integrate FileManager for custom QR upload | Use existing FileManager component |
| 3.5 | Add gateway selection dropdown (filtered by QR support) | Component with gateway capabilities filter |
| 3.6 | Create verification mode selector | Radio group component |

### Phase 4: POS Checkout Integration
**Duration:** 3-4 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 4.1 | Update CheckoutModal to read `posPaymentSettings` | `pos/src/components/checkout/CheckoutModal.tsx` |
| 4.2 | Conditionally show/hide payment method buttons | Based on `enabledMethods` config |
| 4.3 | Create QR Payment Modal component | `pos/src/components/checkout/QRPaymentModal.tsx` |
| 4.4 | Implement dynamic QR generation flow | API call + display |
| 4.5 | Implement static QR display flow | Show custom QR image |
| 4.6 | Add payment polling/verification UI | Polling with status indicator |
| 4.7 | Create manual verification form | For custom QR mode |
| 4.8 | Update checkout API call with payment details | Include `posPaymentDetails` |
| 4.9 | Support region-specific QR labels & instructions | Configurable per gateway |

### Phase 5: Payment Tracking & Reporting
**Duration:** 2-3 days

| Task | Description | Files Affected |
|------|-------------|----------------|
| 5.1 | Update POS Session summary with QR payment breakdown | `pos/src/components/session/SessionSummary.tsx` |
| 5.2 | Add payment reference search in orders | `admin/src/app/orders/page.tsx` |
| 5.3 | Create QR payment reconciliation view | `admin/src/app/reports/pos-payments/page.tsx` |
| 5.4 | Add refund support for QR payments (all gateways) | `backend/src/services/pos-payment.service.ts` |
| 5.5 | Implement webhook logging for audit trail | `backend/src/models/webhook-log.model.ts` |

### Phase 6: Testing & Documentation
**Duration:** 2-3 days

| Task | Description |
|------|-------------|
| 6.1 | Unit tests for all QR generation services |
| 6.2 | Integration tests for payment flow |
| 6.3 | E2E tests for POS checkout with QR |
| 6.4 | Test Razorpay sandbox QR flow (India) |
| 6.5 | Test PayPal sandbox QR flow (US/UK) |
| 6.6 | Test Stripe test mode flow |
| 6.7 | Documentation for store owners |
| 6.8 | Admin user guide for configuration |

---

## Detailed Technical Specifications

### API Endpoints

```
POST   /api/v1/pos/qr/generate          # Generate dynamic QR for transaction
GET    /api/v1/pos/qr/:id/status        # Check payment status
POST   /api/v1/pos/qr/:id/verify        # Manual verification
DELETE /api/v1/pos/qr/:id               # Cancel/close QR code
POST   /api/v1/pos/payment/refund       # Refund QR payment

# Webhooks (gateway-specific)
POST   /api/v1/webhooks/razorpay/qr     # Razorpay QR webhook
POST   /api/v1/webhooks/paypal/qr       # PayPal IPN webhook
POST   /api/v1/webhooks/stripe/qr       # Stripe webhook
```

### Generate QR Request/Response

```typescript
// Request
POST /api/v1/pos/qr/generate
{
  storeId: string;
  orderId?: string;        // If order already created
  amount: number;
  currency: string;        // "INR", "USD", "GBP", "EUR", etc.
  description?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

// Response
{
  success: true;
  data: {
    qrId: string;
    qrCodeUrl: string;      // Image URL or base64
    qrCodeSvg?: string;     // SVG for crisp display
    paymentLink?: string;   // For deeplink (UPI intent, PayPal app)
    amount: number;
    currency: string;
    expiresAt: Date;
    gatewayType: "razorpay" | "stripe" | "paypal" | "custom";
    gatewayOrderId?: string;
    displayInfo: {
      label: string;        // "Scan with UPI" / "Scan with PayPal"
      merchantName: string;
      paymentId?: string;   // UPI ID / PayPal.me link
    };
  }
}
```

### Payment Status Polling

```typescript
// Request
GET /api/v1/pos/qr/:qrId/status

// Response - Pending
{
  status: "pending";
  amount: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date;
}

// Response - Completed
{
  status: "completed";
  amount: number;
  currency: string;
  paidAt: Date;
  paymentId: string;
  transactionRef: string;   // UTR (India) / Transaction ID (PayPal/Stripe)
  payerIdentifier?: string; // Payer VPA / PayPal email / Venmo handle
}
```

### Webhook Payloads

```typescript
// Razorpay QR Credited Webhook (India)
{
  entity: "event";
  event: "qrcode.credited";
  payload: {
    qr_code: { entity: { id: "qr_xxx", amount: 50000 } },
    payment: { entity: { id: "pay_xxx", vpa: "customer@upi", method: "upi" } }
  }
}

// PayPal IPN Webhook (Global)
{
  txn_id: "xxx",
  payment_status: "Completed",
  mc_gross: "50.00",
  mc_currency: "USD",
  payer_email: "customer@example.com"
}

// Stripe Webhook (Global)
{
  type: "payment_intent.succeeded",
  data: {
    object: {
      id: "pi_xxx",
      amount: 5000,
      currency: "usd",
      status: "succeeded"
    }
  }
}
```

---

## Component Architecture

### POS Checkout Flow (Updated)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CheckoutModal                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │    CASH     │  │    CARD     │  │   UPI/QR    │             │
│   │  (if enabled)│  │  (if enabled)│  │  (if enabled)│           │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│          │                │                │                     │
│          ▼                ▼                ▼                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│   │CashPayment  │  │CardPayment  │  │   QRPaymentModal    │     │
│   │   Form      │  │   Form      │  │                     │     │
│   │             │  │             │  │  ┌───────────────┐  │     │
│   │ Amount Input│  │ Ref# Input  │  │  │   QR Code     │  │     │
│   │ Change Calc │  │ Card Last 4 │  │  │   Display     │  │     │
│   │             │  │ Auth Code   │  │  └───────────────┘  │     │
│   │             │  │             │  │                     │     │
│   │             │  │             │  │  ┌───────────────┐  │     │
│   │             │  │             │  │  │ Status:       │  │     │
│   │             │  │             │  │  │ ⏳ Waiting... │  │     │
│   │             │  │             │  │  └───────────────┘  │     │
│   │             │  │             │  │                     │     │
│   │             │  │             │  │  [Manual Verify]    │     │
│   └─────────────┘  └─────────────┘  └─────────────────────┘     │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                  Complete Payment                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### QR Payment Modal States

```
┌─────────────────────────────────────────────────────────────────┐
│                    QRPaymentModal States                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  State: LOADING                                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │        ⏳ Generating QR Code...         │                    │
│  │           [Spinner Animation]            │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  State: QR_DISPLAYED                                             │
│  ┌─────────────────────────────────────────┐                    │
│  │         Pay $49.99 / ₹1,299.00          │                    │
│  │                                          │                    │
│  │         ┌──────────────┐                │                    │
│  │         │  █▀▀▀▀▀▀█   │                │                    │
│  │         │  █ QR   █   │                │                    │
│  │         │  █ CODE █   │                │                    │
│  │         │  █▄▄▄▄▄▄█   │                │                    │
│  │         └──────────────┘                │                    │
│  │                                          │                    │
│  │    [Dynamic label based on gateway]     │                    │
│  │    "Scan with any UPI app"              │  ← India           │
│  │    "Scan with PayPal or Venmo"          │  ← US              │
│  │    "Scan with PayPal"                   │  ← UK/EU           │
│  │                                          │                    │
│  │    ⏳ Waiting for payment... (2:45)     │                    │
│  │                                          │                    │
│  │    [I've Received Payment Manually]     │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  State: PAYMENT_RECEIVED                                         │
│  ┌─────────────────────────────────────────┐                    │
│  │         ✅ Payment Received!            │                    │
│  │                                          │                    │
│  │    Amount: $49.99 / ₹1,299.00           │                    │
│  │    Ref: 123456789012                    │                    │
│  │    Time: 2:34 PM                        │                    │
│  │                                          │                    │
│  │         [Complete Order]                │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  State: MANUAL_VERIFICATION (Custom QR mode)                     │
│  ┌─────────────────────────────────────────┐                    │
│  │    Enter Payment Reference              │                    │
│  │                                          │                    │
│  │    Transaction/Reference Number:        │                    │
│  │    ┌────────────────────────────────┐   │                    │
│  │    │ 123456789012                   │   │                    │
│  │    └────────────────────────────────┘   │                    │
│  │                                          │                    │
│  │    Payer Name (Optional):               │                    │
│  │    ┌────────────────────────────────┐   │                    │
│  │    │ John Doe                       │   │                    │
│  │    └────────────────────────────────┘   │                    │
│  │                                          │                    │
│  │    [Cancel]  [Confirm Payment Received] │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Configuration UI

### POS Payment Settings Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Store Settings > POS > Payment Methods                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Enabled Payment Methods                                      ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  ☑️ Cash                                                     ││
│  │     └─ ☐ Enable round-off (nearest ₹10)                     ││
│  │                                                              ││
│  │  ☑️ Card                                                     ││
│  │     └─ Terminal: Manual entry (no integration)              ││
│  │                                                              ││
│  │  ☑️ QR Code Payments                                        ││
│  │     └─ [Configure QR Settings ▶]                            ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ QR Code Settings                                             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  QR Mode:                                                    ││
│  │  ○ Gateway QR (Dynamic, auto-verified)                      ││
│  │  ● Custom QR (Static, manual verification)                  ││
│  │                                                              ││
│  │  ── Gateway QR Settings ─────────────────────────────────   ││
│  │  │                                                          │││
│  │  │  Select Payment Gateway:                                 │││
│  │  │  ┌────────────────────────────────────────────────┐     │││
│  │  │  │ Razorpay (UPI QR) - India              ▼       │     │││
│  │  │  │ PayPal (QR Code) - US/UK/Global                │     │││
│  │  │  │ Stripe (Payment Links) - Global                │     │││
│  │  │  └────────────────────────────────────────────────┘     │││
│  │  │                                                          │││
│  │  │  [Gateway-specific options appear here]                  │││
│  │  │                                                          │││
│  │  │  Verification Mode:                                      │││
│  │  │  ○ Auto (Poll gateway every 3 seconds)                  │││
│  │  │  ● Webhook (Instant notification)                       │││
│  │  │  ○ Manual (Staff confirms)                              │││
│  │  │                                                          │││
│  │  ─────────────────────────────────────────────────────────  ││
│  │                                                              ││
│  │  ── Custom QR Settings ──────────────────────────────────   ││
│  │  │                                                          │││
│  │  │  QR Code Image:                                          │││
│  │  │  ┌──────────────────┐                                   │││
│  │  │  │    [QR Image]    │  [Upload from FileManager]        │││
│  │  │  │                  │                                   │││
│  │  │  └──────────────────┘                                   │││
│  │  │                                                          │││
│  │  │  Payment Type: ┌────────────────────────────────────┐   │││
│  │  │                │ UPI / PayPal / Venmo / Other   ▼   │   │││
│  │  │                └────────────────────────────────────┘   │││
│  │  │                                                          │││
│  │  │  Payment ID: ┌──────────────────────────────────────┐   │││
│  │  │              │ store@okicici / paypal.me/store      │   │││
│  │  │              └──────────────────────────────────────┘   │││
│  │  │              (UPI VPA, PayPal.me link, Venmo handle)    │││
│  │  │                                                          │││
│  │  │  Merchant Name: ┌───────────────────────────────────┐   │││
│  │  │                 │ My Store                          │   │││
│  │  │                 └───────────────────────────────────┘   │││
│  │  │                                                          │││
│  │  ─────────────────────────────────────────────────────────  ││
│  │                                                              ││
│  │  Display Options:                                            ││
│  │  ☑️ Show amount on QR screen                                ││
│  │  ☑️ Show payment identifier                                 ││
│  │  ☑️ Show merchant name                                      ││
│  │                                                              ││
│  │  QR Label (shown to customer):                               ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │ Scan to Pay                                          │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  Custom Instructions:                                        ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │ Scan with your preferred payment app                 │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│                                    [Cancel]  [Save Settings]     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### Webhook Verification
```typescript
// Razorpay webhook signature verification
const isValid = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(req.body))
  .digest('hex') === req.headers['x-razorpay-signature'];
```

### QR Code Expiration
- Dynamic QR codes should expire after 10-15 minutes
- Implement timeout handling in POS UI
- Close expired QR codes on gateway

### Amount Verification
- Always verify payment amount matches order amount
- Handle partial payments gracefully
- Log discrepancies for reconciliation

### Access Control
- Only authorized POS users can generate QR codes
- Verify store association for all operations
- Audit log for payment verifications

---

## Database Migrations

### Migration: Add posPaymentSettings to Store

```typescript
// backend/src/scripts/migrate-pos-payment-settings.ts

const defaultPosPaymentSettings = {
  enabledMethods: {
    cash: true,
    card: true,
    qr: false  // Disabled by default, admin must configure
  },
  cashSettings: {
    enableRoundOff: false,
    roundOffTo: 'nearest10',
    requireExactAmount: false
  },
  cardSettings: {
    terminalType: 'manual'
  },
  qrSettings: {
    mode: 'custom',
    verification: {
      mode: 'manual',
      timeout: 600 // 10 minutes
    },
    displaySettings: {
      showAmount: true,
      showMerchantName: true,
      showPaymentId: true,
      qrLabel: 'Scan to Pay'
    }
  }
};

// Apply to all existing stores with POS enabled
await Store.updateMany(
  { 'posSettings.enabled': true },
  { $set: { posPaymentSettings: defaultPosPaymentSettings } }
);
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| QR generation failed | Show error, allow retry or fallback to manual |
| Payment timeout | Show timeout message, option to regenerate or cancel |
| Webhook missed | Implement polling fallback |
| Gateway unavailable | Fallback to custom QR or other payment methods |
| Amount mismatch | Flag for manual review, don't auto-complete |

---

## Monitoring & Observability

### Metrics to Track
- QR generation success/failure rate
- Average time to payment (QR displayed → payment received)
- Payment verification method distribution (auto vs manual)
- Gateway-wise success rates
- Timeout rate

### Logging
```typescript
logger.info('POS_QR_GENERATED', {
  storeId, orderId, amount, gatewayType, qrId
});

logger.info('POS_QR_PAYMENT_RECEIVED', {
  storeId, orderId, amount, paymentId, utr, 
  verificationMethod: 'webhook' | 'polling' | 'manual',
  timeToPayment: durationMs
});
```

---

## TODO Checklist

### Phase 1: Database & API Foundation
- [ ] 1.1 Extend Store model with `posPaymentSettings` schema
- [ ] 1.2 Extend Order model with `posPaymentDetails` schema
- [ ] 1.3 Create TypeScript interfaces for new schemas
- [ ] 1.4 Write migration script for existing stores
- [ ] 1.5 Update Store controller validation
- [ ] 1.6 Create GET/PUT endpoints for POS payment settings
- [ ] 1.7 Add unit tests for new model fields

### Phase 2: Gateway QR Integration
- [ ] 2.1 Create `IPosQRService` interface (generic for all gateways)
- [ ] 2.2 Implement `RazorpayQRService` class (India - UPI)
  - [ ] 2.2.1 `generateQR(amount, currency, metadata)` method
  - [ ] 2.2.2 `getPaymentStatus(qrId)` method
  - [ ] 2.2.3 `closeQR(qrId)` method
  - [ ] 2.2.4 `processRefund(paymentId, amount)` method
- [ ] 2.3 Implement `PayPalQRService` class (US/UK/Global)
  - [ ] 2.3.1 `generateQR(amount, currency, metadata)` method
  - [ ] 2.3.2 `getPaymentStatus(orderId)` method
  - [ ] 2.3.3 `cancelOrder(orderId)` method
  - [ ] 2.3.4 `processRefund(captureId, amount)` method
- [ ] 2.4 Implement `StripeQRService` class (Global - Payment Links)
  - [ ] 2.4.1 `generatePaymentLink(amount, currency, metadata)` method
  - [ ] 2.4.2 `convertToQR(paymentLink)` method
  - [ ] 2.4.3 `getPaymentStatus(paymentIntentId)` method
  - [ ] 2.4.4 `processRefund(paymentIntentId, amount)` method
- [ ] 2.5 Create `QRGatewayFactory` for gateway selection
- [ ] 2.6 Create POS Payment controller
- [ ] 2.7 Add QR generation route: `POST /pos/qr/generate`
- [ ] 2.8 Add status check route: `GET /pos/qr/:id/status`
- [ ] 2.9 Add manual verify route: `POST /pos/qr/:id/verify`
- [ ] 2.10 Add cancel route: `DELETE /pos/qr/:id`
- [ ] 2.11 Implement Razorpay QR webhook handler
- [ ] 2.12 Implement PayPal IPN webhook handler
- [ ] 2.13 Implement Stripe webhook handler
- [ ] 2.14 Add webhook signature verification for all gateways
- [ ] 2.15 Create webhook logging model

### Phase 3: Admin Configuration UI
- [ ] 3.1 Create POS Payment Settings page route
- [ ] 3.2 Build payment method toggle switches component
- [ ] 3.3 Build QR Settings form component
- [ ] 3.4 Implement gateway dropdown (filter by QR support + region)
- [ ] 3.5 Add gateway-specific options (Razorpay: UPI/BharatQR, PayPal: PayPal/Venmo)
- [ ] 3.6 Integrate FileManager for custom QR upload
- [ ] 3.7 Add payment type dropdown (UPI/PayPal/Venmo/Other)
- [ ] 3.8 Add payment identifier input with format hints
- [ ] 3.9 Build verification mode radio group
- [ ] 3.10 Add display options checkboxes
- [ ] 3.11 Add QR label and instructions inputs
- [ ] 3.12 Implement form submission with API call
- [ ] 3.13 Add success/error toast notifications
- [ ] 3.14 Add navigation from main POS settings page

### Phase 4: POS Checkout Integration
- [ ] 4.1 Add `posPaymentSettings` to store context/state
- [ ] 4.2 Update CheckoutModal payment buttons visibility
- [ ] 4.3 Rename 'upi' button to generic 'qr' with dynamic label
- [ ] 4.4 Create QRPaymentModal component
  - [ ] 4.4.1 Loading state with spinner
  - [ ] 4.4.2 QR display state with countdown timer
  - [ ] 4.4.3 Payment received success state
  - [ ] 4.4.4 Manual verification form state
  - [ ] 4.4.5 Error/timeout state
- [ ] 4.5 Implement dynamic QR generation API call
- [ ] 4.6 Implement custom/static QR display
- [ ] 4.7 Build payment status polling hook
- [ ] 4.8 Handle webhook-based instant verification
- [ ] 4.9 Build manual verification form
- [ ] 4.10 Update checkout API to include `posPaymentDetails`
- [ ] 4.11 Add keyboard shortcuts for QR modal
- [ ] 4.12 Handle QR modal close/cancel properly
- [ ] 4.13 Display region-appropriate labels and instructions

### Phase 5: Payment Tracking & Reporting
- [ ] 5.1 Update POS Session model for detailed QR payment breakdown
- [ ] 5.2 Update Session Summary component
- [ ] 5.3 Add transaction reference search in order list
- [ ] 5.4 Create payment reconciliation report page
- [ ] 5.5 Implement refund flow for QR payments (all gateways)
- [ ] 5.6 Add refund button in order details (admin)
- [ ] 5.7 Create webhook log viewer in admin

### Phase 6: Testing & Documentation
- [ ] 6.1 Unit tests for RazorpayQRService
- [ ] 6.2 Unit tests for PayPalQRService
- [ ] 6.3 Unit tests for StripeQRService
- [ ] 6.4 Unit tests for POS Payment controller
- [ ] 6.5 Integration tests for QR payment flow
- [ ] 6.6 Test with Razorpay test mode (India)
- [ ] 6.7 Test with PayPal sandbox (US/UK)
- [ ] 6.8 Test with Stripe test mode
- [ ] 6.9 E2E test for complete checkout flow
- [ ] 6.10 Write API documentation
- [ ] 6.11 Write admin user guide (multi-region)
- [ ] 6.12 Write troubleshooting guide

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database & API | 2-3 days | None |
| Phase 2: Gateway Integration | 3-4 days | Phase 1 |
| Phase 3: Admin UI | 2-3 days | Phase 1 |
| Phase 4: POS Checkout | 3-4 days | Phase 2, 3 |
| Phase 5: Tracking & Reports | 2-3 days | Phase 4 |
| Phase 6: Testing & Docs | 2-3 days | Phase 5 |

**Total Estimated Time: 16-22 days**

---

## Future Enhancements

1. **Integrated Card Terminals** - Razorpay POS / Stripe Terminal integration
2. **Split Payments** - Pay partially with cash + QR
3. **Payment Links via SMS/WhatsApp** - Send payment link to customer
4. **Offline Mode** - Queue payments when offline
5. **Multi-currency** - Dynamic currency based on store location
6. **Tap to Pay** - NFC-based payments on supported devices
7. **Regional Gateway Auto-Selection** - Auto-suggest gateway based on store country

---

## Appendix

### Gateway API References

**Razorpay QR (India)**
- [Create QR Code](https://razorpay.com/docs/payments/qr-codes/apis/#create-a-qr-code)
- [Fetch QR Code](https://razorpay.com/docs/payments/qr-codes/apis/#fetch-a-qr-code)
- [Close QR Code](https://razorpay.com/docs/payments/qr-codes/apis/#close-a-qr-code)
- [QR Webhooks](https://razorpay.com/docs/webhooks/payloads/qr-codes/)

**PayPal QR (Global)**
- [PayPal QR Code Payments](https://developer.paypal.com/docs/business/checkout/set-up-qr-codes/)
- [Venmo for Business](https://developer.paypal.com/docs/checkout/apm-reference/venmo/)
- [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)

**Stripe (Global)**
- [Payment Links](https://stripe.com/docs/payment-links)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Terminal](https://stripe.com/docs/terminal) (for card readers)

### QR Code Generation Libraries
- **Node.js**: `qrcode` - Generate QR from payment links
- **Client-side**: `qrcode.react` - React component for QR display

### Payment Type Formats
| Type | Format Example |
|------|---------------|
| UPI (India) | `store@okicici`, `store@paytm` |
| PayPal.me | `paypal.me/storename` |
| Venmo | `@StoreName` |
| Bank Transfer | Account number / IBAN |

### Test Credentials
- **Razorpay Test Mode**: Use test API keys, test UPI `success@razorpay`
- **PayPal Sandbox**: Use sandbox credentials from developer.paypal.com
- **Stripe Test Mode**: Use `pk_test_` and `sk_test_` keys
