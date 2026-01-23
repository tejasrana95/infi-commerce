import React from 'react';
import { Plus, Minus } from 'lucide-react';
import IconButton from '../atoms/IconButton';
import { cn } from '@/lib/utils';

interface QuantityControlProps {
    quantity: number;
    onIncrement: () => void;
    onDecrement: () => void;
    min?: number;
    max?: number;
    className?: string;
}

export default function QuantityControl({
    quantity,
    onIncrement,
    onDecrement,
    min = 0,
    max = 999,
    className
}: QuantityControlProps) {
    return (
        <div className={cn('flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200', className)}>
            <IconButton
                icon={<Minus className="w-3.5 h-3.5" />}
                onClick={onDecrement}
                disabled={quantity <= min}
                variant="ghost"
                size="sm"
                className="text-slate-800"
            />
            <span className="w-8 text-center text-sm font-bold text-slate-900">{quantity}</span>
            <IconButton
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={onIncrement}
                disabled={quantity >= max}
                variant="ghost"
                size="sm"
                className="text-slate-800"
            />
        </div>
    );
}
