import { Store } from '@/contexts/StoreContext';
import { Order, Customer, Return } from '@/types';

// Extended item type with additional fields from backend
interface ReceiptOrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  hsnCode?: string;
  originalPrice: number;        // Price before any discount (per unit)
  price: number;                // Final price after all discounts (per unit)
  quantity: number;
  image?: string;
  attributes?: Record<string, string>;
  categoryIds?: string[];
  taxRate?: number;
  taxAmount?: number;           // Tax per unit
  // Discount breakdown (per unit)
  discountAmount?: number;      // Total discount per unit
  couponDiscount?: number;      // Coupon portion per unit
  manualDiscount?: number;      // Manual/POS discount per unit
  isCouponEligible?: boolean;
  // Return tracking
  returnedQuantity?: number;
  refundedAmount?: number;
}

// Extended Order type for receipts - uses composition instead of extension
interface ReceiptOrder {
  id: string;
  orderNumber: string;
  date: string;
  createdAt?: string;
  status: Order['status'];
  customerId: string | Customer | null;
  items: ReceiptOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: Order['paymentMethod'];
  cashReceived?: number;
  change?: number;
  notes?: string;
  discount?: number;
  couponCode?: string;
  returns?: Return[];
  roundOffAmount?: number;
  posPaymentDetails?: {
    method: 'cash' | 'card' | 'upi' | 'qr' | 'stripe' | 'razorpay' | 'paypal';
    cashDetails?: {
      amountReceived: number;
      changeGiven: number;
      roundOffAmount: number;
    };
    cardDetails?: {
      cardLast4?: string;
      cardNetwork?: string;
    };
    qrDetails?: {
      paymentType?: string;
    };
  };
}

// Web Serial API type definitions for thermal printers
interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  writable: WritableStream<Uint8Array>;
  close(): Promise<void>;
}

interface PrinterConfig {
  type: 'thermal' | 'inkjet' | 'laser';
  paperWidth: 58 | 80; // mm
  copies: number;
  autocut: boolean;
}

class PrintService {
  private printerConfig: PrinterConfig = {
    type: 'inkjet',
    paperWidth: 80,
    copies: 1,
    autocut: true,
  };

  /**
   * Set printer configuration
   */
  setPrinterConfig(config: Partial<PrinterConfig>) {
    this.printerConfig = { ...this.printerConfig, ...config };
  }

  /**
   * Get printer configuration
   */
  getPrinterConfig(): PrinterConfig {
    return { ...this.printerConfig };
  }

  /**
   * Print receipt with support for multiple printer types
   */
  async printReceipt(
    receiptElement: HTMLElement,
    store?: Store,
    printerType?: 'thermal' | 'inkjet' | 'laser',
  ): Promise<void> {
    const type = printerType || this.printerConfig.type;

    if (type === 'thermal' && this.isWebSerialSupported()) {
      try {
        const port = await this.connectThermalPrinter();
        if (port) {
          // Extract data from receipt element and print to thermal printer
          await this.printToThermalPrinter(port, receiptElement, store);
          return;
        }
      } catch (error) {
        console.warn(
          'Failed to print to thermal printer, falling back to browser print:',
          error,
        );
      }
    }

    // Fall back to browser print for standard/inkjet printers
    await this.printWithBrowserDialog(receiptElement);
  }

