import apiClient from '@/lib/apiClient';
import { Category, Product } from '../types';

class POCApiService {
    private storeId: string = '';

    /**
     * Initialize with store ID (call after login)
     */
    setStoreId(storeId: string) {
        this.storeId = storeId;
        localStorage.setItem('pos_store_id', storeId);
    }

    /**
     * Get store ID from storage
     */
    getStoreId(): string {
        if (!this.storeId) {
            this.storeId = localStorage.getItem('pos_store_id') || '';
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
            const response = await apiClient.get(`/products?sku=${encodeURIComponent(code)}&limit=1`);
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
     * Create POS order (checkout)
     */
    async checkout(orderData: {
        items: any[];
        subtotal: number;
        tax: number;
        total: number;
        paymentMethod: 'cash' | 'card' | 'upi' | 'qr';
        cashReceived?: number;
        roundOffAmount?: number;
        customer?: any;
        notes?: string;
        priceOverrides?: any[];
        discountsApplied?: any[];
        currency?: string;
        discount?: number;
        paymentId?: string;
    }): Promise<{ success: boolean; orderId: string; orderNumber: string }> {
        const sessionId = await this.getCurrentSession().then(s => s?._id);
        const storeId = this.getStoreId();

        // Build items with full details for order consistency
        const orderItems = orderData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            // Include item details for reference (backend will validate/override from product)
            name: item.name,
            sku: item.sku,
            price: item.price,
            image: item.image,
            attributes: item.attributes,
        }));

        const response = await apiClient.post('/orders/admin/create', {
            storeId,
            isPOSOrder: true,
            posSessionId: sessionId,
            customerId: orderData.customer?.id,
            items: orderItems,
            subtotal: orderData.subtotal,
            shippingCost: 0,
            tax: orderData.tax,
            discount: orderData.discount || 0,
            total: orderData.total, // Include the calculated total
            roundOffAmount: orderData.roundOffAmount || 0,
            paymentMethod: orderData.paymentMethod,
            paymentStatus: 'paid',
            status: 'delivered', // POS orders are delivered immediately
            currency: orderData.currency || 'USD', // Use provided currency or default
            priceOverrides: orderData.priceOverrides,
            discountsApplied: orderData.discountsApplied,
            customerNote: orderData.notes,
            paymentId: orderData.paymentId,
            paymentDetails: {
                transactionId: orderData.paymentId // Redundant but good for backward compat
            },
            // Minimal shipping/billing for POS orders
            shippingAddress: {
                firstName: orderData.customer?.name?.split(' ')[0] || 'Walk-in',
                lastName: orderData.customer?.name?.split(' ').slice(1).join(' ') || 'Customer',
                address1: 'In-store purchase',
                city: 'N/A',
                state: 'N/A',
                country: 'IN',
                postalCode: '000000',
                phone: orderData.customer?.phone || '0000000000',
                email: orderData.customer?.email || '',
            },
            billingAddress: {
                firstName: orderData.customer?.name?.split(' ')[0] || 'Walk-in',
                lastName: orderData.customer?.name?.split(' ').slice(1).join(' ') || 'Customer',
                address1: 'In-store purchase',
                city: 'N/A',
                state: 'N/A',
                country: 'IN',
                postalCode: '000000',
                phone: orderData.customer?.phone || '0000000000',
                email: orderData.customer?.email || '',
            },
        });

