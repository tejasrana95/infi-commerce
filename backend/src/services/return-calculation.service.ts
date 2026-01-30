/**
 * Return Calculation Service
 * Handles return/refund calculations for POS orders
 * 
 * Since discount is now stored per-item at order creation time,
 * the refund calculation is simplified - we just use the stored values.
 */

interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    originalPrice: number;      // Price before any discount (per unit)
    price: number;              // Final price after all discounts (per unit)
    quantity: number;
    categoryIds?: string[];     // Product categories
    taxRate?: number;
    taxAmount?: number;         // Tax per unit
    // Discount breakdown (per unit)
    discountAmount?: number;    // Total discount per unit (coupon + manual)
    couponDiscount?: number;    // Coupon portion per unit
    manualDiscount?: number;    // Manual/POS discount per unit
    isCouponEligible?: boolean; // Was this item eligible for coupon?
    // Return tracking
    returnedQuantity?: number;  // Already returned quantity
    refundedAmount?: number;    // Already refunded amount
}

interface ReturnItem {
    productId: string;
    variantId?: string;
    quantity: number;
    reason?: string;
}

interface OrderDetails {
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    discount: number;
    couponCode?: string;
}

interface RefundCalculationResult {
    refundAmount: number;
    itemRefunds: Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        quantity: number;
        originalPrice: number;      // Price before discount per unit
        unitPrice: number;          // Final price per unit (after discount)
        taxAmount: number;          // Total tax for returned quantity
        discountAmount: number;     // Total discount for returned quantity
        couponDiscount: number;     // Coupon discount for returned quantity
        manualDiscount: number;     // Manual discount for returned quantity
        totalRefund: number;        // Total refund for this item
        isCouponEligible: boolean;
    }>;
    breakdown: {
        subtotal: number;           // Refund before tax (based on discounted price)
        originalSubtotal: number;   // Original price total before discounts
        totalDiscount: number;      // Total discount deducted
        couponDiscount: number;     // Coupon portion of discount
        manualDiscount: number;     // Manual discount portion
        tax: number;                // Tax on returned items
        total: number;              // Final refund amount
    };
}

