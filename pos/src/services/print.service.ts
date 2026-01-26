import { Store } from '@/contexts/StoreContext';
import { Order, Customer, Return } from '@/types';

// Extended item type with additional fields from backend
interface ReceiptOrderItem {
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
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
    method: 'cash' | 'card' | 'qr';
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
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', 'monospace';
                font-size: 12px;
                line-height: 1.4;
                background: white;
            }
            
            .receipt-container {
                background: white;
                width: ${paperWidth}mm;
                padding: 5mm 8mm;
            }
            
            .receipt-header {
                text-align: center;
                margin-bottom: 8px;
            }
            
            .store-logo {
                width: 100%;
                max-width: 60px;
                margin: 0 auto 4px;
                display: block;
            }
            
            .store-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .store-details {
                font-size: 10px;
                line-height: 1.3;
                margin-bottom: 4px;
            }
            
            .receipt-section {
                margin-bottom: 8px;
            }
            
            .divider {
                border-bottom: 1px dashed #000;
                margin: 6px 0;
            }
            
            .divider-solid {
                border-bottom: 1px solid #000;
                margin: 6px 0;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }
            
            th, td {
                padding: 2px 0;
                text-align: left;
            }
            
            th {
                font-weight: bold;
                border-bottom: 1px dashed #000;
                padding-bottom: 2px;
            }
            
            .item-row td {
                padding: 2px 0;
            }
            
            .item-name {
                width: 50%;
            }
            
            .item-qty {
                width: 15%;
                text-align: center;
            }
            
            .item-price {
                width: 17.5%;
                text-align: right;
            }
            
            .item-total {
                width: 17.5%;
                text-align: right;
            }
            
            .totals-section {
                font-size: 11px;
                margin-top: 6px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 2px 0;
            }
            
            .total-row.grand-total {
                font-weight: bold;
                font-size: 13px;
                border-top: 1px dashed #000;
                padding-top: 4px;
                margin-top: 4px;
            }
            
            .text-center {
                text-align: center;
            }
            
            .text-left {
                text-align: left;
            }
            
            .text-right {
                text-align: right;
            }
            
            .font-bold {
                font-weight: bold;
            }
            
            .font-semibold {
                font-weight: 600;
            }
            
            .text-xs {
                font-size: 9px;
            }
            
            .text-sm {
                font-size: 10px;
            }
            
            .text-base {
                font-size: 11px;
            }
            
            .text-lg {
                font-size: 12px;
            }
            
            .text-xl {
                font-size: 14px;
            }
            
            .mb-0 { margin-bottom: 0; }
            .mb-1 { margin-bottom: 3px; }
            .mb-2 { margin-bottom: 6px; }
            .mb-3 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 10px; }
            
            .mt-1 { margin-top: 3px; }
            .mt-2 { margin-top: 6px; }
            .mt-4 { margin-top: 10px; }
            
            .pt-1 { padding-top: 3px; }
            .pt-2 { padding-top: 6px; }
            .pt-3 { padding-top: 8px; }
            
            .py-1 { padding-top: 2px; padding-bottom: 2px; }
            .py-2 { padding-top: 4px; padding-bottom: 4px; }
            
            .footer-text {
                font-size: 9px;
                line-height: 1.3;
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

      console.log('Successfully printed to thermal printer');
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
      .map((item) => {
        const extItem = item as ReceiptOrderItem;
        const hasDiscount = (extItem.discountAmount || 0) > 0;
        const hasReturn = extItem.returnedQuantity && extItem.returnedQuantity > 0;
        const effectiveQty = item.quantity - (extItem.returnedQuantity || 0);

        return `
          <tr class="item-row">
            <td class="item-name">
              ${item.name}
              ${item.attributes ? `<br><small style="color:#666;">${Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</small>` : ''}
              ${hasDiscount ? `<br><small style="color:#22c55e;">Discount: -${config.currency} ${(extItem.discountAmount || 0).toFixed(2)}/unit</small>` : ''}
              ${hasReturn ? `<br><small style="color:#ef4444;">Returned: ${extItem.returnedQuantity} × ${config.currency} ${(extItem.refundedAmount || 0).toFixed(2)}</small>` : ''}
            </td>
            <td class="item-qty">${hasReturn ? `<s>${item.quantity}</s> ${effectiveQty}` : item.quantity}</td>
            <td class="item-price">
              ${hasDiscount ? `<s>${(extItem.originalPrice || item.price).toFixed(2)}</s><br>` : ''}
              ${item.price.toFixed(2)}
            </td>
            <td class="item-total">${(item.price * effectiveQty).toFixed(2)}</td>
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
          <div style="font-weight: bold; font-size: 11px; margin-bottom: 4px; color: #ef4444;">
            RETURNS / REFUNDS
          </div>
          ${order.returns
            ?.map(
              (ret) => `
            <div style="font-size: 10px; margin-bottom: 6px; padding: 4px; background: #fef2f2; border-radius: 4px;">
              <div><strong>Date:</strong> ${ret.returnedAt ? new Date(ret.returnedAt).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Method:</strong> ${ret.refundMethod || 'N/A'}</div>
              ${ret.items
                .map(
                  (ri) => `
                <div style="margin-left: 8px;">
                  • Qty: ${ri.quantity || 0} - Refund: ${config.currency} ${(ri.refundAmount || 0).toFixed(2)}
                  ${ri.reason ? `<br><small style="color:#666;">Reason: ${ri.reason}</small>` : ''}
                </div>
              `,
                )
                .join('')}
              <div style="font-weight: bold; margin-top: 4px;">
                Total Refund: ${config.currency} ${(ret.totalRefundAmount || 0).toFixed(2)}
              </div>
              ${ret.notes ? `<div style="font-style: italic; color: #666;">Note: ${ret.notes}</div>` : ''}
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
        <div style="background: ${isCancelled ? '#fef2f2' : '#fef9c3'}; color: ${isCancelled ? '#dc2626' : '#ca8a04'}; 
             padding: 8px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 8px; border-radius: 4px;">
          ${isCancelled ? 'ORDER CANCELLED' : 'ORDER REFUNDED'}
        </div>
      `
        : isReturned
          ? `
        <div style="background: #fff7ed; color: #ea580c; 
             padding: 8px; text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 8px; border-radius: 4px;">
            ${order.status === 'partially_returned' ? 'PARTIALLY RETURNED' : 'ORDER RETURNED'}
        </div>
      `
          : '';

    // Build payment details section
    const paymentDetailsHTML = `
      <div class="receipt-section text-center">
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 3px;">
          Payment: ${order.paymentMethod.toUpperCase()}
          ${cardDetails?.cardNetwork ? `(${cardDetails.cardNetwork})` : ''}
          ${cardDetails?.cardLast4 ? `****${cardDetails.cardLast4}` : ''}
          ${qrDetails?.paymentType ? `(${qrDetails.paymentType})` : ''}
        </div>
        ${
          cashDetails
            ? `
          <div style="font-size: 10px;">
            <div>Amount Received: ${config.currency} ${cashDetails.amountReceived.toFixed(2)}</div>
            ${cashDetails.changeGiven > 0 ? `<div>Change Given: ${config.currency} ${cashDetails.changeGiven.toFixed(2)}</div>` : ''}
          </div>
        `
            : order.cashReceived
              ? `
          <div style="font-size: 10px;">
            <div>Amount Received: ${config.currency} ${order.cashReceived.toFixed(2)}</div>
            ${order.change ? `<div>Change: ${config.currency} ${order.change.toFixed(2)}</div>` : ''}
          </div>
        `
              : ''
        }
      </div>
    `;

    return `
      <div class="receipt-container">        
        <div class="receipt-header">
          ${config.showLogo ? `<img src="${store.logo || '/logo.png'}" alt="Logo" onerror="this.style.display='none'" style="max-width: 80px; max-height: 80px; margin: 0 auto 8px; display: block;" />` : ''}
          <div class="store-name">${config.storeName}</div>
          <div class="store-details">
            <div>${config.storeAddress}</div>
            <div>${config.storePhone}</div>
            ${config.storeEmail ? `<div>${config.storeEmail}</div>` : ''}
          </div>
        </div>

        ${
          config.receiptHeader
            ? `
          <div class="divider"></div>
          <div class="text-center footer-text mb-2">${config.receiptHeader}</div>
        `
            : ''
        }
        
        <div class="divider"></div>
        
        <div class="receipt-section">
          <div style="display: flex; flex-direction: column; font-size: 10px;">
            <div><strong>Order #:</strong> ${order.orderNumber}</div>
            <div><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</div>
            <div><strong>Status:</strong> <span style="text-transform: capitalize;">${order.status.replace('_', ' ')}</span></div>
            ${
              customer
                ? `
              <div style="margin-top: 4px;">
                <strong>Customer:</strong> ${customer.firstName} ${customer.lastName}
              </div>
            `
                : ''
            }
          </div>
        </div>
        ${statusBannerHTML}
        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-qty">Qty</th>
              <th class="item-price">Price</th>
              <th class="item-total">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="divider-solid"></div>

        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${config.currency} ${order.subtotal.toFixed(2)}</span>
          </div>
          
          ${
            order.discount && order.discount > 0
              ? `
            <div class="total-row" style="color: #22c55e;">
              <span>Discount${order.couponCode ? ` (${order.couponCode})` : ''}:</span>
              <span>-${config.currency} ${order.discount.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          
          ${
            itemDiscountsTotal > 0
              ? `
            <div class="total-row" style="color: #22c55e;">
              <span>Item Discounts:</span>
              <span>-${config.currency} ${itemDiscountsTotal.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          
          <div class="total-row">
            <span>Tax:</span>
            <span>${config.currency} ${order.tax.toFixed(2)}</span>
          </div>
          
          ${
            receiptOrder.roundOffAmount && receiptOrder.roundOffAmount !== 0
              ? `
            <div class="total-row">
              <span>Round Off:</span>
              <span>${receiptOrder.roundOffAmount > 0 ? '+' : ''}${config.currency} ${receiptOrder.roundOffAmount.toFixed(2)}</span>
            </div>
          `
              : ''
          }
          
          <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${config.currency} ${order.total.toFixed(2)}</span>
          </div>
          
          ${
            returnsTotal > 0
              ? `
            <div class="total-row" style="color: #ef4444; font-weight: bold;">
              <span>Total Refunded:</span>
              <span>-${config.currency} ${returnsTotal.toFixed(2)}</span>
            </div>
            <div class="total-row" style="font-weight: bold; border-top: 1px dashed #ccc; padding-top: 4px;">
              <span>NET AMOUNT:</span>
              <span>${config.currency} ${(order.total - returnsTotal).toFixed(2)}</span>
            </div>
          `
              : ''
          }
        </div>

        ${returnsHTML}

        <div class="divider"></div>

        ${paymentDetailsHTML}
        
        <div class="divider"></div>

        <div class="receipt-section text-center" style="font-size: 9px; color: #666;">
          All prices are in ${config.currency}
        </div>
        
        ${
          config.receiptFooter
            ? `
          <div class="divider"></div>
          <div class="text-center footer-text">${config.receiptFooter}</div>
        `
            : ''
        }
        
        <div style="text-align: center; margin-top: 8px; font-size: 8px; color: #999;">
          Thank you for your business!
        </div>
      </div>
    `;
  }
}

export const printService = new PrintService();
