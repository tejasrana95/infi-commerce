import { create } from 'zustand';
import { CartItem, Product, ProductVariant, Customer } from '../types';
import { sounds } from '../utils/sounds';

interface CartState {
    items: CartItem[];
    customer: Customer | null;
    addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    applyDiscount: (cartId: string, discountAmount: number | null, discountType?: 'fixed' | 'percentage') => void;
    clearCart: () => void;
    setCustomer: (customer: Customer | null) => void;
    getTotal: () => number;
    getSubtotal: () => number;
    getTaxTotal: () => number;
    getItemCount: () => number;
    getCartItemTotal: (item: CartItem) => number;
}

// Helper to check if sound is enabled
const isSoundEnabled = (): boolean => {
    try {
        const stored = localStorage.getItem('settings-storage');
        if (stored) {
            const settings = JSON.parse(stored);
            return settings.state?.soundEnabled ?? true;
        }
    } catch {
        return true;
    }
    return true;
};

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customer: null,

    addToCart: (product, variant, quantity = 1) => {
        set((state) => {
            const existingItemIndex = state.items.findIndex(
                (item) => item.productId === product.id && item.variantId === (variant?.id || undefined)
            );

            // Use pricing object for tax-inclusive prices (consistent with frontend)
            // Priority: variant.pricing > product.pricing > fallback calculation
            const variantPricing = variant?.pricing;
            const productPricing = product.pricing;
            const pricing = variantPricing || productPricing;

            // Get tax-inclusive price (finalPrice is the sale price with tax if on sale, otherwise priceWithTax)
            const priceWithTax = Number(pricing?.finalPrice ?? variant?.price ?? product.salePrice ?? product.price) || 0;
            const taxRate = Number(pricing?.taxRate ?? variant?.taxRate ?? product.taxRate ?? 0);
            let unitTaxAmount = Number(pricing?.taxAmount ?? variant?.taxAmount ?? product.taxAmount ?? 0);

            // Calculate basePrice (price without tax)
            // If we have pricing object, use price field; otherwise calculate from inclusive price
            let basePrice: number;
            if (pricing?.price !== undefined) {
                basePrice = Number(pricing.price);
                // Recalculate tax amount based on whether it's on sale
                if (pricing.isOnSale && pricing.salePrice !== undefined) {
                    basePrice = Number(pricing.salePrice);
                    unitTaxAmount = priceWithTax - basePrice;
                }
            } else {
                // Fallback: calculate basePrice from inclusive price
                if (unitTaxAmount === 0 && taxRate > 0) {
                    unitTaxAmount = priceWithTax - (priceWithTax / (1 + (taxRate / 100)));
                }
                basePrice = priceWithTax - unitTaxAmount;
            }

            const sku = variant ? variant.sku : product.sku;
            const name = product.name;
            const image = variant?.image || product.image;

            let newItems;

            if (existingItemIndex > -1) {
                // Update existing item immutably
                newItems = state.items.map((item, index) =>
                    index === existingItemIndex
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                // Add new item
                newItems = [
                    ...state.items,
                    {
                        cartId: `${product.id}-${variant?.id || 'simple'}-${Date.now()}`,
                        productId: product.id,
                        variantId: variant?.id,
                        name,
                        sku,
                        price: priceWithTax,    // Store the tax-inclusive price
                        quantity,
                        image,
                        attributes: variant?.attributes,
                        taxRate,
                        taxAmount: unitTaxAmount,
                        basePrice,              // Price without tax
                    }
                ];
            }

            // Play sound if enabled
            if (isSoundEnabled()) {
                sounds.addToCart();
            }

            return { items: newItems };
        });
    },

    removeFromCart: (cartId) => {
        set((state) => {
            // Play sound if enabled
            if (isSoundEnabled()) {
                sounds.removeFromCart();
            }

            return {
                items: state.items.filter((item) => item.cartId !== cartId),
            };
        });
    },

    updateQuantity: (cartId, quantity) => {
        set((state) => {
            if (quantity <= 0) {
                // Play remove sound
                if (isSoundEnabled()) {
                    sounds.removeFromCart();
                }
                return { items: state.items.filter((item) => item.cartId !== cartId) };
            }
            return {
                items: state.items.map((item) =>
                    item.cartId === cartId ? { ...item, quantity } : item
                ),
            };
        });
    },

    applyDiscount: (cartId, discountAmount, discountType = 'fixed') => {
        set((state) => {
            return {
                items: state.items.map((item) =>
                    item.cartId === cartId 
                        ? { 
                            ...item, 
                            discountAmount: discountAmount || undefined,
                            discountType: discountAmount ? discountType : undefined
                          }
                        : item
                ),
            };
        });
    },

    clearCart: () => set({ items: [], customer: null }),

    setCustomer: (customer) => set({ customer }),

    getCartItemTotal: (item: CartItem) => {
        // Start with base price (excluding tax)
        let unitPrice = item.basePrice;
        
        // Apply discount if any
        if (item.discountAmount) {
            if (item.discountType === 'percentage') {
                // For percentage: discount = price * (discountAmount / 100)
                unitPrice -= (unitPrice * item.discountAmount) / 100;
            } else {
                // For fixed: just subtract the amount
                unitPrice -= item.discountAmount;
            }
        }
        
        // Add tax (calculated on discounted price)
        const tax = unitPrice * (item.taxRate / 100);
        const finalPrice = unitPrice + tax;
        
        return Math.max(0, finalPrice * item.quantity);
    },

    getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
            const { getCartItemTotal } = get();
            return total + getCartItemTotal(item);
        }, 0);
    },

    getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
            // Start with base price (excluding tax)
            let unitPrice = item.basePrice;
            
            // Apply discount if any
            if (item.discountAmount) {
                if (item.discountType === 'percentage') {
                    unitPrice -= (unitPrice * item.discountAmount) / 100;
                } else {
                    unitPrice -= item.discountAmount;
                }
            }
            
            return total + Math.max(0, unitPrice * item.quantity);
        }, 0);
    },

    getTaxTotal: () => {
        const { items } = get();
        
        // Calculate tax per item considering discounts
        const totalTax = items.reduce((sum, item) => {
            let unitPrice = item.basePrice;
            
            // Apply discount if any
            if (item.discountAmount) {
                if (item.discountType === 'percentage') {
                    unitPrice -= (unitPrice * item.discountAmount) / 100;
                } else {
                    unitPrice -= item.discountAmount;
                }
            }
            
            // Calculate tax on discounted price
            const itemTax = unitPrice * (item.taxRate / 100);
            return sum + (itemTax * item.quantity);
        }, 0);
        
        return Math.max(0, totalTax);
    },

    getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
    },
}));
