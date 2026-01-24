import React from 'react';
import { Order } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import StatusBadge from '../atoms/StatusBadge';
import { Calendar, User, CreditCard, Banknote, QrCode } from 'lucide-react';

interface OrderCardProps {
    order: Order;
    onClick: () => void;
}

const paymentIcons = {
    cash: Banknote,
    card: CreditCard,
    upi: QrCode
};

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const { formatPrice } = useCurrency();
    const PaymentIcon = paymentIcons[order.paymentMethod];
    return (
        <button
            onClick={onClick}
            className="w-full bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all text-left"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="font-bold text-slate-900">{order.orderNumber}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.date).toLocaleString()}</span>
                    </div>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {/* Customer */}
            <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                <User className="w-4 h-4 text-slate-400" />
                <span>{order.customerId ? order.customerId?.firstName + ' ' + order.customerId?.lastName : 'Walk-in Customer'}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                    <PaymentIcon className="w-4 h-4" />
                    <span className="text-xs capitalize">{order.paymentMethod}</span>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500">{order.items.length} item(s)</div>
                    <div className="text-lg font-bold text-blue-600">{formatPrice(order.total)}</div>
                </div>
            </div>
        </button>
    );
}
