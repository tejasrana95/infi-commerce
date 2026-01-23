import React from 'react';
import { Customer } from '@/types';
import Avatar from '../atoms/Avatar';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CustomerCardProps {
    customer: Customer;
    onClick: () => void;
}

export default function CustomerCard({ customer, onClick }: CustomerCardProps) {
    const { formatPrice } = useCurrency();

    return (
        <button
            onClick={onClick}
            className="w-full text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
        >
            <Avatar name={customer.name} size="md" className="group-hover:bg-blue-200" />

            <div className="flex-1">
                <div className="font-bold text-slate-900">{customer.name}</div>
                <div className="text-xs text-slate-600 flex gap-2">
                    {customer.phone && <span>{customer.phone}</span>}
                    {customer.email && <span>• {customer.email}</span>}
                </div>
            </div>

            <div className="text-right">
                <div className="text-xs font-bold text-slate-700">{customer.totalOrders} Orders</div>
                <div className="text-xs text-slate-600">{formatPrice(customer.totalSpent)}</div>
            </div>
        </button>
    );
}
