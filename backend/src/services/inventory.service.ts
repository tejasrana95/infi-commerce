import Product from '../models/Product';

export class InventoryService {
    /**
     * Reduce stock for a list of order items
     * Handles both simple products and specific variants
     */
    static async reduceStock(items: any[]) {
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.manageStock) continue;

            if (item.variantId && product.variants && product.variants.length > 0) {
                // Handle variant stock
                const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
                if (variant) {
                    variant.stock = Math.max(0, (variant.stock || 0) - item.quantity);
                }
            } else {
                // Handle simple product stock
                product.stock = Math.max(0, product.stock - item.quantity);
            }

            await product.save();
        }
    }

    /**
     * Restore stock for a list of order items
     * Handles both simple products and specific variants
     */
    static async restoreStock(items: any[]) {
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.manageStock) continue;

            if (item.variantId && product.variants && product.variants.length > 0) {
                // Handle variant stock
                const variant = product.variants.find((v: any) => v._id.toString() === item.variantId);
                if (variant) {
                    variant.stock = (variant.stock || 0) + item.quantity;
                }
            } else {
                // Handle simple product stock
                product.stock = product.stock + item.quantity;
            }

            await product.save();
        }
    }
}

export default InventoryService;
