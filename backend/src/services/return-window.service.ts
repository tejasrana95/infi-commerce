import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import Store from '../models/Store';

/**
 * Return Window Service
 * Handles return/exchange eligibility calculations and validation
 */

export interface ReturnEligibilityResult {
    isEligible: boolean;
    returnEligible: boolean;
    exchangeEligible: boolean;
    daysRemaining: number;
    exchangeDaysRemaining: number;
    returnDeadline: Date | null;
    exchangeDeadline: Date | null;
    reason?: string;
}

export interface OrderItemEligibility {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    quantity: number;
    returnableQuantity: number; // Quantity - already returned
    eligibility: ReturnEligibilityResult;
}

class ReturnWindowService {
    /**
     * Get default return settings
     */
    getDefaultSettings() {
        return {
            enabled: true,
            defaultReturnWindow: 7,
            defaultExchangeWindow: 7,
            allowPartialReturns: true,
            requireReturnReason: true,
            autoApproveReturns: false,
            pickupEnabled: true,
            dropOffEnabled: true,
            refundMethods: ['original', 'store_credit'] as const,
        };
    }

    /**
     * Calculate return/exchange deadlines for an order item
     */
    calculateDeadlines(
        orderItem: any,
        deliveredAt: Date | null,
        storeSettings: any
    ): {
        returnDeadline: Date | null;
        exchangeDeadline: Date | null;
        returnWindowDays: number;
        exchangeWindowDays: number;
    } {
        if (!deliveredAt) {
            return {
                returnDeadline: null,
                exchangeDeadline: null,
                returnWindowDays: 0,
                exchangeWindowDays: 0,
            };
        }

        const returnSettings = storeSettings?.returnSettings || this.getDefaultSettings();

        // Use snapshot from order item if available, otherwise calculate from product/store
        const returnWindowDays =
            orderItem.returnWindowDays ??
            returnSettings.defaultReturnWindow ??
            7;

        const exchangeWindowDays =
            orderItem.exchangeWindowDays ??
            returnSettings.defaultExchangeWindow ??
            7;

        const returnDeadline = new Date(deliveredAt);
        returnDeadline.setDate(returnDeadline.getDate() + returnWindowDays);

        const exchangeDeadline = new Date(deliveredAt);
        exchangeDeadline.setDate(exchangeDeadline.getDate() + exchangeWindowDays);

        return {
            returnDeadline,
            exchangeDeadline,
            returnWindowDays,
            exchangeWindowDays,
        };
    }