        return {
            success: true,
            orderId: response.data.data._id,
            orderNumber: response.data.data.orderNumber,
        };
    }

    /**
     * Get POS orders with optional filters
     */
    async getOrders(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        dateRange?: string;
        posUserId?: string;
    }) {
        const queryParams = new URLSearchParams();
        queryParams.append('isPOSOrder', 'true');

        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params?.posUserId) queryParams.append('posUserId', params.posUserId);

        const response = await apiClient.get(`/orders?${queryParams.toString()}`);
        return response.data;
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
    async createCustomer(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: {
            address1: string;
            address2?: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            type?: string;
        };
    }): Promise<any> {
        const payload: any = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            password: `PocCustomer_${Date.now()}`, // Auto-generate password
            phone: data.phone || undefined,
            isActive: true,
        };

        if (data.address) {
            payload.addresses = [{
                ...data.address,
                type: 'billing',
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone || '0000000000',
                isDefault: true
            }];
        }

        const response = await apiClient.post('/customers', payload);

        return this.transformCustomer(response.data.data);
    }

    /**
     * Get customer by ID
     */
    async getCustomerById(customerId: string): Promise<any> {
        try {
            const response = await apiClient.get(`/customers/${customerId}`);
            return this.transformCustomer(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customer:', error);
            return null;
        }
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
            addresses: c.addresses,
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

    /**
     * Held Orders Management
     */

    /**
     * Create a held order
     */
    async createHeldOrder(data: {
        customerIdentifier: string;
        customerId?: string;
        items: any[];
        subtotal: number;
        tax: number;
        total: number;
        notes?: string;
    }) {
        const response = await apiClient.post('/pos/held-orders', data);
        return response.data.data;
    }

    /**
     * Get all held orders (optionally filter by assignedToMe)
     */
    async getHeldOrders(assignedToMe: boolean = false) {
        const params = assignedToMe ? '?assignedToMe=true' : '';
        const response = await apiClient.get(`/pos/held-orders${params}`);
        return response.data.data || [];
    }

    /**
     * Transfer held order to another user
     */
    async transferHeldOrder(orderId: string, targetUserId: string) {
        const response = await apiClient.put(`/pos/held-orders/${orderId}/transfer`, {
            targetUserId,
        });
        return response.data.data;
    }

    /**
     * Mark held order as resumed
     */
    async resumeHeldOrder(orderId: string) {
        const response = await apiClient.put(`/pos/held-orders/${orderId}/resume`);
        return response.data.data;
    }

    /**
     * Delete held order
     */
    async deleteHeldOrder(orderId: string) {
        const response = await apiClient.delete(`/pos/held-orders/${orderId}`);
        return response.data;
    }

    /**
     * Get all POS users (for transfer functionality)
     */
    async getPOSUsers() {
        const response = await apiClient.get('/pos/users');
        return response.data.data || [];
    }

    /**
     * Generate QR Code for payment
     */
    async generateQR(data: {
        amount: number;
        currency?: string;
        orderId?: string; // Optional, if we want to link unrelated to an order yet
        description?: string;
        customerDetails?: {
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
    }) {
        const response = await apiClient.post('/pos-payment/qr', data);
        return response.data.data;
    }

    /**
     * Check QR Payment Status
     */
    async getQRPaymentStatus(qrId: string, params?: { gateway?: string; configId?: string }) {
        let url = `/pos-payment/qr/${qrId}/status`;
        const query: string[] = [];
        if (params?.gateway) query.push(`gateway=${params.gateway}`);
        if (params?.configId) query.push(`configId=${params.configId}`);
        if (query.length > 0) url += `?${query.join('&')}`;

        const response = await apiClient.get(url);
        return response.data.data;
    }

    /**
     * Manually verify a QR payment (admin override)
     */
    async manualVerifyQR(orderId: string) {
        // Matches router.post('/qr/:orderId/verify', verifyManual)
        const response = await apiClient.post(`/pos-payment/qr/${orderId}/verify`);
        return response.data;
    }

    /**
     * Cancel a QR code
     */
    async cancelQR(qrId: string) {
        // Matches router.post('/qr/:id/cancel', cancelQR)
        const response = await apiClient.post(`/pos-payment/qr/${qrId}/cancel`);
        return response.data;
    }
    /**
     * Get countries list
     */
    async getCountries(): Promise<any[]> {
        const response = await apiClient.get('/geo?type=country&isActive=true');
        return response.data.data || [];
    }

    /**
     * Get states for a country
     */
    async getStates(countryId: string): Promise<any[]> {
        const response = await apiClient.get(`/geo/countries/${countryId}/states`);
        return response.data.data || [];
    }
}

export default new POCApiService();