  /**
   * Print receipt using browser print dialog (for inkjet/laser printers)
   */
  private async printWithBrowserDialog(
    receiptElement: HTMLElement,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (!printWindow) {
          throw new Error('Failed to open print window. Please allow popups.');
        }

        const styles = this.getReceiptStyles(this.printerConfig.paperWidth);
        const paperSize =
          this.printerConfig.paperWidth === 58 ? '58mm' : '80mm';

        printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <meta charset="UTF-8">
                            <title>Receipt</title>
                            <style>
                                ${styles}
                                
                                @media print {
                                    @page {
                                        size: ${paperSize} auto;
                                        margin: 0;
                                        padding: 0;
                                    }
                                    
                                    body {
                                        margin: 0;
                                        padding: 0;
                                        width: ${paperSize};
                                    }
                                    
                                    .receipt-container {
                                        width: ${paperSize} !important;
                                        margin: 0 !important;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            ${receiptElement.innerHTML}
                        </body>
                    </html>
                `);

        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();

            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 500);
          }, 250);
        };

        printWindow.onerror = (error) => {
          printWindow.close();
          reject(new Error('Print error: ' + error));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Auto-print receipt if setting is enabled
   */
  async autoPrint(
    receiptElement: HTMLElement,
    enabled: boolean,
    store?: Store,
  ): Promise<void> {
    if (enabled) {
      await this.printReceipt(receiptElement, store);
    }
  }

  /**
   * Get CSS styles for receipt based on paper width
   */
  private getReceiptStyles(paperWidth: 58 | 80 = 80): string {
    return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 11px;
                line-height: 1.5;
                color: #1f2937;
                background: white;
            }
            
            .receipt-container {
                background: white;
                width: ${paperWidth}mm;
                padding: 4mm;
                margin: 0 auto;
            }
            
            .receipt-header {
                text-align: center;
                margin-bottom: 12px;
            }
            
            .store-logo {
                width: 100%;
                max-width: 80px;
                margin: 0 auto 8px;
                display: block;
                object-fit: contain;
            }
            
            .store-name {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 4px;
                color: #111827;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .store-details {
                font-size: 10px;
                color: #4b5563;
                line-height: 1.4;
            }
            
            .receipt-section {
                margin-bottom: 12px;
            }
            
            .divider {
                border-bottom: 1px dashed #e5e7eb;
                margin: 12px 0;
            }
            
            .divider-solid {
                border-bottom: 1px solid #e5e7eb;
                margin: 12px 0;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
                margin-bottom: 12px;
                background: #f9fafb;
                padding: 8px;
                border-radius: 6px;
                border: 1px solid #f3f4f6;
            }

            .info-item {
                display: flex;
                flex-direction: column;
            }

            .info-label {
                font-size: 9px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .info-value {
                font-weight: 600;
                color: #111827;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }
            
            th {
                text-align: left;
                font-weight: 600;
                color: #6b7280;
                border-bottom: 1px solid #e5e7eb;
                padding: 8px 4px;
                font-size: 10px;
                text-transform: uppercase;
            }
            
            td {
                padding: 8px 4px;
                border-bottom: 1px solid #f3f4f6;
                vertical-align: top;
            }

            tr:last-child td {
                border-bottom: none;
            }
            
            .item-name {
                font-weight: 500;
                color: #111827;
                margin-bottom: 2px;
            }

            .item-detail {
                font-size: 9px;
                color: #6b7280;
            }
            
            .totals-section {
                padding-top: 8px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                font-size: 11px;
            }
            
            .total-row.grand-total {
                font-weight: 700;
                font-size: 14px;
                border-top: 2px solid #111827;
                padding-top: 12px;
                margin-top: 8px;
                color: #111827;
            }

            .payment-badge {
                display: inline-block;
                padding: 4px 8px;
                background: #eff6ff;
                color: #1d4ed8;
                border-radius: 4px;
                font-weight: 600;
                font-size: 10px;
                text-transform: uppercase;
                margin-top: 4px;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            
            .footer-text {
                font-size: 10px;
                color: #6b7280;
                max-width: 80%;
                margin: 0 auto;
            }

            .status-badge {
                text-align: center;
                padding: 6px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 11px;
                margin-bottom: 12px;
                text-transform: uppercase;
            }
        `;
  }

  /**
   * Check if Web Serial API is supported (for ESC/POS thermal printers)
   */
  isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /**
   * Connect to thermal printer via Web Serial API
   */
  async connectThermalPrinter(): Promise<SerialPort | null> {
    if (!this.isWebSerialSupported()) {
      console.warn('Web Serial API not supported in this browser');
      return null;
    }

    try {
      interface NavigatorWithSerial {
        serial: { requestPort: () => Promise<SerialPort> };
      }
      const port = await (
        navigator as unknown as NavigatorWithSerial
      ).serial.requestPort();
      await port.open({ baudRate: 9600 });
      return port;
    } catch (error) {
      console.error('Failed to connect to thermal printer:', error);
      return null;
    }
  }

  /**
   * Format text for thermal printer with proper padding
   */
  private formatThermalLine(
    text: string,
    width: number = 48,
    align: 'left' | 'center' | 'right' = 'left',
  ): string {
    const cleanText = text.substring(0, width);

    if (align === 'center') {
      const padding = Math.floor((width - cleanText.length) / 2);
      return ' '.repeat(Math.max(0, padding)) + cleanText;
    } else if (align === 'right') {
      return cleanText.padStart(width);
    }

    return cleanText;
  }

  /**
   * Print to thermal printer using ESC/POS commands
   */
  private async printToThermalPrinter(
    port: SerialPort,
    receiptElement: HTMLElement,
    store?: Store,
  ): Promise<void> {
    try {
      const writer = port.writable?.getWriter();
      if (!writer) {
        throw new Error('Cannot write to printer');
      }

      // ESC/POS command bytes
      const ESC = 0x1b;
      const GS = 0x1d;

      const encode = (text: string) => new TextEncoder().encode(text);
      const newline = () => encode('\n');
      const sendCommand = async (data: Uint8Array) => {
        await writer.write(data);
        await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay for printer
      };

      // Initialize printer
      await sendCommand(new Uint8Array([ESC, 0x40]));

      // Set alignment to center
      await sendCommand(new Uint8Array([ESC, 0x61, 0x01]));

      // Print store header with formatting
      const paperWidth = this.printerConfig.paperWidth === 58 ? 32 : 48;

      if (store) {
        // Store name (bold, centered)
        await sendCommand(new Uint8Array([ESC, 0x45, 0x01])); // Bold on
        await sendCommand(
          encode(
            this.formatThermalLine(store.name, paperWidth, 'center'),
          ),
        );
        await sendCommand(newline());
        await sendCommand(new Uint8Array([ESC, 0x45, 0x00])); // Bold off

        // Store address and contact (centered)
        await sendCommand(
          encode(
            this.formatThermalLine(
              store.settings.contact.address,
              paperWidth,
              'center',
            ),
          ),
        );
        await sendCommand(newline());
        await sendCommand(
          encode(
            this.formatThermalLine(
              store.settings.contact.phone,
              paperWidth,
              'center',
            ),
          ),
        );
        if (store.settings.contact.email) {
          await sendCommand(newline());
          await sendCommand(
            encode(
              this.formatThermalLine(
                store.settings.contact.email,
                paperWidth,
                'center',
              ),
            ),
          );
        }
        await sendCommand(newline());

        // Receipt header if configured
        if (store.posSettings?.receiptSettings?.headerText) {
          await sendCommand(newline());
          await sendCommand(
            encode(
              this.formatThermalLine(
                store.posSettings.receiptSettings.headerText,
                paperWidth,
                'center',
              ),
            ),
          );
          await sendCommand(newline());
        }
      }

      // Divider
      await sendCommand(encode('-'.repeat(paperWidth)));
      await sendCommand(newline());

      // Set alignment to left
      await sendCommand(new Uint8Array([ESC, 0x61, 0x00]));

      // Receipt element text extraction (simplified)
      // In a real scenario, you would parse the receipt element more thoroughly
      const receiptText = receiptElement.innerText;
      const lines = receiptText.split('\n').slice(0, 30); // Limit lines for thermal printer

      for (const line of lines) {
        if (line.trim()) {
          await sendCommand(encode(line.substring(0, paperWidth)));
          await sendCommand(newline());
        }
      }

      // Receipt footer if configured
      if (store?.posSettings?.receiptSettings?.footerText) {
        await sendCommand(newline());
        await sendCommand(new Uint8Array([ESC, 0x61, 0x01])); // Center
        await sendCommand(
          encode(
            this.formatThermalLine(
              store.posSettings.receiptSettings.footerText,
              paperWidth,
              'center',
            ),
          ),
        );
        await sendCommand(newline());
        await sendCommand(new Uint8Array([ESC, 0x61, 0x00])); // Left align
      }

      await sendCommand(newline());

      // Paper cut if enabled
      if (this.printerConfig.autocut) {
        await sendCommand(new Uint8Array([GS, 0x56, 0x00])); // Partial cut
      }

      // Keep drawer kick if needed
      // await sendCommand(new Uint8Array([ESC, 0x70, 0x00, 0x3C, 0xFF])); // Uncomment if drawer kick is available

      writer.releaseLock();
    } catch (error) {
      console.error('Failed to print to thermal printer:', error);
      throw error;
    }
  }

  /**
   * Generate HTML receipt for display/printing
   * Supports full Order type with returns, discounts, and payment details
   */
  generateReceiptHTML(order: Order | ReceiptOrder, store: Store): string {
    // Cast order to ReceiptOrder for extended properties access
    const receiptOrder = order as ReceiptOrder;

    const config = {
      storeName: store.name,
      storeAddress: store.settings.contact.address,
      storePhone: store.settings.contact.phone,
      storeEmail: store.settings.contact.email,
      receiptHeader: store.posSettings?.receiptSettings?.headerText || '',
      receiptFooter: store.posSettings?.receiptSettings?.footerText || '',
      currency: store.currency || 'USD',
      showLogo: store.posSettings?.receiptSettings?.showLogo || false,
    };

    // Get customer info
    const customer =
      order.customerId && typeof order.customerId === 'object'
        ? (order.customerId as Customer)
        : null;

    // Calculate returns summary
    const returnsTotal =
      order.returns?.reduce((sum, r) => sum + (r.totalRefundAmount || 0), 0) ||
      0;
    const hasReturns = order.returns && order.returns.length > 0;

    // Calculate item-level discounts from items
    const itemDiscountsTotal = order.items.reduce((sum, item) => {
      const extItem = item as ReceiptOrderItem;
      return sum + ((extItem.discountAmount || 0) * item.quantity);
    }, 0);

    // Check order status
    const isCancelled = order.status === 'cancelled';
    const isRefunded = order.status === 'refunded';
    const isReturned =
      order.status === 'returned' || order.status === 'partially_returned';

    // Get payment details (only available in extended ReceiptOrder)
    const posPayment = receiptOrder.posPaymentDetails;
    const cashDetails = posPayment?.cashDetails;
    const cardDetails = posPayment?.cardDetails;
    const qrDetails = posPayment?.qrDetails;

    // Build items HTML with discount and return info
    const itemsHTML = order.items
      .map((item, index) => {
        const extItem = item as ReceiptOrderItem;
        const hasDiscount = (extItem.discountAmount || 0) > 0;
        const hasReturn = extItem.returnedQuantity && extItem.returnedQuantity > 0;
        const effectiveQty = item.quantity - (extItem.returnedQuantity || 0);
        const itemSubtotal = item.price * effectiveQty;

        return `
          <tr class="item-row">
            <td style="width: 5%; color: #9ca3af; font-size: 9px;">${index + 1}</td>
            <td style="width: 50%;">
              <div class="item-name">${item.name}</div>
              ${extItem.hsnCode ? `<div class="item-detail">HSN: ${extItem.hsnCode}</div>` : ''}
              ${item.attributes ? `<div class="item-detail">${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>` : ''}
              ${hasDiscount ? `<div class="item-detail" style="color: #059669;">Discount: -${config.currency} ${(extItem.discountAmount || 0).toFixed(2)}/unit</div>` : ''}
              ${hasReturn ? `<div class="item-detail" style="color: #dc2626;">Returned: ${extItem.returnedQuantity}</div>` : ''}
            </td>
            <td style="width: 15%; text-align: center; color: #4b5563;">
                 ${hasReturn ? `<span style="text-decoration: line-through; color: #9ca3af;">${item.quantity}</span> ${effectiveQty}` : item.quantity}
            </td>
            <td style="width: 15%; text-align: right;">
              ${hasDiscount ? `<div style="text-decoration: line-through; color: #9ca3af; font-size: 9px;">${(extItem.originalPrice || item.price).toFixed(2)}</div>` : ''}
              <div style="color: #4b5563;">${item.price.toFixed(2)}</div>
            </td>
            <td style="width: 15%; text-align: right; font-weight: 600; color: #111827;">${itemSubtotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    // Build returns section if there are returns
    const returnsHTML =
      hasReturns
        ? `
        <div class="divider"></div>
        <div class="receipt-section">
          <div style="font-weight: 700; font-size: 11px; margin-bottom: 8px; color: #dc2626; text-transform: uppercase;">
            Returns & Refunds
          </div>
          ${order.returns
          ?.map(
            (ret) => `
            <div style="font-size: 10px; margin-bottom: 8px; padding: 8px; background: #fef2f2; border-radius: 6px; border: 1px solid #fee2e2;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <strong>${ret.returnedAt ? new Date(ret.returnedAt).toLocaleDateString() : 'N/A'}</strong>
                <span style="background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 9px;">${ret.refundMethod || 'N/A'}</span>
              </div>
              ${ret.items
                .map(
                  (ri) => `
                <div style="margin-top: 4px; padding-left: 8px; border-left: 2px solid #fca5a5;">
                  <div style="display: flex; justify-content: space-between;">
                     <span>${ri.quantity}x returned</span>
                     <span>${config.currency} ${(ri.refundAmount || 0).toFixed(2)}</span>
                  </div>
                  ${ri.reason ? `<div style="font-size: 9px; color: #7f1d1d;">${ri.reason}</div>` : ''}
                </div>
              `,
                )
                .join('')}
              <div style="font-weight: 600; margin-top: 6px; text-align: right; color: #dc2626;">
                Refund Total: ${config.currency} ${(ret.totalRefundAmount || 0).toFixed(2)}
              </div>
            </div>
          `,
          )
          .join('')}
        </div>
      `
        : '';

    // Build status banner for cancelled/refunded orders
    const statusBannerHTML =
      isCancelled || isRefunded
        ? `
        <div class="status-badge" style="background: ${isCancelled ? '#fef2f2' : '#fef9c3'}; color: ${isCancelled ? '#991b1b' : '#854d0e'};">
          ${isCancelled ? 'Order Cancelled' : 'Order Refunded'}
        </div>
      `
        : isReturned
          ? `
        <div class="status-badge" style="background: #fff7ed; color: #9a3412;">
            ${order.status === 'partially_returned' ? 'Partially Returned' : 'Order Returned'}
        </div>
      `
          : '';

    // Build payment details section
    const paymentDetailsHTML = `
      <div class="receipt-section" style="text-align: center; margin-top: 16px;">
        <span class="payment-badge">
            ${order.paymentMethod}
            ${cardDetails?.cardNetwork ? ` • ${cardDetails.cardNetwork}` : ''}
            ${cardDetails?.cardLast4 ? ` • ${cardDetails.cardLast4}` : ''}
            ${qrDetails?.paymentType ? ` • ${qrDetails.paymentType}` : ''}
        </span>
        
        ${cashDetails
        ? `
          <div style="margin-top: 8px; font-size: 10px; color: #4b5563;">
            <span style="margin-right: 8px;">Received: <strong>${config.currency} ${cashDetails.amountReceived.toFixed(2)}</strong></span>
            ${cashDetails.changeGiven > 0 ? `<span>Change: <strong>${config.currency} ${cashDetails.changeGiven.toFixed(2)}</strong></span>` : ''}
          </div>
        `
        : order.cashReceived
          ? `
          <div style="margin-top: 8px; font-size: 10px; color: #4b5563;">
            <span style="margin-right: 8px;">Received: <strong>${config.currency} ${order.cashReceived.toFixed(2)}</strong></span>
            ${order.change ? `<span>Change: <strong>${config.currency} ${order.change.toFixed(2)}</strong></span>` : ''}
          </div>
        `
          : ''
      }
      </div>
    `;

    return `
      <div class="receipt-container">        
        <div class="receipt-header">
          ${config.showLogo ? `<img src="${store.logo || '/logo.png'}" alt="Logo" class="store-logo" onerror="this.style.display='none'" />` : ''}
          <div class="store-name">${config.storeName}</div>
          <div class="store-details">
            <div>${config.storeAddress}</div>
            <div>${config.storePhone}</div>
            ${config.storeEmail ? `<div>${config.storeEmail}</div>` : ''}
          </div>
        </div>

        ${config.receiptHeader
        ? `
          <div class="divider"></div>
          <div class="text-center footer-text mb-2">${config.receiptHeader}</div>
        `
        : ''
      }
        
        <div class="divider-solid"></div>
        
        ${statusBannerHTML}
        
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Order No</span>
                <span class="info-value">#${order.orderNumber}</span>
            </div>
            <div class="info-item" style="text-align: right;">
              <span class="info-label">Date</span>
              <span class="info-value">${(() => {
        const dateValue = order.date || order.createdAt;
        return dateValue && !isNaN(new Date(dateValue).getTime())
          ? (new Date(dateValue).toLocaleDateString() + ' ' + new Date(dateValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }))
          : 'N/A';
      })()}</span>
            </div>
             ${customer ? `
            <div class="info-item">
                 <span class="info-label">Customer</span>
                 <span class="info-value">${customer.firstName} ${customer.lastName}</span>
            </div>
             ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 50%;">Item</th>
              <th style="width: 15%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Price</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

         <div class="divider-solid"></div>

        <div class="totals-section">
          <div class="total-row">
            <span style="color: #6b7280;">Subtotal</span>
            <span style="font-weight: 600;">${config.currency} ${order.subtotal.toFixed(2)}</span>
          </div>
          
          ${order.discount && order.discount > 0
        ? `
            <div class="total-row" style="color: #059669;">
              <span>Discount ${order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span>-${config.currency} ${order.discount.toFixed(2)}</span>
            </div>
          `
        : ''
      }
          
          ${itemDiscountsTotal > 0
        ? `
            <div class="total-row" style="color: #059669;">
              <span>Item Discounts</span>
              <span>-${config.currency} ${itemDiscountsTotal.toFixed(2)}</span>
            </div>
          `
        : ''
      }
          
          <div class="total-row">
             <span style="color: #6b7280;">Tax</span>
             <span style="font-weight: 600;">${config.currency} ${order.tax.toFixed(2)}</span>
          </div>
          
          ${receiptOrder.roundOffAmount && receiptOrder.roundOffAmount !== 0
        ? `
            <div class="total-row" style="color: #6b7280;">
              <span>Round Off</span>
              <span>${receiptOrder.roundOffAmount > 0 ? '+' : ''}${config.currency} ${receiptOrder.roundOffAmount.toFixed(2)}</span>
            </div>
          `
        : ''
      }
          
          <div class="total-row grand-total">
            <span>TOTAL AMOUNT</span>
            <span>${config.currency} ${order.total.toFixed(2)}</span>
          </div>
          
          ${returnsTotal > 0
        ? `
            <div class="total-row" style="color: #dc2626; font-weight: 600; margin-top: 4px;">
              <span>Total Refunded</span>
              <span>-${config.currency} ${returnsTotal.toFixed(2)}</span>
            </div>
            <div class="total-row" style="font-weight: 700; border-top: 1px dashed #e5e7eb; padding-top: 6px; margin-top: 4px;">
              <span>NET PAYABLE</span>
              <span>${config.currency} ${(order.total - returnsTotal).toFixed(2)}</span>
            </div>
          `
        : ''
      }
        </div>

        ${returnsHTML}

        ${paymentDetailsHTML}

        <div class="text-center" style="margin-top: 24px; font-size: 9px; color: #9ca3af;">
             All prices include taxes where applicable
        </div>
        
        ${config.receiptFooter
        ? `
          <div class="divider"></div>
          <div class="text-center footer-text">${config.receiptFooter}</div>
        `
        : ''
      }
        
        <div style="text-align: center; margin-top: 12px; font-size: 10px; font-weight: 500; color: #111827;">
          Thank you for shopping with us!
        </div>
      </div>
    `;
  }
}

export const printService = new PrintService();
