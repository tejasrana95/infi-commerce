import apiClient from '@/lib/apiClient';
import { Category, Product } from '../types';

class POCApiService {
    private storeId: string = '';

    /**
     * Initialize with store ID (call after login)
     */
    setStoreId(storeId: string) {
        this.storeId = storeId;
        localStorage.setItem('poc_store_id', storeId);
    }

    /**
     * Get store ID from storage
     */
    getStoreId(): string {
        if (!this.storeId) {
            this.storeId = localStorage.getItem('poc_store_id') || '';
        }
        return this.storeId;
    }

    /**
     * Get categories for POC
     */
    async getCategories(): Promise<Category[]> {
        // Using main categories API
        const response = await apiClient.get('/categories');
        const categories = response.data.categories || [];

        return categories.map((cat: any) => ({
            id: cat._id,
            name: cat.title, // Mapping title to name
            slug: cat.slug,
            image: cat.image,
            parentCategory: cat.parentCategory,
        }));
    }

    /**
     * Search products
     */
    async getProducts(categoryId?: string, search?: string): Promise<Product[]> {
        // Using main products API
        let url = '/products';

        const params: string[] = [];
        if (search) {
            params.push(`search=${encodeURIComponent(search)}`);
        }
        if (categoryId) {
            params.push(`categoryId=${categoryId}`);
        }

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const response = await apiClient.get(url);
        const products = response.data.products || [];
        return this.transformProducts(products);
    }

