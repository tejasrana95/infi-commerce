import { create } from 'zustand';
import { CartItem, Product, ProductVariant, Customer } from '../types';
import { sounds } from '../utils/sounds';

interface CartState {
    items: CartItem[];
    customer: Customer | null;
    addToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    setCustomer: (customer: Customer | null) => void;
    getTotal: () => number;
    getSubtotal: () => number;
    getTaxTotal: () => number;
    getItemCount: () => number;
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

            // Determine price and tax info
            const price = Number(variant ? variant.price : (product.salePrice || product.price)) || 0;
            const taxRate = Number(product.taxRate ?? 0);
            let unitTaxAmount = Number(product.taxAmount ?? 0);

            // Fallback calculation if taxAmount is 0 but rate is present
            if (unitTaxAmount === 0 && taxRate > 0) {
                unitTaxAmount = price - (price / (1 + (taxRate / 100)));
            }

            const basePrice = price - unitTaxAmount;

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
                        price, // Inclusive price
                        quantity,
                        image,
                        attributes: variant?.attributes,
                        taxRate,
                        taxAmount: unitTaxAmount,
                        basePrice,
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

    clearCart: () => set({ items: [], customer: null }),

    setCustomer: (customer) => set({ customer }),

    getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    },

    getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.basePrice * item.quantity, 0);
    },

    getTaxTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.taxAmount * item.quantity, 0);
    },

    getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
    },
}));
