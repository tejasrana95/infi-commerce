export interface ShippingRule {
    _id: string;
    name: string;
    description?: string;
    geoGroup?: string;
    minWeight?: number;
    maxWeight?: number;
    minOrderValue?: number;
    maxOrderValue?: number;
    shippingCost: number;
    estimatedDays?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
