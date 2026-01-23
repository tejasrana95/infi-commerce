import React from 'react';
import { cn } from '@/lib/utils';

interface PaymentMethodCardProps {
    icon: React.ReactNode;
    label: string;
    selected: boolean;
    onClick: () => void;
}

export default function PaymentMethodCard({ icon, label, selected, onClick }: PaymentMethodCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all',
                selected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md'
                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            )}
        >
            {icon}
            <span className="font-bold">{label}</span>
        </button>
    );
}
