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
    currency: string;
    ruleName: string;
    ruleId: string;
}

export class ShippingCalculatorService {
    /**
     * Calculate shipping cost based on rules
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

        // Get applicable shipping rules (sorted by priority)
        const rules = await ShippingRule.find({
            storeId: new mongoose.Types.ObjectId(storeId),
            isActive: true,
        }).sort({ priority: -1 });

        // Find the first matching rule
        for (const rule of rules) {
            if (this.isRuleApplicable(rule, destination, totalWeight, subtotal, Array.from(categoryIds))) {
                const cost = this.calculateCost(rule, totalWeight, subtotal);

                return {
                    cost,
                    currency: rule.currency,
                    ruleName: rule.name,
                    ruleId: rule._id.toString(),
                };
            }
        }

        // No rule found - return default shipping
        return {
            cost: 0,
            currency: 'USD',
            ruleName: 'No shipping rule found',
            ruleId: '',
        };
    }

    /**
     * Check if a rule is applicable based on conditions
     */
    private isRuleApplicable(
        rule: any,
        destination: { country: string; state?: string; city?: string },
        totalWeight: number,
        subtotal: number,
        categoryIds: string[]
    ): boolean {
        const { conditions } = rule;

        // Check country
        if (conditions.countries && conditions.countries.length > 0) {
            if (!conditions.countries.includes(destination.country)) {
                return false;
            }
        }

        // Check state
        if (conditions.states && conditions.states.length > 0) {
            if (!destination.state || !conditions.states.includes(destination.state)) {
                return false;
            }
        }

        // Check city
        if (conditions.cities && conditions.cities.length > 0) {
            if (!destination.city || !conditions.cities.includes(destination.city)) {
                return false;
            }
        }

        // Check categories
        if (conditions.categoryIds && conditions.categoryIds.length > 0) {
            const hasMatchingCategory = conditions.categoryIds.some((catId: any) =>
                categoryIds.includes(catId.toString())
            );
            if (!hasMatchingCategory) {
                return false;
            }
        }

        // Check weight range
        if (conditions.minWeight !== undefined && totalWeight < conditions.minWeight) {
            return false;
        }
        if (conditions.maxWeight !== undefined && totalWeight > conditions.maxWeight) {
            return false;
        }

        // Check order value range
        if (conditions.minOrderValue !== undefined && subtotal < conditions.minOrderValue) {
            return false;
        }
        if (conditions.maxOrderValue !== undefined && subtotal > conditions.maxOrderValue) {
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
