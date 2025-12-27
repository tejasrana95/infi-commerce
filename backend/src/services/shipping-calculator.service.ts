import ShippingRule from '../models/ShippingRule';
import Product from '../models/Product';
import mongoose from 'mongoose';

interface ShippingCalculationParams {
    storeId: string;
    items: Array<{
        productId: string;
        quantity: number;
    }>;
    destination: {
        country: string;
        state?: string;
        city?: string;
    };
    subtotal: number;
}

interface ShippingResult {
    cost: number;
    ruleName: string;
    ruleId: string;
}

export class ShippingCalculatorService {
    /**
     * Calculate shipping cost based on rules
     * Uses geoGroupId for country matching (consistent with calculate-smart)
     */
    async calculateShipping(params: ShippingCalculationParams): Promise<ShippingResult> {
        const { storeId, items, destination, subtotal } = params;

        // Get all products to calculate total weight and categories
        const productIds = items.map((item) => item.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            storeId: new mongoose.Types.ObjectId(storeId),
        });

        // Calculate total weight and collect categories
        let totalWeight = 0;
        const categoryIds = new Set<string>();

        items.forEach((item) => {
            const product = products.find((p) => p._id.toString() === item.productId);
            if (product) {
                totalWeight += (product.weight || 0) * item.quantity;
                product.categoryIds.forEach((catId) => categoryIds.add(catId.toString()));
            }
        });

        // Get applicable shipping rules with geoGroupId populated (sorted by priority)
        const rules = await ShippingRule.find({
            storeId: new mongoose.Types.ObjectId(storeId),
            isActive: true,
        })
            .populate('geoGroupId')
            .sort({ priority: -1 });

        // Find the first matching rule
        for (const rule of rules) {
            if (this.isRuleApplicable(rule, destination, totalWeight, subtotal, Array.from(categoryIds))) {
                const cost = this.calculateCost(rule, totalWeight, subtotal);

                return {
                    cost,
                    ruleName: rule.name,
                    ruleId: rule._id.toString(),
                };
            }
        }

        // No rule found - return default shipping
        return {
            cost: 0,
            ruleName: 'No shipping rule found',
            ruleId: '',
        };
    }

    /**
     * Check if a rule is applicable based on conditions
     * Uses geoGroupId for country matching
     */
    private isRuleApplicable(
        rule: any,
        destination: { country: string; state?: string; city?: string },
        totalWeight: number,
        subtotal: number,
        categoryIds: string[]
    ): boolean {
        // Check geo matching using geoGroupId (same as calculate-smart)
        if (rule.geoGroupId) {
            const geoGroup = rule.geoGroupId as any;
            if (geoGroup.countries && geoGroup.countries.length > 0) {
                if (!geoGroup.countries.includes(destination.country.toUpperCase())) {
                    return false;
                }
            }
        }

        // Check categories
        if (rule.categoryIds && rule.categoryIds.length > 0) {
            const ruleCategoryIds = rule.categoryIds.map((id: any) => id.toString());
            const hasMatchingCategory = categoryIds.some(catId => ruleCategoryIds.includes(catId));
            if (!hasMatchingCategory) {
                return false;
            }
        }

        // Check weight range
        if (rule.minWeight !== undefined && totalWeight < rule.minWeight) {
            return false;
        }
        if (rule.maxWeight !== undefined && totalWeight > rule.maxWeight) {
            return false;
        }

        // Check order value range
        if (rule.minOrderValue !== undefined && subtotal < rule.minOrderValue) {
            return false;
        }
        if (rule.maxOrderValue !== undefined && subtotal > rule.maxOrderValue) {
            return false;
        }

        return true;
    }

    /**
     * Calculate shipping cost based on rule type
     */
    private calculateCost(rule: any, totalWeight: number, subtotal: number): number {
        switch (rule.rateType) {
            case 'free':
                return 0;

            case 'flat':
                return rule.rate;

            case 'per_kg':
                return rule.rate * totalWeight;

            case 'percentage':
                return (subtotal * rule.rate) / 100;

            default:
                return 0;
        }
    }
}

export default new ShippingCalculatorService();
