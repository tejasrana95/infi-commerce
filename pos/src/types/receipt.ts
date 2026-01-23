export interface ReceiptData {
    orderNumber: string;
    date: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    storeEmail?: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'card' | 'upi';
    cashReceived?: number;
    change?: number;
    roundOffAmount?: number;
    customerName?: string;
    customerPhone?: string;
    receiptHeader?: string;
    receiptFooter?: string;
    cashierName?: string;
}

export interface ReceiptItem {
    name: string;
    sku: string;
    quantity: number;
    price: number;
    total: number;
    attributes?: Record<string, string>;
}

export interface PrinterSettings {
    autoprint: boolean;
    printerType: 'thermal' | 'standard';
    paperWidth: 58 | 80; // mm
    copies: number;
}
