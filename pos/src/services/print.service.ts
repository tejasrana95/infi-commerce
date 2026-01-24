import { ReceiptData } from '@/types/receipt';

// Basic Web Serial API type definitions
interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    writable: WritableStream<Uint8Array>;
    close(): Promise<void>;
}

class PrintService {
    /**
     * Print receipt using browser print dialog
     */
    async printReceipt(receiptElement: HTMLElement): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // Create a new window for printing
                const printWindow = window.open('', '_blank', 'width=800,height=600');

                if (!printWindow) {
                    throw new Error('Failed to open print window. Please allow popups.');
                }

                // Get computed styles
                const styles = this.getReceiptStyles();

                // Write content to print window
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                        <head>
                            <title>Receipt</title>
                            <style>
                                ${styles}
                                
                                @media print {
                                    @page {
                                        size: 80mm auto;
                                        margin: 0;
                                    }
                                    
                                    body {
                                        margin: 0;
                                        padding: 0;
                                    }
                                    
                                    .receipt-container {
                                        width: 80mm !important;
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

                // Wait for content to load then print
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();

                        // Close window after printing (or if cancelled)
                        setTimeout(() => {
                            printWindow.close();
                            resolve();
                        }, 100);
                    }, 250);
                };

                // Handle errors
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
    async autoPrint(receiptElement: HTMLElement, enabled: boolean): Promise<void> {
        if (enabled) {
            await this.printReceipt(receiptElement);
        }
    }

    /**
     * Get CSS styles for receipt
     */
    private getReceiptStyles(): string {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .receipt-container {
                background: white;
                width: 80mm;
                padding: 10mm;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
            }
            
            th, td {
                padding: 2px;
            }
            
            .border-t {
                border-top: 1px solid #000;
            }
            
            .border-b {
                border-bottom: 1px solid #000;
            }
            
            .border-dashed {
                border-style: dashed;
            }
            
            .border-dotted {
                border-style: dotted;
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
                font-size: 10px;
            }
            
            .text-base {
                font-size: 12px;
            }
            
            .text-xl {
                font-size: 18px;
            }
            
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-4 { margin-bottom: 16px; }
            
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 16px; }
            
            .pt-2 { padding-top: 8px; }
            .pt-3 { padding-top: 12px; }
            
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-2 { padding-top: 8px; padding-bottom: 8px; }
        `;
    }

    /**
     * Check if Web Serial API is supported (for ESC/POS thermal printers)
     */
    isWebSerialSupported(): boolean {
        return 'serial' in navigator;
    }

    /**
     * Connect to thermal printer via Web Serial API
     * This is for advanced thermal printer integration
     */
    async connectThermalPrinter(): Promise<SerialPort | null> {
        if (!this.isWebSerialSupported()) {
            console.warn('Web Serial API not supported');
            return null;
        }

        try {
            // Request port from user
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 });
            return port;
        } catch (error) {
            console.error('Failed to connect to thermal printer:', error);
            return null;
        }
    }

    /**
     * Send ESC/POS commands to thermal printer
     * This is a basic implementation - can be enhanced with full ESC/POS command set
     */
    async printToThermalPrinter(port: SerialPort, data: ReceiptData): Promise<void> {
        try {
            const writer = port.writable?.getWriter();
            if (!writer) {
                throw new Error('Cannot write to printer');
            }

            // ESC/POS commands
            const ESC = 0x1B;
            const GS = 0x1D;

            // Initialize printer
            await writer.write(new Uint8Array([ESC, 0x40]));

            // Set alignment to center
            await writer.write(new Uint8Array([ESC, 0x61, 0x01]));

            // Print store name (bold)
            await writer.write(new Uint8Array([ESC, 0x45, 0x01])); // Bold on
            await writer.write(new TextEncoder().encode(data.storeName + '\n'));
            await writer.write(new Uint8Array([ESC, 0x45, 0x00])); // Bold off

            // Print store details
            await writer.write(new TextEncoder().encode(data.storeAddress + '\n'));
            await writer.write(new TextEncoder().encode(data.storePhone + '\n\n'));

            // Set alignment to left
            await writer.write(new Uint8Array([ESC, 0x61, 0x00]));

            // Print order number and date
            await writer.write(new TextEncoder().encode(`Order #: ${data.orderNumber}\n`));
            await writer.write(new TextEncoder().encode(`Date: ${data.date}\n`));
            await writer.write(new TextEncoder().encode('--------------------------------\n'));

            // Print items
            for (const item of data.items) {
                await writer.write(new TextEncoder().encode(`${item.name}\n`));
                await writer.write(new TextEncoder().encode(
                    `  ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}\n`
                ));
            }

            await writer.write(new TextEncoder().encode('--------------------------------\n'));

            // Print totals
            await writer.write(new TextEncoder().encode(`Subtotal: $${data.subtotal.toFixed(2)}\n`));
            await writer.write(new TextEncoder().encode(`Tax: $${data.tax.toFixed(2)}\n`));
            await writer.write(new TextEncoder().encode(`TOTAL: $${data.total.toFixed(2)}\n\n`));

            // Print payment method
            await writer.write(new TextEncoder().encode(`Payment: ${data.paymentMethod.toUpperCase()}\n`));

            // Cut paper
            await writer.write(new Uint8Array([GS, 0x56, 0x00]));

            writer.releaseLock();
        } catch (error) {
            console.error('Failed to print to thermal printer:', error);
            throw error;
        }
    }
}

export const printService = new PrintService();
