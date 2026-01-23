
import { mockCategories } from '@/mock/categories';
import { Category, Product } from '../types';
import { mockProducts } from '@/mock/products';

export const mockApi = {
    getCategories: async (): Promise<Category[]> => {
        await delay(500);
        return mockCategories;
    },

    getProducts: async (categoryId?: string, search?: string): Promise<Product[]> => {
        await delay(600);
        let filtered = mockProducts;

        if (categoryId) {
            filtered = filtered.filter(p => p.categoryIds.includes(categoryId));
        }

        if (search) {
            const lowerSearch = search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lowerSearch) ||
                p.sku.toLowerCase().includes(lowerSearch) ||
                (p.barcode && p.barcode.includes(search))
            );
        }

        return filtered;
    },

    getProductByBarcode: async (barcode: string): Promise<Product | undefined> => {
        await delay(300);
        // basic search in products and variants
        const product = mockProducts.find(p => p.barcode === barcode);
        if (product) return product;

        // Check variants
        for (const p of mockProducts) {
            if (p.variants) {
                const variant = p.variants.find(v => v.barcode === barcode);
                if (variant) return p; // Return parent product, UI will handle variant selection or auto-select
            }
        }

        return undefined;
    },

    checkout: async (orderData: unknown): Promise<{ success: boolean; orderId: string }> => {
        await delay(1500);
        console.log('Processed order:', orderData);
        return { success: true, orderId: `ORD-${Date.now()}` };
    }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
