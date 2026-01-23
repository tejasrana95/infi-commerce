import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';

class BarcodeService {
  private scanner: Html5Qrcode | null = null;
  private isScanning = false;
  private lastScannedCode: string | null = null;
  private lastScanTime: number = 0;
  private readonly SCAN_COOLDOWN = 2000; // 2 seconds between same code scans
  private readonly SCANNER_TYPING_SPEED_THRESHOLD = 50; // ms between keystrokes

  // Supported barcode formats - prioritize 1D barcodes
  private readonly supportedFormats = [
    // 1D Barcodes (prioritized)
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
    // 2D Barcodes
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
    Html5QrcodeSupportedFormats.AZTEC,
    Html5QrcodeSupportedFormats.PDF_417,
  ];

  /**
   * Validate if a string is a valid barcode format
   */
  isValidBarcode(barcode: string): boolean {
    if (!barcode || typeof barcode !== 'string') {
      return false;
    }

    const trimmed = barcode.trim();
    
    // Minimum length check
    if (trimmed.length < 3) {
      return false;
    }

    // Maximum length check (most barcodes are under 50 chars)
    if (trimmed.length > 100) {
      return false;
    }

    // Check for valid characters (alphanumeric, some special chars for certain formats)
    const validPattern = /^[A-Za-z0-9\-_.]+$/;
    
    return validPattern.test(trimmed);
  }

  /**
   * Detect if input is from a barcode scanner based on typing speed
   * Scanners typically input characters much faster than human typing
   */
  detectScannerInput(value: string, avgTypingSpeed: number): boolean {
    // If no typing speed data, can't determine
    if (!avgTypingSpeed || avgTypingSpeed === 0 || isNaN(avgTypingSpeed)) {
      return false;
    }

    // Scanner input is typically very fast (< 50ms between characters)
    // Human typing is usually > 100ms between characters
    const isFastInput = avgTypingSpeed < this.SCANNER_TYPING_SPEED_THRESHOLD;

    // Also check if the value looks like a barcode
    const looksLikeBarcode = this.isValidBarcode(value);

    // Minimum length for auto-submit
    const hasMinLength = value.length >= 6;

    return isFastInput && looksLikeBarcode && hasMinLength;
  }

  async startCameraScan(
    videoElement: HTMLVideoElement,
    onSuccess: (barcode: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Stop any existing scan first
      await this.stopCameraScan();

      const containerId = 'barcode-scanner-container';
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        videoElement.parentElement?.appendChild(container);
      } else {
        container.innerHTML = '';
      }

      videoElement.style.display = 'none';

      this.scanner = new Html5Qrcode(containerId, {
        formatsToSupport: this.supportedFormats,
        verbose: false,
      });

      this.isScanning = true;

      const cameras = await Html5Qrcode.getCameras();
      
      if (!cameras || cameras.length === 0) {
        throw new Error('No cameras found on this device');
      }

      const backCamera = cameras.find(
        (camera) =>
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
      );

      const cameraId = backCamera?.id || cameras[0].id;

      const containerWidth = container.offsetWidth || 640;
      const containerHeight = container.offsetHeight || 480;
      
      const qrboxWidth = Math.min(containerWidth * 0.8, 400);
      const qrboxHeight = Math.min(containerHeight * 0.3, 150);

      await this.scanner.start(
        cameraId,
        {
          fps: 15, // Higher FPS for better detection
          qrbox: { 
            width: qrboxWidth, 
            height: qrboxHeight 
          },
          aspectRatio: containerWidth / containerHeight,
          disableFlip: false,
        },
        (decodedText, decodedResult) => {
          const now = Date.now();
          
          // Prevent duplicate scans of the same code within cooldown period
          if (
            decodedText === this.lastScannedCode &&
            now - this.lastScanTime < this.SCAN_COOLDOWN
          ) {
            return; // Ignore duplicate scan
          }

          this.lastScannedCode = decodedText;
          this.lastScanTime = now;

          console.log('Barcode scanned:', decodedText, 'Format:', decodedResult.result.format?.formatName);
          
          // Don't stop scanning - just call success callback
          // The modal will handle pausing/resuming
          onSuccess(decodedText);
        },
        () => {
          // Silent - frequent when no barcode detected
        }
      );

      this.addScannerStyles(containerId);

    } catch (error) {
      this.isScanning = false;
      console.error('Failed to start camera scan:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to access camera. Please ensure camera permissions are granted.';
      
      onError(new Error(errorMessage));
    }
  }

  private addScannerStyles(containerId: string): void {
    const styleId = 'barcode-scanner-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #${containerId} video {
          object-fit: cover !important;
        }
        #${containerId} #qr-shaded-region {
          border-color: rgba(59, 130, 246, 0.5) !important;
        }
        #${containerId} #qr-shaded-region > div {
          background-color: rgba(59, 130, 246, 0.8) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  async stopCameraScan(): Promise<void> {
    if (this.scanner && this.isScanning) {
      try {
        const state = this.scanner.getState();
        if (state === 2) {
          await this.scanner.stop();
        }
        this.scanner.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    
    this.isScanning = false;
    this.scanner = null;
    this.lastScannedCode = null;
    this.lastScanTime = 0;

    const container = document.getElementById('barcode-scanner-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  // Reset the cooldown to allow re-scanning same code
  resetScanCooldown(): void {
    this.lastScannedCode = null;
    this.lastScanTime = 0;
  }

  // Scan from image file
  async scanFromFile(file: File): Promise<string> {
    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-scanner-' + Date.now();
    tempContainer.style.display = 'none';
    document.body.appendChild(tempContainer);

    const scanner = new Html5Qrcode(tempContainer.id, {
      formatsToSupport: this.supportedFormats,
      verbose: false,
    });

    try {
      const result = await scanner.scanFile(file, true);
      return result;
    } finally {
      scanner.clear();
      tempContainer.remove();
    }
  }

  // Check if camera is available
  async isCameraAvailable(): Promise<boolean> {
    try {
      const cameras = await Html5Qrcode.getCameras();
      return cameras && cameras.length > 0;
    } catch {
      return false;
    }
  }

  // Get list of available cameras
  async getAvailableCameras(): Promise<Array<{ id: string; label: string }>> {
    try {
      const cameras = await Html5Qrcode.getCameras();
      return cameras.map((camera) => ({
        id: camera.id,
        label: camera.label || `Camera ${camera.id}`,
      }));
    } catch {
      return [];
    }
  }
}

export const barcodeService = new BarcodeService();
