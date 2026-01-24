export interface POSReceiptSettings {
    showLogo: boolean;
    paperWidth: string;
}

export interface POSBarcodeSettings {
    format: string;
    printWidth: number;
    printHeight: number;
}

export interface POSSettings {
    receiptSettings: POSReceiptSettings;
    barcodeSettings: POSBarcodeSettings;
    enabled: boolean;
    allowQuickCheckout: boolean;
    requireCustomerDetails: boolean;
    defaultPaymentMethod: 'cash' | 'card' | 'qr';
}