    /**
     * Check if a specific item is eligible for return/exchange
     */
    checkItemEligibility(
        orderItem: any,
        deliveredAt: Date | null,
        storeSettings: any
    ): ReturnEligibilityResult {
        // Check if item is marked as non-returnable
        if (orderItem.isReturnable === false) {
            return {
                isEligible: false,
                returnEligible: false,
                exchangeEligible: false,
                daysRemaining: 0,
                exchangeDaysRemaining: 0,
                returnDeadline: null,
                exchangeDeadline: null,
                reason: 'This item is non-returnable',
            };
        }

        // Check if return window is 0 (non-returnable)
        if (orderItem.returnWindowDays === 0) {
            return {
                isEligible: false,
                returnEligible: false,
                exchangeEligible: false,
                daysRemaining: 0,
                exchangeDaysRemaining: 0,
                returnDeadline: null,
                exchangeDeadline: null,
                reason: 'This item is non-returnable',
            };
        }

        // Check if order is delivered
        if (!deliveredAt) {
            return {
                isEligible: false,
                returnEligible: false,
                exchangeEligible: false,
                daysRemaining: 0,
                exchangeDaysRemaining: 0,
                returnDeadline: null,
                exchangeDeadline: null,
                reason: 'Order has not been delivered yet',
            };
        }

        const { returnDeadline, exchangeDeadline } =
            this.calculateDeadlines(orderItem, deliveredAt, storeSettings);

        const now = new Date();

        // Calculate days remaining
        const returnDaysRemaining = returnDeadline
            ? Math.max(0, Math.ceil((returnDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        const exchangeDaysRemaining = exchangeDeadline
            ? Math.max(0, Math.ceil((exchangeDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        const isReturnExpired = returnDeadline ? now > returnDeadline : true;
        const isExchangeExpired = exchangeDeadline ? now > exchangeDeadline : true;

        // Check if fully returned
        const returnedQuantity = orderItem.returnedQuantity || 0;
        if (returnedQuantity >= orderItem.quantity) {
            return {
                isEligible: false,
                returnEligible: false,
                exchangeEligible: false,
                daysRemaining: 0,
                exchangeDaysRemaining: 0,
                returnDeadline,
                exchangeDeadline,
                reason: 'This item has already been fully returned',
            };
        }

        if (isReturnExpired && isExchangeExpired) {
            return {
                isEligible: false,
                returnEligible: false,
                exchangeEligible: false,
                daysRemaining: 0,
                exchangeDaysRemaining: 0,
                returnDeadline,
                exchangeDeadline,
                reason: `Return window expired on ${returnDeadline?.toLocaleDateString()}`,
            };
        }

        return {
            isEligible: !isReturnExpired || !isExchangeExpired,
            returnEligible: !isReturnExpired,
            exchangeEligible: !isExchangeExpired,
            daysRemaining: returnDaysRemaining,
            exchangeDaysRemaining: exchangeDaysRemaining,
            returnDeadline,
            exchangeDeadline,
        };
    }

    /**
     * Check eligibility for all items in an order
     */
    async checkOrderEligibility(
        orderId: string,
        storeId: string
    ): Promise<{
        orderNumber: string;
        deliveredAt: Date | null;
        canReturn: boolean;
        canExchange: boolean;
        items: OrderItemEligibility[];
        returnSettings: any;
    }> {
        const order = await Order.findOne({
            _id: orderId,
            storeId: new mongoose.Types.ObjectId(storeId),
        });

        if (!order) {
            throw new Error('Order not found');
        }

        const store = await Store.findById(storeId);
        if (!store) {
            throw new Error('Store not found');
        }

        const returnSettings = store.settings?.returnSettings || this.getDefaultSettings();

        // Check if returns are enabled for the store
        if (!returnSettings.enabled) {
            return {
                orderNumber: order.orderNumber,
                deliveredAt: order.deliveredAt || null,
                canReturn: false,
                canExchange: false,
                items: [],
                returnSettings,
            };
        }

        const deliveredAt = order.deliveredAt || null;
        const items: OrderItemEligibility[] = [];

        for (const item of order.items) {
            const eligibility = this.checkItemEligibility(item, deliveredAt, store.settings);
            const returnedQuantity = item.returnedQuantity || 0;

            items.push({
                productId: item.productId.toString(),
                variantId: item.variantId,
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                returnableQuantity: Math.max(0, item.quantity - returnedQuantity),
                eligibility,
            });
        }

        const canReturn = items.some((item) => item.eligibility.returnEligible && item.returnableQuantity > 0);
        const canExchange = items.some((item) => item.eligibility.exchangeEligible && item.returnableQuantity > 0);

        return {
            orderNumber: order.orderNumber,
            deliveredAt,
            canReturn,
            canExchange,
            items,
            returnSettings,
        };
    }

    /**
     * Get return window for a product (for order creation snapshot)
     */
    async getProductReturnWindow(
        productId: string,
        storeId: string
    ): Promise<{
        returnWindowDays: number;
        exchangeWindowDays: number;
        isReturnable: boolean;
    }> {
        const product = await Product.findById(productId);
        const store = await Store.findById(storeId);

        const returnSettings = store?.settings?.returnSettings || this.getDefaultSettings();

        // Resolve returnWindowDays
        // Use product value if defined, otherwise store default
        const returnWindowDays = product?.returnSettings?.returnWindowDays !== undefined
            ? product.returnSettings.returnWindowDays
            : (returnSettings.defaultReturnWindow ?? 7);

        // Resolve exchangeWindowDays
        // Use product value if defined, otherwise store default
        const exchangeWindowDays = product?.returnSettings?.exchangeWindowDays !== undefined
            ? product.returnSettings.exchangeWindowDays
            : (returnSettings.defaultExchangeWindow ?? 7);

        // Resolve isReturnable
        // 1. Must be enabled in store settings (Master Switch)
        // 2. Product must not explicitly disable it
        // 3. Return window must be > 0 (common convention)
        let isReturnable = returnSettings.enabled !== false;

        if (isReturnable) {
            // Only check product specific restrictions if return is globally enabled
            if (product?.returnSettings?.isReturnable === false) {
                isReturnable = false;
            } else if (returnWindowDays === 0) {
                isReturnable = false;
            }
        }

        return {
            returnWindowDays,
            exchangeWindowDays,
            isReturnable,
        };
    }

    /**
     * Validate return request items
     */
    async validateReturnRequest(
        orderId: string,
        storeId: string,
        items: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
        }>
    ): Promise<{
        valid: boolean;
        errors: string[];
        eligibleItems: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
            maxQuantity: number;
        }>;
    }> {
        const errors: string[] = [];
        const eligibleItems: Array<{
            productId: string;
            variantId?: string;
            quantity: number;
            maxQuantity: number;
        }> = [];

        const eligibility = await this.checkOrderEligibility(orderId, storeId);

        // Get store settings to check allowPartialReturns
        const store = await Store.findById(storeId);
        const allowPartialReturns = store?.settings?.returnSettings?.allowPartialReturns ?? true;

        for (const requestItem of items) {
            const orderItem = eligibility.items.find(
                (i) =>
                    i.productId === requestItem.productId &&
                    i.variantId === requestItem.variantId
            );

            if (!orderItem) {
                errors.push(`Item not found in order: ${requestItem.productId}`);
                continue;
            }

            if (!orderItem.eligibility.returnEligible) {
                errors.push(
                    `${orderItem.name}: ${orderItem.eligibility.reason || 'Not eligible for return'}`
                );
                continue;
            }

            if (requestItem.quantity > orderItem.returnableQuantity) {
                errors.push(
                    `${orderItem.name}: Requested quantity (${requestItem.quantity}) exceeds returnable quantity (${orderItem.returnableQuantity})`
                );
                continue;
            }

            // Check if partial returns are allowed
            if (!allowPartialReturns && requestItem.quantity !== orderItem.returnableQuantity) {
                errors.push(
                    `${orderItem.name}: Partial returns are not allowed. You must return all ${orderItem.returnableQuantity} unit(s).`
                );
                continue;
            }

            eligibleItems.push({
                productId: requestItem.productId,
                variantId: requestItem.variantId,
                quantity: requestItem.quantity,
                maxQuantity: orderItem.returnableQuantity,
            });
        }

        return {
            valid: errors.length === 0 && eligibleItems.length > 0,
            errors,
            eligibleItems,
        };
    }
}

export default new ReturnWindowService();
