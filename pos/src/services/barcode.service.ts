import { BrowserMultiFormatReader, Result } from '@zxing/library';

class BarcodeService {
    private codeReader: BrowserMultiFormatReader | null = null;
    private scanning = false;

    /**
     * Initialize the barcode scanner
     */
    initialize() {
        if (!this.codeReader) {
            this.codeReader = new BrowserMultiFormatReader();
        }
    }

    /**
     * Start scanning from camera
     */
    async startCameraScan(
        videoElement: HTMLVideoElement,
        onSuccess: (barcode: string) => void,
        onError: (error: Error) => void
    ): Promise<void> {
        try {
            this.initialize();
            if (!this.codeReader) {
                throw new Error('Code reader not initialized');
            }

            this.scanning = true;

            // Get available video devices
            const videoInputDevices = await this.codeReader.listVideoInputDevices();

            if (videoInputDevices.length === 0) {
                throw new Error('No camera device found');
            }

            // Use the first available camera (or back camera on mobile)
            const selectedDeviceId = videoInputDevices[0].deviceId;

            // Start decoding from video device
            this.codeReader.decodeFromVideoDevice(
                selectedDeviceId,
                videoElement,
                (result: Result | null, error?: Error) => {
                    if (result) {
                        const barcodeText = result.getText();
                        onSuccess(barcodeText);
                        this.stopCameraScan();
                    }
                    if (error && this.scanning) {
                        // Only report errors if we're still scanning
                        // Ignore NotFoundExceptions (means no barcode in frame)
                        if (error.name !== 'NotFoundException') {
                            console.error('Barcode scan error:', error);
                        }
                    }
                }
            );
        } catch (error) {
            console.error('Failed to start camera scan:', error);
            onError(error as Error);
            this.scanning = false;
        }
    }

    /**
     * Stop camera scanning
     */
    stopCameraScan() {
        if (this.codeReader) {
            this.codeReader.reset();
            this.scanning = false;
        }
    }

    /**
     * Validate barcode format
     */
    isValidBarcode(barcode: string): boolean {
        // Basic validation: barcode should be alphanumeric and have reasonable length
        const trimmed = barcode.trim();
        return trimmed.length >= 6 && trimmed.length <= 20 && /^[a-zA-Z0-9-_]+$/.test(trimmed);
    }

    /**
     * Detect if input is from a barcode scanner
     * Barcode scanners typically input very fast and end with Enter key
     */
    detectScannerInput(input: string, typingSpeed: number): boolean {
        // If user types faster than 50ms per character, it's likely a scanner
        // Most scanners input at ~10-30ms per character
        return typingSpeed < 50 && input.length >= 6;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopCameraScan();
        this.codeReader = null;
    }
}

export const barcodeService = new BarcodeService();
