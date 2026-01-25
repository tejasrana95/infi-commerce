/**
 * Return Calculation Service
 * Handles complex return/refund calculations for POS orders
 * Includes tax, discounts, sales, and pro-rata coupon distribution
 */

interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku: string;
    price: number; // Price paid per unit (after sale, including tax)
    quantity: number;
    taxRate?: number;
    taxAmount?: number; // Unit tax amount
    // Discount info for audit trail
    discount?: {
        discountType: 'fixed' | 'percentage';
        amount: number;
        originalPrice: number;
        discountedPrice: number;
        appliedAt: Date;
    };
    returnedQuantity?: number; // Already returned quantity
    refundedAmount?: number; // Already refunded amount
}

interface ReturnItem {
    productId: string;
    variantId?: string;
    quantity: number; // Quantity being returned
    reason?: string;
}

interface OrderDetails {
    items: OrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    discount: number;
    couponId?: string;
    couponCode?: string;
    couponType?: 'flat' | 'percentage';
    couponValue?: number;
    couponMaxCap?: number; // Maximum discount cap for percentage coupons
    couponAppliesTo?: 'store' | 'categories';
    couponCategoryIds?: string[]; // Category IDs if coupon applies to specific categories
}

interface RefundCalculationResult {
    refundAmount: number;
    itemRefunds: Array<{
        productId: string;
        variantId?: string;
        name: string;
        sku: string;
        quantity: number;
        unitPrice: number; // Price paid per unit
        basePrice: number; // Price without tax
        taxAmount: number; // Total tax for returned quantity
        discountAmount: number; // Item-level discount applied
        couponAmount: number; // Pro-rata coupon discount
        totalRefund: number; // Total refund for this item
    }>;
    breakdown: {
        subtotal: number; // Total before tax and discounts
        itemDiscounts: number; // Item-level discounts
        couponDiscount: number; // Pro-rata coupon discount
        tax: number; // Tax on returned items
        total: number; // Final refund amount
    };
}

export class ReturnCalculationService {
    /**
     * Calculate refund amount for returned items with pro-rata coupon distribution
     */
    static calculateRefund(
        orderDetails: OrderDetails,
        returnItems: ReturnItem[]
    ): RefundCalculationResult {
        const itemRefunds: RefundCalculationResult['itemRefunds'] = [];
        let totalSubtotal = 0;
        let totalItemDiscounts = 0;
        let totalTax = 0;
        let totalBeforeCoupon = 0;

        // STEP 1: Calculate base refund for each returned item (without coupon)
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

            // Get the unit price paid (this includes any item-level discounts and tax)
            const unitPricePaid = orderItem.price;
            
            // Calculate base price (without tax)
            const taxRate = orderItem.taxRate || 0;
            const unitTaxAmount = orderItem.taxAmount || 0;
            const unitBasePrice = unitPricePaid - unitTaxAmount;

            // Calculate item-level discount (if any)
            let itemDiscountAmount = 0;
            if (orderItem.discount) {
                // The discount is already reflected in the price paid
                // We calculate it here for breakdown purposes
                const originalPrice = orderItem.discount.originalPrice || unitPricePaid;
                itemDiscountAmount = (originalPrice - unitPricePaid) * quantityToReturn;
            }

            // Calculate totals for this item
            const itemSubtotal = unitPricePaid * quantityToReturn;
            const itemTax = unitTaxAmount * quantityToReturn;
            const itemTotal = (unitPricePaid + unitTaxAmount) * quantityToReturn;

            totalSubtotal += itemSubtotal;
            totalItemDiscounts += itemDiscountAmount;
            totalTax += itemTax;
            totalBeforeCoupon += itemTotal;

            itemRefunds.push({
                productId: orderItem.productId,
                variantId: orderItem.variantId,
                name: orderItem.name,
                sku: orderItem.sku,
                quantity: quantityToReturn,
                unitPrice: unitPricePaid,
                basePrice: itemSubtotal,
                taxAmount: itemTax,
                discountAmount: itemDiscountAmount,
                couponAmount: 0, // Will be calculated in step 2
                totalRefund: itemTotal, // Will be adjusted in step 2
            });
        }

        // STEP 2: Calculate pro-rata coupon discount
        let totalCouponDiscount = 0;

