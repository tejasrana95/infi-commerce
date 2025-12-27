import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { IOrder } from '../models/Order';
// import { formatPrice } from '../utils/currency'; // Removed as unused and possibly missing

// Helper to format currency if not available
handlebars.registerHelper('formatPrice', (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        minimumFractionDigits: 2
    }).format(amount);
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

    private static readonly INVOICE_DIR = path.join(__dirname, '../../storage/invoices');

    // Ensure directory exists
    private static async ensureDir() {
        if (!fs.existsSync(this.INVOICE_DIR)) {
            await fs.promises.mkdir(this.INVOICE_DIR, { recursive: true });
        }
    }

    static async generateInvoice(order: IOrder): Promise<Buffer> {
        try {
            await this.ensureDir();
            const filePath = path.join(this.INVOICE_DIR, `invoice-${order._id}.pdf`);

            // Check if file exists and is fresh
            if (fs.existsSync(filePath)) {
                const stats = await fs.promises.stat(filePath);
                const orderUpdated = new Date(order.updatedAt).getTime();
                const fileUpdated = stats.mtime.getTime();

                // If order hasn't been updated since file creation, return cached file
                // Adding a small buffer (1s) to avoid race conditions where they are equal
                if (fileUpdated > orderUpdated) {
                    return await fs.promises.readFile(filePath);
                }
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

            // Save to cache
            await fs.promises.writeFile(filePath, pdf);

            return Buffer.from(pdf);
        } catch (error) {
            console.error('Error generating Invoice PDF:', error);
            throw new Error('Failed to generate Invoice PDF');
        }
    }

    static async generatePackingSlip(order: IOrder): Promise<Buffer> {
        try {
            await this.ensureDir();
            const filePath = path.join(this.INVOICE_DIR, `packing-slip-${order._id}.pdf`);

            // Check if file exists and is fresh
            if (fs.existsSync(filePath)) {
                const stats = await fs.promises.stat(filePath);
                const orderUpdated = new Date(order.updatedAt).getTime();
                const fileUpdated = stats.mtime.getTime();

                // If order hasn't been updated since file creation, return cached file
                if (fileUpdated > orderUpdated) {
                    return await fs.promises.readFile(filePath);
                }
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

            // Save to cache
            await fs.promises.writeFile(filePath, pdf);

            return Buffer.from(pdf);
        } catch (error) {
            console.error('Error generating Packing Slip PDF:', error);
            throw new Error('Failed to generate Packing Slip PDF');
        }
    }
}
