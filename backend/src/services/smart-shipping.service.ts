/**
 * Smart Shipping Service
 * Calculates shipping with category-specific rules priority
 * Category rules > Geo rules > Universal fallback
 */

import ShippingRule from '../models/ShippingRule';
import Product from '../models/Product';
import { addPricingToProduct } from '../controllers/product.controller';

interface ShippingItem {
    productId: string;
    variantId?: string;
    quantity: number;
    price?: number;  // If not provided, will be fetched from product
    weight?: number; // If not provided, will be fetched from product
    categoryIds?: string[]; // If not provided, will be fetched from product
}

interface ItemShippingAllocation {
    productId: string;
    variantId?: string;
    quantity: number;
    shippingCostPerUnit: number;
    shippingCostTotal: number;
    ruleId: string;
    ruleName: string;
    rateType: string;
}

interface SmartShippingResult {
    totalShippingCost: number;
    itemAllocations: ItemShippingAllocation[];
    breakdown: Array<{
        ruleId: string;
        ruleName: string;
        rateType: string;
        rate: number;
        cost: number;
        itemProductIds: string[];
    }>;
}

interface ItemDetails {
    productId: string;
    variantId?: string;
    quantity: number;
    weight: number;
    price: number;
    categoryIds: string[];
}

class SmartShippingService {
    private ruleHasMatchingGeo(rule: any, country: string): boolean {
        const countryCode = String(country || '').toUpperCase();
        const zoneGroups = [
            ...(Array.isArray(rule.geoGroupIds) ? rule.geoGroupIds : []),
            ...(rule.geoGroupId ? [rule.geoGroupId] : []),
        ];

        if (zoneGroups.length === 0) return true;

        return zoneGroups.some((geoGroup: any) =>
            geoGroup?.countries && Array.isArray(geoGroup.countries) && geoGroup.countries.includes(countryCode)
        );
    }

