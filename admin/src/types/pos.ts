// POS (Point of Sale) related types

export interface POSSettings {
    enabled: boolean;
    allowQuickCheckout: boolean;
    requireCustomerDetails: boolean;
    defaultPaymentMethod: 'cash' | 'card' | 'upi';
    enableRoundOff: boolean;
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
}

export interface POSSession {
    _id: string;
    storeId: string;
    userId: string;
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
