/**
 * Common constants used across the frontend application
 */

// Stock status display labels
export const STOCK_STATUS_LABELS: Record<string, string> = {
    'in_stock': 'In Stock',
    'out_of_stock': 'Out of Stock',
    'low_stock': 'Low Stock',
    'pre_order': 'Pre Order',
    'backorder': 'Backorder',
    'made_to_order': 'Made to Order',
};

// Helper function to format stock status
export const formatStockStatus = (status: string): string => {
    return STOCK_STATUS_LABELS[status] || status;
};

export const REFUND_METHODS: Record<string, string> = {
    bank_transfer: 'Bank Transfer',
    original_payment: 'Original Payment Method'
}