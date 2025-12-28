import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { IOrder } from '../models/Order';
import { storageService } from './storage';

import { formatPrice } from '../utils/currency';

// Helper to format currency
handlebars.registerHelper('formatPrice', (amount: number, currency: string, exchangeRate: number) => {
    // If exchangeRate is an object (Handlebars options), default to 1
    const rate = typeof exchangeRate === 'number' ? exchangeRate : 1;
    return formatPrice(amount, { code: currency, exchangeRate: rate });
});

handlebars.registerHelper('formatDate', (date: Date) => {
    return new Date(date).toLocaleDateString();
});

handlebars.registerHelper('multiply', (a: number, b: number) => {
    return a * b;
});

handlebars.registerHelper('eq', (a: any, b: any) => {
    return a === b;
});

handlebars.registerHelper('divide', (a: number, b: number) => {
    return a / b;
});

export class PdfService {
    private static async compileTemplate(templateName: string, data: any): Promise<string> {
        const filePath = path.join(__dirname, '../templates/pdfs', `${templateName}.hbs`);
        const html = await fs.promises.readFile(filePath, 'utf-8');
        const template = handlebars.compile(html);
        return template(data);
    }

    // Invoice folder path for storage provider
    private static readonly INVOICE_FOLDER = '/invoices';

    // Ensure invoice folder exists using storage provider
    private static async ensureInvoiceFolder() {
        const provider = storageService.getStorageProvider();
        const folderExists = await provider.exists(this.INVOICE_FOLDER);
        if (!folderExists) {
            await provider.createFolder(this.INVOICE_FOLDER);
        }
    }

    static async generateInvoice(order: IOrder): Promise<Buffer> {
        try {
            await this.ensureInvoiceFolder();
            const provider = storageService.getStorageProvider();
            const invoicePath = `${this.INVOICE_FOLDER}/invoice-${order._id}.pdf`;

            // Check if cached file exists
            const fileExists = await provider.exists(invoicePath);
            if (fileExists) {
                // For simplicity, we regenerate if order was updated
                // Since storage providers don't expose mtime, we'll always regenerate
                // to ensure the latest order data is reflected
                // This is a trade-off for unified storage support
            }

            const htmlContent = await this.compileTemplate('invoice', { order: order.toObject() });

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            await browser.close();

            // Save to storage using the storage provider
            const pdfBuffer = Buffer.from(pdf);
            await provider.upload(pdfBuffer, invoicePath, 'application/pdf', `invoice-${order._id}.pdf`);

            return pdfBuffer;
        } catch (error) {
            console.error('Error generating Invoice PDF:', error);
            throw new Error('Failed to generate Invoice PDF');
        }
    }

    static async generatePackingSlip(order: IOrder): Promise<Buffer> {
        try {
            await this.ensureInvoiceFolder();
            const provider = storageService.getStorageProvider();
            const packingSlipPath = `${this.INVOICE_FOLDER}/packing-slip-${order._id}.pdf`;

            // Check if cached file exists (same trade-off as generateInvoice)
            const fileExists = await provider.exists(packingSlipPath);
            if (fileExists) {
                // Regenerate for latest data
            }

            const htmlContent = await this.compileTemplate('packing-slip', { order: order.toObject() });

            const browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });

            await browser.close();

            // Save to storage using the storage provider
            const pdfBuffer = Buffer.from(pdf);
            await provider.upload(pdfBuffer, packingSlipPath, 'application/pdf', `packing-slip-${order._id}.pdf`);

            return pdfBuffer;
        } catch (error) {
            console.error('Error generating Packing Slip PDF:', error);
            throw new Error('Failed to generate Packing Slip PDF');
        }
    }
}