    /**
     * Calculate shipping with category-specific rules
     */
    async calculateSmartShipping(params: {
        storeId: string;
        country: string;
        items: ShippingItem[];
    }): Promise<SmartShippingResult> {
        const { storeId, country, items } = params;

        if (!items || items.length === 0) {
            return { totalShippingCost: 0, itemAllocations: [], breakdown: [] };
        }

        // Step 1: Build item details with categories, weights, prices
        const itemDetails: ItemDetails[] = [];

        for (const item of items) {
            // Fetch product to check if it's digital
            const product = await Product.findById(item.productId);
            if (!product) continue;

            // Skip digital products - they don't require shipping
            if (product.type === 'digital') {
                continue;
            }

            let weight = item.weight ?? 0;
            let price = item.price ?? 0;
            let categoryIds = item.categoryIds ?? [];

            // Fetch product pricing if we need more info
            if (!item.price || !item.categoryIds) {
                const productWithPricing = addPricingToProduct(product.toObject());

                if (!item.weight) {
                    weight = productWithPricing.weight || 0;
                }
                if (!item.price) {
                    price = productWithPricing.salePrice || productWithPricing.price || 0;
                }
                if (!item.categoryIds) {
                    categoryIds = (product.categoryIds || []).map((id: any) => id.toString());
                }

                // Handle variant-specific values
                if (item.variantId && productWithPricing.variants?.length > 0) {
                    const variant = productWithPricing.variants.find(
                        (v: any) => v._id?.toString() === item.variantId
                    );
                    if (variant) {
                        if (variant.weight) weight = variant.weight;
                        if (variant.pricing?.salePrice || variant.salePrice || variant.price) {
                            price = variant.pricing?.salePrice || variant.salePrice || variant.price;
                        }
                    }
                }
            }

            itemDetails.push({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                weight: weight * item.quantity,
                price: price * item.quantity,
                categoryIds,
            });
        }

        // Step 2: Fetch all active shipping rules for the store
        const shippingRules = await ShippingRule.find({
            storeId,
            isActive: true,
        })
            .populate('geoGroupId')
            .populate('geoGroupIds')
            .sort({ priority: -1 });

        if (shippingRules.length === 0) {
            return { totalShippingCost: 0, itemAllocations: [], breakdown: [] };
        }

        // Step 3: Categorize rules
        interface RuleInfo {
            rule: any;
            categoryIds: string[];
            matchesGeo: boolean;
            isUniversal: boolean;
        }

        const categorizedRules: RuleInfo[] = [];

        for (const rule of shippingRules) {
            const matchesGeo = this.ruleHasMatchingGeo(rule, country);

            const ruleCategories = rule.categoryIds?.map((id: any) => id.toString()) || [];
            const hasCategories = ruleCategories.length > 0;
            const hasGeo = !!rule.geoGroupId || (Array.isArray(rule.geoGroupIds) && rule.geoGroupIds.length > 0);

            if (!hasGeo || matchesGeo) {
                categorizedRules.push({
                    rule,
                    categoryIds: ruleCategories,
                    matchesGeo,
                    isUniversal: !hasCategories && !hasGeo,
                });
            }
        }

        // Step 4: Apply rules with priority
        const itemAllocations: ItemShippingAllocation[] = [];
        const breakdown: SmartShippingResult['breakdown'] = [];
        const processedItems = new Set<number>();

        const calculateCostForItems = (itemsToProcess: ItemDetails[], rule: any): number => {
            const groupWeight = itemsToProcess.reduce((sum, item) => sum + item.weight, 0);
            const groupValue = itemsToProcess.reduce((sum, item) => sum + item.price, 0);

            let cost = 0;
            switch (rule.rateType) {
                case 'flat':
                    cost = rule.rate;
                    break;
                case 'per_kg':
                    cost = rule.rate * groupWeight;
                    break;
                case 'free':
                    cost = 0;
                    break;
                case 'percentage':
                    cost = (groupValue * rule.rate) / 100;
                    break;
            }

            // Keep parity with calculate-smart controller behavior
            if (rule.minCharge !== undefined && rule.minCharge > 0 && cost < rule.minCharge) {
                cost = rule.minCharge;
            }

            return parseFloat(cost.toFixed(2));
        };

        const allocateCostToItems = (
            itemsToProcess: ItemDetails[],
            rule: any,
            groupCost: number
        ) => {
            if (!itemsToProcess.length || groupCost <= 0) return;

            const totalQty = itemsToProcess.reduce((sum, i) => sum + i.quantity, 0);
            const totalWeight = itemsToProcess.reduce((sum, i) => sum + i.weight, 0);
            const totalValue = itemsToProcess.reduce((sum, i) => sum + i.price, 0);

            let basis: 'quantity' | 'weight' | 'value' = 'quantity';
            if (rule.rateType === 'per_kg' && totalWeight > 0) basis = 'weight';
            else if (rule.rateType === 'percentage' && totalValue > 0) basis = 'value';

            const denominator = basis === 'weight' ? totalWeight : basis === 'value' ? totalValue : totalQty;
            let remaining = groupCost;

            itemsToProcess.forEach((item, idx) => {
                const numerator = basis === 'weight' ? item.weight : basis === 'value' ? item.price : item.quantity;

                let itemShare = 0;
                if (denominator > 0) {
                    if (idx === itemsToProcess.length - 1) {
                        itemShare = parseFloat(remaining.toFixed(2));
                    } else {
                        itemShare = parseFloat(((groupCost * numerator) / denominator).toFixed(2));
                        remaining -= itemShare;
                    }
                }

                const perUnitShare = item.quantity > 0 ? parseFloat((itemShare / item.quantity).toFixed(4)) : 0;

                itemAllocations.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    shippingCostPerUnit: perUnitShare,
                    shippingCostTotal: itemShare,
                    ruleId: rule._id.toString(),
                    ruleName: rule.name,
                    rateType: rule.rateType,
                });
            });
        };

        // Priority 1: Category-specific rules
        const categoryRules = categorizedRules.filter(r => r.categoryIds.length > 0);

        for (const ruleInfo of categoryRules) {
            const matchingItems: { item: ItemDetails; index: number }[] = [];

            itemDetails.forEach((item, idx) => {
                if (processedItems.has(idx)) return;

                const hasMatchingCategory = item.categoryIds.some(catId =>
                    ruleInfo.categoryIds.includes(catId)
                );

                if (hasMatchingCategory) {
                    matchingItems.push({ item, index: idx });
                }
            });

            if (matchingItems.length > 0) {
                const itemsToProcess = matchingItems.map(m => m.item);
                const cost = calculateCostForItems(itemsToProcess, ruleInfo.rule);

                allocateCostToItems(itemsToProcess, ruleInfo.rule, cost);

                breakdown.push({
                    ruleId: ruleInfo.rule._id.toString(),
                    ruleName: ruleInfo.rule.name,
                    rateType: ruleInfo.rule.rateType,
                    rate: ruleInfo.rule.rate,
                    cost,
                    itemProductIds: itemsToProcess.map(i => i.productId),
                });

                matchingItems.forEach(m => processedItems.add(m.index));
            }
        }

        // Priority 2: Geo-based rules
        const geoRules = categorizedRules.filter(r => r.categoryIds.length === 0 && r.matchesGeo && !r.isUniversal);
        const remainingItems = itemDetails.filter((_, idx) => !processedItems.has(idx));

        if (remainingItems.length > 0 && geoRules.length > 0) {
            const geoRule = geoRules[0];
            const cost = calculateCostForItems(remainingItems, geoRule.rule);

            allocateCostToItems(remainingItems, geoRule.rule, cost);

            breakdown.push({
                ruleId: geoRule.rule._id.toString(),
                ruleName: geoRule.rule.name,
                rateType: geoRule.rule.rateType,
                rate: geoRule.rule.rate,
                cost,
                itemProductIds: remainingItems.map(i => i.productId),
            });

            remainingItems.forEach((item) => {
                const originalIdx = itemDetails.findIndex(d => d === item);
                processedItems.add(originalIdx);
            });
        }

        // Priority 3: Universal fallback
        const stillRemaining = itemDetails.filter((_, idx) => !processedItems.has(idx));
        const universalRules = categorizedRules.filter(r => r.isUniversal);

        if (stillRemaining.length > 0 && universalRules.length > 0) {
            const universalRule = universalRules[0];
            const cost = calculateCostForItems(stillRemaining, universalRule.rule);

            allocateCostToItems(stillRemaining, universalRule.rule, cost);

            breakdown.push({
                ruleId: universalRule.rule._id.toString(),
                ruleName: universalRule.rule.name,
                rateType: universalRule.rule.rateType,
                rate: universalRule.rule.rate,
                cost,
                itemProductIds: stillRemaining.map(i => i.productId),
            });
        }

        const totalShippingCost = breakdown.reduce((sum, b) => sum + b.cost, 0);

        return {
            totalShippingCost: parseFloat(totalShippingCost.toFixed(2)),
            itemAllocations,
            breakdown,
        };
    }
}

export default new SmartShippingService();
