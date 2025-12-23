/**
 * Pricing Utilities
 * Centralized pricing calculations for products, orders, and invoices
 * 
 * Calculation Order: Base Price → Sale Price → Promotional Discount → Tax
 */

export interface PricingInput {
    regularPrice: number;
    salePrice?: number;
    promoDiscount?: {
        type: 'percentage' | 'fixed';
        value: number;
    };
    taxRate?: number;           // Total tax percentage (e.g., 18)
    quantity?: number;
}

export interface TaxBreakdownItem {
    name: string;
    rate: number;
    amount: number;
}

export interface PricingResult {
    // Per unit prices
    unitPrice: number;          // Base price before any discounts
    unitDiscountedPrice: number; // After sale price and promo
    unitTaxAmount: number;
    unitFinalPrice: number;     // Discounted + tax

    // Total prices (multiplied by quantity)
    subtotal: number;           // Discounted price × quantity
    taxAmount: number;          // Total tax
    total: number;              // Final total

    // Discount breakdown
    discount: {
        saleDiscount: number;   // Difference from sale price
        promoDiscount: number;  // From promotional discount
        totalDiscount: number;
    };

    // Meta
    quantity: number;
    taxRate: number;
}

/**
 * Calculate pricing for a product
 * Tax is optional - if not provided, taxAmount will be 0
 */
export function calculatePricing(input: PricingInput): PricingResult {
    const {
        regularPrice,
        salePrice,
        promoDiscount,
        taxRate = 0,
        quantity = 1,
    } = input;

    // Step 1: Determine base price (sale price if available, otherwise regular)
    const unitPrice = regularPrice;
    let priceAfterSale = salePrice && salePrice < regularPrice ? salePrice : regularPrice;
    const saleDiscount = regularPrice - priceAfterSale;

    // Step 2: Apply promotional discount
    let priceAfterPromo = priceAfterSale;
    let promoDiscountAmount = 0;

    if (promoDiscount && promoDiscount.value > 0) {
        if (promoDiscount.type === 'percentage') {
            promoDiscountAmount = (priceAfterSale * promoDiscount.value) / 100;
        } else {
            promoDiscountAmount = Math.min(promoDiscount.value, priceAfterSale);
        }
        priceAfterPromo = priceAfterSale - promoDiscountAmount;
    }

    const unitDiscountedPrice = Math.max(0, priceAfterPromo);

    // Step 3: Calculate tax (on discounted price)
    const unitTaxAmount = taxRate > 0 ? (unitDiscountedPrice * taxRate) / 100 : 0;
    const unitFinalPrice = unitDiscountedPrice + unitTaxAmount;

    // Step 4: Calculate totals
    const subtotal = unitDiscountedPrice * quantity;
    const taxAmount = unitTaxAmount * quantity;
    const total = unitFinalPrice * quantity;

    return {
        unitPrice,
        unitDiscountedPrice,
        unitTaxAmount,
        unitFinalPrice,
        subtotal,
        taxAmount,
        total,
        discount: {
            saleDiscount: saleDiscount * quantity,
            promoDiscount: promoDiscountAmount * quantity,
            totalDiscount: (saleDiscount + promoDiscountAmount) * quantity,
        },
        quantity,
        taxRate,
    };
}

/**
 * Calculate tax breakdown for split taxes
 */
export function calculateTaxBreakdown(
    amount: number,
    subTaxes: Array<{ name: string; rate: number }>
): TaxBreakdownItem[] {
    return subTaxes.map((subTax) => ({
        name: subTax.name,
        rate: subTax.rate,
        amount: (amount * subTax.rate) / 100,
    }));
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currencySymbol: string = '₹'): string {
    return `${currencySymbol}${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
