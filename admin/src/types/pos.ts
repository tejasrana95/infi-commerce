// POS (Point of Sale) related types

export interface POSSettings {
  enabled: boolean;
  allowQuickCheckout: boolean;
  requireCustomerDetails: boolean;
  defaultPaymentMethod: 'cash' | 'card' | 'qr';
  receiptSettings: {
    headerText?: string;
    footerText?: string;
    showLogo: boolean;
    paperWidth: '58mm' | '80mm';
  };
  barcodeSettings: {
    format: 'CODE128' | 'EAN13' | 'QR';
    printWidth: number;
    printHeight: number;
  };
  paymentSettings?: PosPaymentSettings;
}

export interface PosPaymentSettings {
  enabledMethods: {
    cash: boolean;
    card: boolean;
    qr: boolean;
  };
  cashSettings?: {
    enableRoundOff: boolean;
    roundOffTo: 'nearest1' | 'nearest5' | 'nearest10';
    requireExactAmount: boolean;
  };
  cardSettings?: {
    terminalType: 'manual' | 'integrated';
    terminalId?: string;
  };
  qrSettings?: PosQrSettings;
}

export interface PosQrSettings {
  mode: 'gateway' | 'custom';
  gatewayConfig?: {
    gatewayId: string; // PaymentGatewayConfig ID
    gatewayType: 'razorpay' | 'stripe' | 'paypal';
  };
  customConfig?: {
    qrCodeImage: string;
    upiId?: string;
  };
  verification: {
    mode: 'manual' | 'auto';
    autoVerifyProvider?: string;
  };
  displaySettings: {
    showAmount: boolean;
    instructions: string;
  };
}

export interface POSSession {
  _id: string;
  storeId: string;
  userId?: { firstName: string; lastName: string; role: string; email: string };
  sessionNumber: string;
  startedAt: Date;
  endedAt?: Date;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  totalTransactions: number;
  totalOrders: number;
  status: 'active' | 'closed';
  paymentBreakdown?: {
    cash: number;
    card: number;
    upi: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BarcodeFormat {
  label: string;
  value: 'CODE128' | 'EAN13' | 'QR';
  description: string;
}

export interface BarcodeGenerationResult {
  productId: string;
  barcode: string;
  error?: string;
}

export interface BarcodeSheetLayout {
  layout: '2x3' | '3x4' | '4x5';
  barcodes: Array<{
    productId: string;
    name: string;
    sku: string;
    barcode: string;
    image: string; // base64
  }>;
}

// Additional types for POS orders
export interface PriceOverride {
  itemId: string;
  originalPrice: number;
  overriddenPrice: number;
  userId: string;
  timestamp: Date;
  reason?: string;
}

export interface DiscountApplied {
  type: 'percentage' | 'fixed';
  value: number;
  appliedTo: 'cart' | 'item';
  itemId?: string;
  userId: string;
  timestamp: Date;
  reason?: string;
}
