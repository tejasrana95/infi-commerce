import apiClient from '@/lib/apiClient';
import { Category, Order, Product } from '../types';
import { productCacheService } from './productCache.service';
import { categoryCacheService } from './categoryCache.service';

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
        // Try getting from cache first
        try {
            const cachedCategories = await categoryCacheService.getAllCategories();
            if (cachedCategories.length > 0) {
                return cachedCategories.map(cat => ({
                    id: cat.id,
                    _id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    image: cat.image,
                    parentCategory: cat.parentCategory,
                }));
            }
        } catch (error) {
            console.warn('Failed to get categories from cache, falling back to network', error);
        }

        // Fallback to API
        try {
            const response = await apiClient.get('/categories');
            const categories = response.data.categories || [];

            return categories.map((cat: any) => ({
                id: cat._id,
                _id: cat._id,
                name: cat.title, // Mapping title to name
                slug: cat.slug,
                image: cat.image,
                parentCategory: cat.parentCategory,
            }));
        } catch (error) {
            console.error('Failed to categories from API', error);
            // If API fails and we have nothing, return empty
            return [];
        }
    }

    /**
     * Search products
     */
    async getProducts(categoryId?: string, search?: string, page: number = 1, limit: number = 20): Promise<{ products: Product[], pagination: { total: number, page: number, limit: number, pages: number } }> {
        // Try getting from cache first if simple query
        // Complex filtering might still need API if cache doesn't support it fully yet,
        // but our cache service supports search and category filter.
        try {
            let cachedResult;

            if (categoryId) {

                // If special "all-products" category, treat as no category filter
                if (categoryId === 'all-products') {
                    cachedResult = await productCacheService.searchProducts(search || '');
                } else {
                    cachedResult = await productCacheService.getProductsByCategory(categoryId);
                    // If search is also present, filter the category results (in-memory filter)
                    // This is efficiently handled by getProductsByCategory's underlying logic if expanded, 
                    // but for now we just filter the result array if needed or trust the service.
                    // Actually productCacheService.getProductsByCategory doesn't take a search query.
                    // So we should filter manually if search is present.
                    if (search) {
                        const lowerSearch = search.toLowerCase();
                        cachedResult = cachedResult.filter(p => p.searchText.includes(lowerSearch));
                    }
                }
            } else {
                cachedResult = await productCacheService.searchProducts(search || '');
            }

            if (cachedResult && cachedResult.length > 0) {
                // Pagination simulation
                const total = cachedResult.length;
                const start = (page - 1) * limit;
                const paginatedItems = cachedResult.slice(start, start + limit);

                return {
                    products: this.transformIndexedDBProducts(paginatedItems),
                    pagination: {
                        total,
                        page,
                        limit,
                        pages: Math.ceil(total / limit)
                    }
                };
            } else if (await productCacheService.getProductCount() > 0) {
                // If we have products in cache but result is empty, it means no match.
                // We should still return empty result from cache instead of hitting API 
                // IF we trust our cache is up to date (sync service handles that).
                // However, user might want to force fetch match from server?
                // For "offline-first", we trust cache.
                return {
                    products: [],
                    pagination: { total: 0, page, limit, pages: 0 }
                };
            }
        } catch (error) {
            console.warn('Cache lookup failed, falling back to API', error);
        }

        // Fallback to API
        let url = '/products';

        const params: string[] = [];
        // Add isActive=true to match what we sync
        params.push('isActive=true');
        params.push('sortBy=createdAt');
        params.push('sortOrder=desc');
        if (search) {
            params.push(`search=${encodeURIComponent(search)}`);
        }
        if (categoryId) {
            params.push(`categoryId=${categoryId}`);
        }
        if (page && page > 0) {
            params.push(`page=${page}`);
        }
        if (limit && limit > 0) {
            params.push(`limit=${limit}`);
        }

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        try {
            const response = await apiClient.get(url);
            const products = response.data.products || [];
            return {
                products: this.transformProducts(products),
                pagination: response.data.pagination || { total: 0, page: 1, limit: 100, pages: 0 }
            };
        } catch (error) {
            console.error('API fetch failed', error);
            throw error;
        }
    }

    /**
     * Get product by barcode or SKU
     */
    async getProductByBarcode(code: string): Promise<Product | undefined> {
        // Try cache first
        try {
            const cachedProduct = await productCacheService.getProductBySku(code);
            if (cachedProduct) {
                // transform and return
                const products = this.transformIndexedDBProducts([cachedProduct]);
                return products[0];
            }
        } catch (error) {
            console.warn('Cache lookup by barcode failed', error);
        }

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
        paymentMethod: 'cash' | 'card' | 'upi' | 'qr' | 'stripe' | 'razorpay' | 'paypal';
        cashReceived?: number;
        roundOffAmount?: number;
        customer?: any;
        notes?: string;
        discountsApplied?: any[];
        currency?: string;
        discount?: number;
        paymentId?: string;
        couponCode?: string;
    }): Promise<{ success: boolean; orderId: string; orderNumber: string, order: Order }> {
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
            // Send discount info for backend validation and application
            discountAmount: item.discountAmount || undefined,
            discountType: item.discountType || undefined,
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
            discountsApplied: orderData.discountsApplied,
            customerNote: orderData.notes,
            paymentId: orderData.paymentId,
            couponCode: orderData.couponCode, // Include coupon code for validation
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
            order: response.data.data,
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

        // Enforce descending sort by default for POS
        queryParams.append('sortBy', 'createdAt');
        queryParams.append('sortOrder', 'desc');

        if (params?.page) queryParams.append('page', String(params.page));
        if (params?.limit) queryParams.append('limit', String(params.limit));
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        if (params?.dateRange) queryParams.append('dateRange', params.dateRange);
        if (params?.posUserId) queryParams.append('posUserId', params.posUserId);

        const response = await apiClient.get(`/orders?${queryParams.toString()}`);
        return response.data;
    }

    async getOrderById(orderId: string) {
        const response = await apiClient.get(`/orders/${orderId}`);
        return response.data.data;
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
            // Extract pricing info from API response
            const apiPricing = p.pricing || {};
            const taxRate = Number(apiPricing.taxRate ?? p.taxRate ?? 0);
            const taxAmount = Number(apiPricing.taxAmount ?? p.taxAmount ?? 0);

            // Build the pricing object - using tax-inclusive prices from backend
            const pricing = apiPricing ? {
                price: Number(apiPricing.price ?? p.price) || 0,
                salePrice: apiPricing.salePrice,
                priceWithTax: Number(apiPricing.priceWithTax ?? apiPricing.originalPrice ?? p.price) || 0,
                salePriceWithTax: apiPricing.salePriceWithTax,
                taxRate: taxRate,
                taxAmount: taxAmount,
                finalPrice: Number(apiPricing.finalPrice ?? apiPricing.salePriceWithTax ?? apiPricing.priceWithTax ?? p.price) || 0,
                originalPrice: Number(apiPricing.originalPrice ?? apiPricing.priceWithTax ?? p.price) || 0,
                isOnSale: Boolean(apiPricing.isOnSale ?? p.isOnSale),
                discountPercent: apiPricing.discountPercent,
            } : undefined;

            return {
                id: p._id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode || p.sku,
                price: Number(p.price) || 0,                    // Base price (without tax)
                salePrice: p.salePrice,                         // Sale price (without tax)
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
                productOptions: p.productOptions,
                pricing: pricing,                               // Full pricing object
                variants: p.variants?.map((v: any) => {
                    const vApiPricing = v.pricing || {};
                    const vTaxRate = Number(vApiPricing.taxRate ?? apiPricing.taxRate ?? taxRate ?? 0);
                    const vTaxAmount = Number(vApiPricing.taxAmount ?? 0);

                    // Build variant pricing object
                    const vPricing = vApiPricing ? {
                        price: Number(vApiPricing.price ?? v.price) || 0,
                        salePrice: vApiPricing.salePrice,
                        priceWithTax: Number(vApiPricing.priceWithTax ?? vApiPricing.originalPrice ?? v.price) || 0,
                        salePriceWithTax: vApiPricing.salePriceWithTax,
                        taxRate: vTaxRate,
                        taxAmount: vTaxAmount,
                        finalPrice: Number(vApiPricing.finalPrice ?? vApiPricing.salePriceWithTax ?? vApiPricing.priceWithTax ?? v.price) || 0,
                        originalPrice: Number(vApiPricing.originalPrice ?? vApiPricing.priceWithTax ?? v.price) || 0,
                        isOnSale: Boolean(vApiPricing.isOnSale),
                        discountPercent: vApiPricing.discountPercent,
                    } : undefined;

                    return {
                        id: v._id || v.sku,
                        sku: v.sku,
                        barcode: v.barcode || v.sku,
                        attributes: v.attributes || {},
                        price: Number(v.price) || 0,            // Base price (without tax)
                        salePrice: v.salePrice,                 // Sale price (without tax)
                        taxRate: vTaxRate,
                        taxAmount: vTaxAmount,
                        stock: v.stock,
                        image: v.images?.[0],
                        pricing: vPricing,                      // Full pricing object
                    };
                }),
            };
        });
    }

    private transformIndexedDBProducts(products: import('./indexedDB.service').IndexedDBProduct[]): Product[] {
        return products.map(p => {
            // Extract pricing from cached data if available
            const cachedPricing = (p as any).pricing;
            const taxRate = Number(p.taxRate ?? cachedPricing?.taxRate ?? 0);
            const taxAmount = Number(p.taxAmount ?? cachedPricing?.taxAmount ?? 0);

            // Build pricing object from cached data
            const pricing = cachedPricing ? {
                price: Number(cachedPricing.price ?? p.price) || 0,
                salePrice: cachedPricing.salePrice,
                priceWithTax: Number(cachedPricing.priceWithTax ?? cachedPricing.originalPrice ?? p.price) || 0,
                salePriceWithTax: cachedPricing.salePriceWithTax,
                taxRate: taxRate,
                taxAmount: taxAmount,
                finalPrice: Number(cachedPricing.finalPrice ?? cachedPricing.salePriceWithTax ?? cachedPricing.priceWithTax ?? p.price) || 0,
                originalPrice: Number(cachedPricing.originalPrice ?? cachedPricing.priceWithTax ?? p.price) || 0,
                isOnSale: Boolean(cachedPricing.isOnSale),
                discountPercent: cachedPricing.discountPercent,
            } : undefined;

            return {
                id: p.id,
                name: p.name,
                sku: p.sku,
                barcode: p.barcode || p.sku,
                price: Number(p.price) || 0,                    // Base price
                salePrice: p.salePrice,
                taxRate: taxRate,
                taxAmount: taxAmount,
                stock: p.stock,
                image: p.image || '',
                type: p.type as any,
                categoryIds: p.categoryIds,
                attributes: p.productOptions?.map((opt: any) => ({
                    id: opt.optionId?._id?.toString() || opt.optionId?.toString() || 'Attribute',
                    name: opt.optionId?.name || 'Attribute',
                    options: opt.values,
                })),
                productOptions: p.productOptions,
                pricing: pricing,                               // Full pricing object
                variants: p.variants?.map((v: any) => {
                    const vCachedPricing = v.pricing;
                    const vTaxRate = Number(vCachedPricing?.taxRate ?? taxRate ?? 0);
                    const vTaxAmount = Number(vCachedPricing?.taxAmount ?? 0);

                    // Build variant pricing object
                    const vPricing = vCachedPricing ? {
                        price: Number(vCachedPricing.price ?? v.price) || 0,
                        salePrice: vCachedPricing.salePrice,
                        priceWithTax: Number(vCachedPricing.priceWithTax ?? vCachedPricing.originalPrice ?? v.price) || 0,
                        salePriceWithTax: vCachedPricing.salePriceWithTax,
                        taxRate: vTaxRate,
                        taxAmount: vTaxAmount,
                        finalPrice: Number(vCachedPricing.finalPrice ?? vCachedPricing.salePriceWithTax ?? vCachedPricing.priceWithTax ?? v.price) || 0,
                        originalPrice: Number(vCachedPricing.originalPrice ?? vCachedPricing.priceWithTax ?? v.price) || 0,
                        isOnSale: Boolean(vCachedPricing.isOnSale),
                        discountPercent: vCachedPricing.discountPercent,
                    } : undefined;

                    return {
                        id: v._id || v.sku,
                        sku: v.sku,
                        barcode: v.barcode || v.sku,
                        attributes: v.attributes || {},
                        price: Number(v.price) || 0,
                        salePrice: v.salePrice,
                        taxRate: vTaxRate,
                        taxAmount: vTaxAmount,
                        stock: v.stock,
                        image: v.images?.[0],
                        pricing: vPricing,
                    };
                })
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
        posSessionId?: string;
        customerDetails?: {
            id?: string;
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

    /**
     * Apply coupon code
     */
    async applyCoupon(couponCode: string): Promise<{
        valid: boolean;
        coupon: {
            code: string;
            discountType: 'flat' | 'percentage';
            discountValue: number;
            discountAmount: number;
            description?: string;
        };
        newSubtotal: number;
    }> {
        const storeId = this.getStoreId();
        const cart = await this.getCurrentSession().then(s => ({ storeId })).catch(() => ({ storeId }));

        // Get current cart items from local state or send minimal cart info
        // For POS, we'll send an empty items array since we're just validating
        const response = await apiClient.post('/checkout/validate-coupon-pos', {
            couponCode,
            items: [],
            subtotal: 0
        });
        return response.data;
    }

    /**
     * Apply coupon code for POS checkout (with cart items)
     */
    async applyCouponPOS(
        couponCode: string,
        items: Array<{ productId: string; price: number; quantity: number }>,
        subtotal: number
    ): Promise<{
        valid: boolean;
        coupon: {
            code: string;
            discountType: 'flat' | 'percentage';
            discountValue: number;
            discountAmount: number;
            description?: string;
        };
        newSubtotal: number;
    }> {
        const response = await apiClient.post('/checkout/validate-coupon-pos', {
            couponCode,
            items,
            subtotal
        });
        return response.data;
    }

    /**
     * Remove applied coupon
     */
    async removeCoupon(): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.delete('/checkout/remove-coupon');
        return response.data;
    }

    /**
     * Search orders for return
     */
    async searchOrders(query: string) {
        const response = await apiClient.get(`/pos/orders/search?query=${encodeURIComponent(query)}`);
        return response.data.data;
    }

    /**
     * Calculate refund for return items
     */
    async calculateRefund(orderId: string, items: Array<{
        productId: string;
        variantId?: string;
        quantity: number;
    }>) {
        const response = await apiClient.post('/pos/orders/calculate-refund', {
            orderId,
            items
        });
        return response.data.data;
    }

    /**
     * Process return
     */
    async processReturn(data: {
        orderId: string;
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
            reason: string;
        }>;
        refundAmount: number;
        refundMethod: string;
        reason: string;
        notes?: string;
    }) {
        const response = await apiClient.post('/pos/orders/return', data);
        return response.data.data;
    }
}

export default new POCApiService();
