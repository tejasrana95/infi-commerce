'use client';

import React from 'react';
import MetricsSummaryWidget from './MetricsSummaryWidget';
import RevenueTrendWidget from './RevenueTrendWidget';
import StatusDistributionWidget from './StatusDistributionWidget';
import RecentOrdersWidget from './RecentOrdersWidget';
import TopProductsWidget from './TopProductsWidget';
import LowStockWidget from './LowStockWidget';
import LatestCustomersWidget from './LatestCustomersWidget';
import NotificationQueueWidget from './NotificationQueueWidget';
import SystemHealthWidget from './SystemHealthWidget';

interface WidgetRendererProps {
    widgetId: string;
    storeId: string;
    userRole?: string;
}

export default function WidgetRenderer({ widgetId, storeId, userRole }: WidgetRendererProps) {
    switch (widgetId) {
        case 'metrics_summary':
            return <MetricsSummaryWidget storeId={storeId} />;
        case 'revenue_trend':
            return <RevenueTrendWidget storeId={storeId} />;
        case 'status_distribution':
            return <StatusDistributionWidget storeId={storeId} />;
        case 'recent_orders':
            return <RecentOrdersWidget storeId={storeId} />;
        case 'top_products':
            return <TopProductsWidget storeId={storeId} />;
        case 'low_stock':
            return <LowStockWidget storeId={storeId} />;
        case 'latest_customers':
            return <LatestCustomersWidget />;
        case 'notification_queue':
            if (userRole !== 'super_admin') return null;
            return <NotificationQueueWidget />;
        case 'system_health':
            if (userRole !== 'super_admin') return null;
            return <SystemHealthWidget />;
        default:
            return null;
    }
}
