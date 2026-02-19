import Product from '../models/Product';

export class InventoryService {
    private static async batchAdjustStock(items: any[], mode: 'reduce' | 'restore') {
        if (!items || items.length === 0) return;

        const productIds = Array.from(new Set(items.map(i => String(i.productId)).filter(Boolean)));
        if (productIds.length === 0) return;

        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map<string, any>(products.map((p: any) => [String(p._id), { ...p }]));

        for (const item of items) {
            const productId = String(item.productId || '');
            const quantity = Number(item.quantity || 0);
            if (!productId || quantity <= 0) continue;

            const product = productMap.get(productId);
            if (!product) continue;

            // Always keep sales counter in sync with order state transitions.
            if (mode === 'reduce') {
                product.salesCount = (product.salesCount || 0) + quantity;
            } else {
                product.salesCount = Math.max(0, (product.salesCount || 0) - quantity);
            }

            if (!product.manageStock) continue;

            const variantId = item.variantId ? String(item.variantId) : null;
            if (variantId && Array.isArray(product.variants) && product.variants.length > 0) {
                const variant = product.variants.find((v: any) => String(v._id) === variantId);
                if (variant) {
                    if (mode === 'reduce') {
                        variant.stock = Math.max(0, Number(variant.stock || 0) - quantity);
                    } else {
                        variant.stock = Number(variant.stock || 0) + quantity;
                    }
                }
            } else {
                if (mode === 'reduce') {
                    product.stock = Math.max(0, Number(product.stock || 0) - quantity);
                } else {
                    product.stock = Number(product.stock || 0) + quantity;
                }
            }
        }

        const ops = Array.from(productMap.values()).map((product: any) => ({
            updateOne: {
                filter: { _id: product._id },
                update: {
                    $set: {
                        salesCount: product.salesCount || 0,
                        stock: Number(product.stock || 0),
                        variants: product.variants || [],
                    },
                },
            },
        }));

        if (ops.length > 0) {
            await Product.bulkWrite(ops, { ordered: false });
        }
    }

    /**
     * Reduce stock for a list of order items
     * Handles both simple products and specific variants
     */
    static async reduceStock(items: any[]) {
        await this.batchAdjustStock(items, 'reduce');
    }

    /**
     * Restore stock for a list of order items
     * Handles both simple products and specific variants
     */
    static async restoreStock(items: any[]) {
        await this.batchAdjustStock(items, 'restore');
    }
}

export default InventoryService;