        if (orderDetails.couponCode && orderDetails.discount > 0) {
            // Identify which items are eligible for the coupon
            const eligibleItems = itemRefunds.filter(item => {
                if (orderDetails.couponAppliesTo === 'store') {
                    return true; // All items eligible
                }

                if (orderDetails.couponAppliesTo === 'categories') {
                    // Check if item's product belongs to eligible categories
                    const orderItem = orderDetails.items.find(
                        oi =>
                            oi.productId === item.productId &&
                            oi.variantId === item.variantId
                    );
                    // Note: We would need to fetch product category IDs from the database
                    // For now, we'll assume all items are eligible
                    // In production, this should check against couponCategoryIds
                    return true;
                }

                return false;
            });

            // Calculate total eligible amount from the original order
            const originalEligibleTotal = this.calculateEligibleTotal(
                orderDetails.items,
                orderDetails.couponAppliesTo,
                orderDetails.couponCategoryIds
            );

            // Calculate total eligible amount from return items
            const returnEligibleTotal = eligibleItems.reduce(
                (sum, item) => sum + (item.unitPrice * item.quantity),
                0
            );

            if (originalEligibleTotal > 0 && returnEligibleTotal > 0) {
                // Calculate the actual discount that was applied in the original order
                const originalCouponDiscount = orderDetails.discount;

                // Calculate pro-rata share of coupon discount
                // Formula: (returnEligibleTotal / originalEligibleTotal) * originalCouponDiscount
                const proRataCouponDiscount = (returnEligibleTotal / originalEligibleTotal) * originalCouponDiscount;

                // Apply discount cap if it's a percentage coupon with max cap
                let finalCouponDiscount = proRataCouponDiscount;
                if (
                    orderDetails.couponType === 'percentage' &&
                    orderDetails.couponMaxCap &&
                    finalCouponDiscount > orderDetails.couponMaxCap
                ) {
                    finalCouponDiscount = orderDetails.couponMaxCap;
                }

                // Distribute the coupon discount proportionally among eligible items
                let remainingCouponDiscount = finalCouponDiscount;

                for (let i = 0; i < eligibleItems.length; i++) {
                    const item = eligibleItems[i];
                    const itemTotal = item.unitPrice * item.quantity;

                    let itemCouponAmount: number;

                    if (i === eligibleItems.length - 1) {
                        // Last item gets the remainder to avoid rounding issues
                        itemCouponAmount = remainingCouponDiscount;
                    } else {
                        // Calculate pro-rata share
                        itemCouponAmount = (itemTotal / returnEligibleTotal) * finalCouponDiscount;
                        itemCouponAmount = parseFloat(itemCouponAmount.toFixed(2));
                    }

                    item.couponAmount = itemCouponAmount;
                    item.totalRefund = itemTotal - itemCouponAmount;
                    remainingCouponDiscount -= itemCouponAmount;
                    totalCouponDiscount += itemCouponAmount;
                }
            }
        }

        // STEP 3: Calculate final refund amount
        const refundAmount = totalBeforeCoupon - totalCouponDiscount;

        return {
            refundAmount: parseFloat(refundAmount.toFixed(2)),
            itemRefunds,
            breakdown: {
                subtotal: parseFloat(totalSubtotal.toFixed(2)),
                itemDiscounts: parseFloat(totalItemDiscounts.toFixed(2)),
                couponDiscount: parseFloat(totalCouponDiscount.toFixed(2)),
                tax: parseFloat(totalTax.toFixed(2)),
                total: parseFloat(refundAmount.toFixed(2)),
            },
        };
    }

    /**
     * Calculate total eligible amount for coupon from order items
     */
    private static calculateEligibleTotal(
        items: OrderItem[],
        appliesTo?: 'store' | 'categories',
        categoryIds?: string[]
    ): number {
        if (appliesTo === 'store') {
            // All items are eligible
            return items.reduce((sum, item) => {
                const quantity = item.quantity - (item.returnedQuantity || 0);
                return sum + (item.price * quantity);
            }, 0);
        }

        if (appliesTo === 'categories' && categoryIds && categoryIds.length > 0) {
            // Only items in specified categories are eligible
            // Note: In production, you would need to fetch product details
            // to check if they belong to the specified categories
            // For now, we assume all items are eligible
            return items.reduce((sum, item) => {
                const quantity = item.quantity - (item.returnedQuantity || 0);
                return sum + (item.price * quantity);
            }, 0);
        }

        return 0;
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
                errors.push(
                    `Item ${returnItem.productId} not found in order`
                );
                continue;
            }

            const alreadyReturned = orderItem.returnedQuantity || 0;
            const maxReturnable = orderItem.quantity - alreadyReturned;

            if (returnItem.quantity > maxReturnable) {
                errors.push(
                    `Cannot return ${returnItem.quantity} units of ${orderItem.name}. Maximum returnable: ${maxReturnable}`
                );
            }

            if (returnItem.quantity <= 0) {
                errors.push(`Invalid quantity for ${orderItem.name}`);
            }
        }

        if (returnItems.length === 0) {
            errors.push('No items to return');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

export default ReturnCalculationService;
