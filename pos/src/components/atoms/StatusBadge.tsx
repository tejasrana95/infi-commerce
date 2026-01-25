import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus } from '@/types';

interface StatusBadgeProps {
    status: OrderStatus;
    className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-700 border-green-200'
    },
    delivered: {
        label: 'Delivered',
        className: 'bg-green-100 text-green-700 border-green-200'
    },
    pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    refunded: {
        label: 'Refunded',
        className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    returned: {
        label: 'Returned',
        className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    partially_returned: {
        label: 'Partially Returned',
        className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={cn(
                'px-2 py-0.5 text-xs font-medium rounded-full border inline-block',
                config?.className,
                className
            )}
        >
            {config?.label}
        </span>
    );
}