export class ReturnCalculationService {
    /**
     * Calculate refund amount for returned items
     * Uses stored discount values from order items
     */
    static calculateRefund(
        orderDetails: OrderDetails,
        returnItems: ReturnItem[]
    ): RefundCalculationResult {
        const itemRefunds: RefundCalculationResult['itemRefunds'] = [];
        let totalSubtotal = 0;
        let totalOriginalSubtotal = 0;
        let totalDiscount = 0;
        let totalCouponDiscount = 0;
        let totalManualDiscount = 0;
        let totalTax = 0;

        // Calculate refund for each returned item
        for (const returnItem of returnItems) {
            const orderItem = orderDetails.items.find(
                item =>
                    item.productId === returnItem.productId &&
                    item.variantId === returnItem.variantId
            );

            if (!orderItem) {
                continue; // Skip if item not found in order
            }

            // Calculate max returnable quantity
            const alreadyReturned = orderItem.returnedQuantity || 0;
            const maxReturnable = orderItem.quantity - alreadyReturned;
            const quantityToReturn = Math.min(returnItem.quantity, maxReturnable);

            if (quantityToReturn <= 0) {
                continue; // Skip if nothing to return
            }

            // Get stored values per unit
            const originalPrice = orderItem.originalPrice || orderItem.price;
            const finalPrice = orderItem.price;
            const unitTaxAmount = orderItem.taxAmount || 0;
            const unitCouponDiscount = orderItem.couponDiscount || 0;
            const unitManualDiscount = orderItem.manualDiscount || 0;
            const unitTotalDiscount = orderItem.discountAmount || 0;

            // Calculate totals for returned quantity
            const returnOriginalSubtotal = originalPrice * quantityToReturn;
            const returnSubtotal = finalPrice * quantityToReturn;
            const returnTax = unitTaxAmount * quantityToReturn;
            const returnCouponDiscount = unitCouponDiscount * quantityToReturn;
            const returnManualDiscount = unitManualDiscount * quantityToReturn;
            const returnTotalDiscount = unitTotalDiscount * quantityToReturn;

            // Total refund = final price (after discount) + tax
            const itemTotalRefund = returnSubtotal + returnTax;

            totalOriginalSubtotal += returnOriginalSubtotal;
            totalSubtotal += returnSubtotal;
            totalTax += returnTax;
            totalCouponDiscount += returnCouponDiscount;
            totalManualDiscount += returnManualDiscount;
            totalDiscount += returnTotalDiscount;

            itemRefunds.push({
                productId: orderItem.productId,
                variantId: orderItem.variantId,
                name: orderItem.name,
                sku: orderItem.sku,
                quantity: quantityToReturn,
                originalPrice: originalPrice,
                unitPrice: finalPrice,
                taxAmount: parseFloat(returnTax.toFixed(2)),
                discountAmount: parseFloat(returnTotalDiscount.toFixed(2)),
                couponDiscount: parseFloat(returnCouponDiscount.toFixed(2)),
                manualDiscount: parseFloat(returnManualDiscount.toFixed(2)),
                totalRefund: parseFloat(itemTotalRefund.toFixed(2)),
                isCouponEligible: orderItem.isCouponEligible || false,
            });
        }

        // Calculate final refund amount
        let refundAmount = totalSubtotal + totalTax;

        // Safety check - ensure total refunds never exceed remaining refundable amount
        const alreadyRefunded = orderDetails.items.reduce((sum, item) => {
            return sum + (item.refundedAmount || 0);
        }, 0);

        const maxRefundable = orderDetails.total - alreadyRefunded;

        if (refundAmount > maxRefundable + 0.01) { // Small tolerance for rounding
            console.warn(
                `Refund amount ${refundAmount.toFixed(2)} exceeds max refundable ${maxRefundable.toFixed(2)}. Capping.`
            );
            refundAmount = Math.max(0, maxRefundable);
        }

        return {
            refundAmount: parseFloat(refundAmount.toFixed(2)),
            itemRefunds,
            breakdown: {
                subtotal: parseFloat(totalSubtotal.toFixed(2)),
                originalSubtotal: parseFloat(totalOriginalSubtotal.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                couponDiscount: parseFloat(totalCouponDiscount.toFixed(2)),
                manualDiscount: parseFloat(totalManualDiscount.toFixed(2)),
                tax: parseFloat(totalTax.toFixed(2)),
                total: parseFloat(refundAmount.toFixed(2)),
            },
        };
    }

    /**
     * Calculate refund for a single item
     * Simplified method for use in return controller
     */
    static calculateItemRefund(
        orderItem: OrderItem,
        returnQuantity: number
    ): {
        productId: string;
        variantId?: string;
        quantity: number;
        unitPrice: number;
        unitTax: number;
        subtotal: number;
        taxRefund: number;
        totalRefund: number;
    } {
        // Calculate max returnable quantity
        const alreadyReturned = orderItem.returnedQuantity || 0;
        const maxReturnable = orderItem.quantity - alreadyReturned;
        const quantityToReturn = Math.min(returnQuantity, maxReturnable);

        if (quantityToReturn <= 0) {
            return {
                productId: orderItem.productId,
                variantId: orderItem.variantId,
                quantity: 0,
                unitPrice: 0,
                unitTax: 0,
                subtotal: 0,
                taxRefund: 0,
                totalRefund: 0,
            };
        }

        // Get stored values per unit
        const finalPrice = orderItem.price;
        const unitTaxAmount = orderItem.taxAmount || 0;

        // Calculate totals for returned quantity
        const returnSubtotal = finalPrice * quantityToReturn;
        const returnTax = unitTaxAmount * quantityToReturn;

        // Total refund = final price (after discount) + tax
        const totalRefund = returnSubtotal + returnTax;

        return {
            productId: orderItem.productId,
            variantId: orderItem.variantId,
            quantity: quantityToReturn,
            unitPrice: finalPrice,
            unitTax: unitTaxAmount,
            subtotal: parseFloat(returnSubtotal.toFixed(2)),
            taxRefund: parseFloat(returnTax.toFixed(2)),
            totalRefund: parseFloat(totalRefund.toFixed(2)),
        };
    }

    /**
     * Validate return request
     */
    static validateReturn(
        orderDetails: OrderDetails,
        returnItems: ReturnItem[]
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check if return items are valid
        for (const returnItem of returnItems) {
            const orderItem = orderDetails.items.find(
                item =>
                    item.productId === returnItem.productId &&
                    item.variantId === returnItem.variantId
            );

            if (!orderItem) {
                errors.push(`Item ${returnItem.productId} not found in order`);
                continue;
            }

            const alreadyReturned = orderItem.returnedQuantity || 0;
            const maxReturnable = orderItem.quantity - alreadyReturned;

            if (returnItem.quantity > maxReturnable) {
                errors.push(
                    `Cannot return ${returnItem.quantity} of ${orderItem.name}. ` +
                    `Only ${maxReturnable} remaining (${alreadyReturned} already returned)`
                );
            }

            if (returnItem.quantity <= 0) {
                errors.push(`Return quantity must be positive for ${orderItem.name}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Calculate maximum refundable amount for an order
     */
    static getMaxRefundable(orderDetails: OrderDetails): number {
        const alreadyRefunded = orderDetails.items.reduce((sum, item) => {
            return sum + (item.refundedAmount || 0);
        }, 0);

        return Math.max(0, orderDetails.total - alreadyRefunded);
    }

    /**
     * Get remaining returnable items
     */
    static getReturnableItems(orderDetails: OrderDetails): Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        originalQuantity: number;
        returnedQuantity: number;
        returnableQuantity: number;
        originalPrice: number;
        price: number;
        refundPerUnit: number; // Price + tax per unit
    }> {
        return orderDetails.items
            .filter(item => {
                const returned = item.returnedQuantity || 0;
                return item.quantity - returned > 0;
            })
            .map(item => {
                const returned = item.returnedQuantity || 0;
                const returnable = item.quantity - returned;
                const unitTax = item.taxAmount || 0;

                return {
                    productId: item.productId,
                    variantId: item.variantId,
                    name: item.name,
                    sku: item.sku,
                    originalQuantity: item.quantity,
                    returnedQuantity: returned,
                    returnableQuantity: returnable,
                    originalPrice: item.originalPrice || item.price,
                    price: item.price,
                    refundPerUnit: item.price + unitTax,
                };
            });
    }
}

export default ReturnCalculationService;
