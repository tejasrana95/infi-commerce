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
    rateType: string;
    rate: number;
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

        // Calculate total weight and collect categories (exclude digital products)
        let totalWeight = 0;
        const categoryIds = new Set<string>();

        items.forEach((item) => {
            const product = products.find((p) => p._id.toString() === item.productId);
            if (product) {
                // Skip digital products - they don't require shipping
                if (product.type === 'digital') {
                    return;
                }
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
                    rateType: rule.rateType,
                    rate: rule.rate,
                };
            }
        }

        // No rule found - return default shipping
        return {
            cost: 0,
            ruleName: 'No shipping rule found',
            ruleId: '',
            rateType: 'free',
            rate: 0,
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
     * Applies minimum charge if calculated cost is below it
     */
    private calculateCost(rule: any, totalWeight: number, subtotal: number): number {
        let cost = 0;
        
        switch (rule.rateType) {
            case 'free':
                cost = 0;
                break;

            case 'flat':
                cost = rule.rate;
                break;

            case 'per_kg':
                cost = rule.rate * totalWeight;
                break;

            case 'percentage':
                cost = (subtotal * rule.rate) / 100;
                break;

            default:
                cost = 0;
        }

        // Apply minimum charge if specified and cost is below it
        if (rule.minCharge !== undefined && rule.minCharge > 0 && cost < rule.minCharge) {
            return rule.minCharge;
        }

        return cost;
    }
}

export default new ShippingCalculatorService();