    /**
     * Get product by barcode or SKU
     */
    async getProductByBarcode(code: string): Promise<Product | undefined> {
        try {
            // Using main products API with barcode search (which I just added)
            // We search for exact code
            const response = await apiClient.get(`/products?search=${encodeURIComponent(code)}&limit=1`);
            const productsList = response.data.products || [];

            if (productsList.length > 0) {
                const products = this.transformProducts(productsList);
                return products[0];
            }
            return undefined;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return undefined;
            }
            throw error;
        }
    }

    /**
     * Get current active session
     */
    async getCurrentSession() {
        const response = await apiClient.get('/pos/session/current');
        return response.data.data;
    }

    /**
     * Start new POC session
     */
    async startSession(openingCash: number) {
        const response = await apiClient.post('/pos/session/start', {
            openingCash,
        });
        return response.data.data;
    }

    /**
     * End POC session
     */
    async endSession(sessionId: string, closingCash: number, notes?: string) {
        const response = await apiClient.post('/pos/session/end', {
            sessionId,
            closingCash,
            notes,
        });
        return response.data.data;
    }

    /**
     * Get store data by ID
     */
    async getStoreData(storeId: string): Promise<any> {
        const response = await apiClient.get(`/stores/${storeId}`, {
            headers: { 'x-store-id': storeId }
        });
        return response.data.store;
    }

    /**
     * Create POC order (checkout)
     */
    async checkout(orderData: {
        items: any[];
        subtotal: number;
        tax: number;
        total: number;
        paymentMethod: 'cash' | 'card' | 'upi';
        cashReceived?: number;
        roundOffAmount?: number;
        customer?: any;
        notes?: string;
        priceOverrides?: any[];
        discountsApplied?: any[];
    }): Promise<{ success: boolean; orderId: string; orderNumber: string }> {
        const sessionId = await this.getCurrentSession().then(s => s?._id);

        const response = await apiClient.post('/orders', {
            isPOCOrder: true,
            pocSessionId: sessionId,
            customerId: orderData.customer?.id,
            items: orderData.items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                attributes: item.attributes,
            })),
            subtotal: orderData.subtotal,
            shippingCost: 0,
            tax: orderData.tax,
            total: orderData.total,
            roundOffAmount: orderData.roundOffAmount || 0,
            paymentMethod: orderData.paymentMethod,
            paymentStatus: 'paid',
            status: 'processing',
            currency: 'USD', // Should come from store settings
            exchangeRate: 1,
            priceOverrides: orderData.priceOverrides,
            discountsApplied: orderData.discountsApplied,
            customerNote: orderData.notes,
            // Minimal shipping/billing for POC orders
            shippingAddress: {
                firstName: orderData.customer?.name || 'Walk-in',
                lastName: 'Customer',
                address1: 'In-store purchase',
                city: 'N/A',
                state: 'N/A',
                country: 'US',
                postalCode: '00000',
                phone: orderData.customer?.phone || '0000000000',
            },
            billingAddress: {
                firstName: orderData.customer?.name || 'Walk-in',
                lastName: 'Customer',
                address1: 'In-store purchase',
                city: 'N/A',
                state: 'N/A',
                country: 'US',
                postalCode: '00000',
                phone: orderData.customer?.phone || '0000000000',
            },
        });

        return {
            success: true,
            orderId: response.data.data._id,
            orderNumber: response.data.data.orderNumber,
        };
    }

    /**
     * Verify password for sensitive actions
     */
    async verifyPassword(password: string): Promise<boolean> {
        try {
            const response = await apiClient.post('/pos/verify-password', { password });
            return response.data.data.isValid;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get receipt data for printing
     */
    async getReceiptData(orderId: string) {
        const response = await apiClient.get(`/pos/receipt/${orderId}`);
        return response.data.data;
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        // Dashboard is a bit more complex as it aggregates multiple data points
        // We might keep a specialized endpoint for this to avoid multiple frontend calls,
        // but let's make sure it's consistent.
        const response = await apiClient.get('/pos/dashboard');
        return response.data.data;
    }

    /**
     * Get customers with optional search
     */
    async getCustomers(search?: string): Promise<any[]> {
        let url = '/customers';
        if (search) {
            url += `?search=${encodeURIComponent(search)}`;
        }
        const response = await apiClient.get(url);
        const customers = response.data.data || [];
        return customers.map((c: any) => this.transformCustomer(c));
    }

    /**
     * Create a new customer
     */
    async createCustomer(data: { name: string; email?: string; phone?: string }): Promise<any> {
        // Split name into first and last for backend
        const names = data.name.trim().split(/\s+/);
        const firstName = names[0];
        const lastName = names.slice(1).join(' ') || 'Customer';

        const response = await apiClient.post('/customers', {
            firstName,
            lastName,
            email: data.email || `walkin_${Date.now()}@infitechnology.local`,
            password: 'PocCustomer123!', // Default password for POC-created customers
            phone: data.phone,
            isActive: true,
        });

        return this.transformCustomer(response.data.data);
    }

    /**
     * Transform backend customer to frontend format
     */
    private transformCustomer(c: any): any {
        return {
            id: c._id,
            name: `${c.firstName} ${c.lastName}`.trim(),
            email: c.email,
            phone: c.phone,
            // These might not be directly in the customer object, mapping defaults
            totalOrders: c.totalOrders || 0,
            totalSpent: c.totalSpent || 0,
        };
    }

    /**
     * Transform backend products to frontend format
     */
    private transformProducts(products: any[]): Product[] {
        return products.map((p: any) => {
            // Using pricing from main API if available, otherwise fallback to basic fields
            const currentPrice = Number(p.pricing?.finalPrice ?? (p.isOnSale && p.salePrice ? p.salePrice : p.price)) || 0;
            const taxRate = Number(p.pricing?.taxRate ?? p.taxRate ?? 0);
            let taxAmount = Number(p.pricing?.unitTaxAmount ?? p.taxAmount ?? 0);

            // If taxAmount is 0 but taxRate exists, calculate it (assuming inclusive price)
            if (taxAmount === 0 && taxRate > 0) {
                taxAmount = currentPrice - (currentPrice / (1 + (taxRate / 100)));
            }

            return {
                id: p._id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode || p.sku,
                price: currentPrice,
                salePrice: (p.pricing?.isOnSale || p.isOnSale) ? currentPrice : undefined,
                taxRate: taxRate,
                taxAmount: taxAmount,
                stock: p.stock,
                image: p.featuredImage || p.images?.[0] || '',
                type: p.type,
                // Handle both populated and unpopulated categoryIds
                categoryIds: p.categoryIds?.map((cat: any) =>
                    typeof cat === 'object' ? cat._id : cat
                ) || [],
                attributes: p.productOptions?.map((opt: any) => ({
                    id: opt.optionId?._id?.toString() || opt.optionId?.toString() || 'Attribute',
                    name: opt.optionId?.name || 'Attribute',
                    options: opt.values,
                })),
                variants: p.variants?.map((v: any) => {
                    const vPrice = Number(v.pricing?.finalPrice ?? v.price) || 0;
                    const vTaxRate = Number(v.pricing?.taxRate ?? p.pricing?.taxRate ?? p.taxRate ?? 0);
                    let vTaxAmount = Number(v.pricing?.unitTaxAmount ?? 0);

                    if (vTaxAmount === 0 && vTaxRate > 0) {
                        vTaxAmount = vPrice - (vPrice / (1 + (vTaxRate / 100)));
                    }

                    return {
                        id: v._id || v.sku,
                        sku: v.sku,
                        barcode: v.barcode || v.sku,
                        attributes: v.attributes || {},
                        price: vPrice,
                        taxRate: vTaxRate,
                        taxAmount: vTaxAmount,
                        stock: v.stock,
                        image: v.images?.[0],
                    };
                }),
            };
        });
    }
}

export default new POCApiService();
