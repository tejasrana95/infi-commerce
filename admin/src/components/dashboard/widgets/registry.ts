export interface WidgetDefinition {
    id: string;
    title: string;
    description: string;
    category: 'analytics' | 'orders' | 'inventory' | 'customers' | 'system';
    gridSize: { xs: number; sm?: number; md?: number; lg: number };
    requiredRole?: 'super_admin' | 'admin';
    defaultEnabled: boolean;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
    metrics_summary: {
        id: 'metrics_summary',
        title: 'Key Metrics Summary',
        description: 'High-level overview of revenue, orders, customers, products, low stock, and reviews.',
        category: 'analytics',
        gridSize: { xs: 12, lg: 12 },
        defaultEnabled: true,
    },
    revenue_trend: {
        id: 'revenue_trend',
        title: 'Revenue Trend',
        description: 'Interactive area chart showing sales and revenue trends over selected timeframes.',
        category: 'analytics',
        gridSize: { xs: 12, lg: 8 },
        defaultEnabled: true,
    },
    status_distribution: {
        id: 'status_distribution',
        title: 'Order Status Distribution',
        description: 'Pie chart breakdown of orders by current order status.',
        category: 'orders',
        gridSize: { xs: 12, lg: 4 },
        defaultEnabled: true,
    },
    recent_orders: {
        id: 'recent_orders',
        title: 'Recent Orders',
        description: 'Table showing the 5 most recent customer orders.',
        category: 'orders',
        gridSize: { xs: 12, lg: 7 },
        defaultEnabled: true,
    },
    top_products: {
        id: 'top_products',
        title: 'Top Selling Products',
        description: 'List of top 5 best-performing products by sales volume.',
        category: 'inventory',
        gridSize: { xs: 12, lg: 5 },
        defaultEnabled: true,
    },
    low_stock: {
        id: 'low_stock',
        title: 'Low Stock Alert',
        description: 'List of products running low on stock requiring restock attention.',
        category: 'inventory',
        gridSize: { xs: 12, lg: 6 },
        defaultEnabled: true,
    },
    latest_customers: {
        id: 'latest_customers',
        title: 'Latest Registered Customers',
        description: 'List of the newest 20 customer signups with order totals.',
        category: 'customers',
        gridSize: { xs: 12, lg: 6 },
        defaultEnabled: true,
    },
    notification_queue: {
        id: 'notification_queue',
        title: 'Notification Queue Status',
        description: 'Status overview of pending, sent, and failed notifications (Super Admin only).',
        category: 'system',
        gridSize: { xs: 12, lg: 6 },
        requiredRole: 'super_admin',
        defaultEnabled: true,
    },
    system_health: {
        id: 'system_health',
        title: 'System Health & Performance',
        description: 'Real-time CPU & Memory usage metrics with 10s auto-refresh (Super Admin only).',
        category: 'system',
        gridSize: { xs: 12, lg: 6 },
        requiredRole: 'super_admin',
        defaultEnabled: true,
    },
};

export const DEFAULT_WIDGET_ORDER = [
    'metrics_summary',
    'revenue_trend',
    'status_distribution',
    'recent_orders',
    'top_products',
    'low_stock',
    'latest_customers',
    'notification_queue',
    'system_health',
];

export function getAvailableWidgets(userRole?: string): WidgetDefinition[] {
    return Object.values(WIDGET_REGISTRY).filter((widget) => {
        if (!widget.requiredRole) return true;
        if (widget.requiredRole === 'super_admin') return userRole === 'super_admin';
        return true;
    });
}
