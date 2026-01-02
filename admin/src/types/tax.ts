export interface SubTax {
    name: string;
    rate: number;
}

export interface TaxRate {
    _id: string;
    name: string;
    rate: number;
    isSplit: boolean;
    subTaxes?: SubTax[];
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
