import ExcelJS from 'exceljs';
import Product from '../models/Product';
import Order from '../models/Order';
import Customer from '../models/Customer';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Coupon from '../models/Coupon';
import Review from '../models/Review';
import { objectToExcelRow, createWorksheet, generateExportFilename } from '../utils/excel-formatter';

export interface ExportFilters {
    storeId?: string;
    categoryId?: string;
}

class BackupService {
    /**
     * Export products to Excel
     */
    async exportProducts(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        if (filters.categoryId) {
            query.categoryIds = filters.categoryId;
        }

        const products = await Product.find(query)
            .populate('storeId', 'name')
            .populate('categoryIds', 'title')
            .populate('brand', 'name')
            .lean();

        // Transform data for Excel
        const excelData = products.map(product => objectToExcelRow(product));

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Products', excelData);

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export orders to Excel
     */
    async exportOrders(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const orders = await Order.find(query)
            .populate('storeId', 'name')
            .populate('customerId', 'email firstName lastName')
            .lean();

        const excelData = orders.map(order => objectToExcelRow(order));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Orders', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export customers to Excel
     */
    async exportCustomers(_filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        // Note: Customers are not store-specific in the current model
        // If you need store filtering, you'd need to add storeId to Customer model

        const customers = await Customer.find(query).lean();

        // Remove sensitive data
        const sanitizedData = customers.map(customer => {
            const { password, twoFactorSecret, twoFactorBackupCodes, passwordResetToken, emailVerificationToken, ...safe } = customer as any;
            return objectToExcelRow(safe);
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Customers', sanitizedData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export categories to Excel
     */
    async exportCategories(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const categories = await Category.find(query)
            .populate('storeId', 'name')
            .populate('parentCategory', 'title')
            .lean();

        const excelData = categories.map(category => objectToExcelRow(category));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Categories', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export brands to Excel
     */
    async exportBrands(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const brands = await Brand.find(query)
            .populate('storeId', 'name')
            .lean();

        const excelData = brands.map(brand => objectToExcelRow(brand));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Brands', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export coupons to Excel
     */
    async exportCoupons(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const coupons = await Coupon.find(query)
            .populate('storeId', 'name')
            .populate('categoryIds', 'title')
            .lean();

        const excelData = coupons.map(coupon => objectToExcelRow(coupon));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Coupons', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Export reviews to Excel
     */
    async exportReviews(filters: ExportFilters = {}): Promise<Buffer> {
        const query: any = {};

        if (filters.storeId) {
            query.storeId = filters.storeId;
        }

        const reviews = await Review.find(query)
            .populate('storeId', 'name')
            .populate('productId', 'title')
            .populate('customerId', 'email firstName lastName')
            .lean();

        const excelData = reviews.map(review => objectToExcelRow(review));

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'InfiCommerce Admin';
        workbook.created = new Date();

        createWorksheet(workbook, 'Reviews', excelData);

        const buffer = await workbook.xlsx.writeBuffer();
        return buffer as any;
    }

    /**
     * Get appropriate filename for entity export
     */
    getExportFilename(entity: string): string {
        return generateExportFilename(entity);
    }
}

export default new BackupService();
