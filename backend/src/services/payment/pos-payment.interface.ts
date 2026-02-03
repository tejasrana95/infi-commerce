
export interface QRGenerationParams {
    amount: number;
    currency: string;
    description?: string;
    orderId: string;
    storeId: string;
    storeDomain?: string;
    posSessionId?: string; // POS session ID for matching orders
    metadata?: Record<string, any>;
    customerDetails?: {
        id?: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
        };
    };
}

export interface QRGenerationResult {
    qrCodeId: string;
    qrCodeUrl?: string;     // URL to the image of the QR code
    qrCodeData?: string;    // Raw data string (e.g. UPI format) to render locally
    paymentLink?: string;   // Deep link
    expiresAt?: Date;
    gatewayReferenceId?: string; // ID on the gateway side
}

export interface QRPaymentStatus {
    status: 'pending' | 'completed' | 'failed' | 'expired';
    amount?: number;
    currency?: string;
    paymentId?: string;
    transactionRef?: string;
    payerIdentifier?: string;
    paidAt?: Date;
    gatewayResponse?: any;
}

export interface IPosQRService {
    /**
     * Generate a QR code for a specific transaction
     */
    generateQR(params: QRGenerationParams): Promise<QRGenerationResult>;

    /**
     * Check the status of a payment associated with a QR code
     * @param qrId The local ID or gateway reference ID of the QR code transaction
     */
    getQRPaymentStatus(qrId: string): Promise<QRPaymentStatus>;

    /**
     * Cancel a dynamic QR code if supported
     */
    cancelQR(qrId: string): Promise<boolean>;

    /**
     * Process refund for a QR payment
     */
    processRefund(params: { paymentId: string; amount: number; reason?: string }): Promise<any>;
}
