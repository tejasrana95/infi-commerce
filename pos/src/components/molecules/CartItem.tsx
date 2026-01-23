import React from 'react';
import { CartItem as CartItemType } from '@/types';
import { Trash2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import QuantityControl from './QuantityControl';
import IconButton from '../atoms/IconButton';

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const { formatPrice } = useCurrency();
    return (
        <div className="bg-white p-3 rounded-xl border shadow-sm flex gap-3 group">
            {/* Product Image */}
            <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden relative">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">
                        {item.name}
                    </h4>
                    <span className="font-bold text-sm text-slate-900">
                        {formatPrice(item.basePrice * item.quantity)}
                    </span>
                </div>
                <p className="text-xs text-slate-600 truncate">
                    {item.sku} {item.attributes && `• ${Object.values(item.attributes).join(', ')}`}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-between mt-2">
                    <QuantityControl
                        quantity={item.quantity}
                        onIncrement={() => onUpdateQuantity(item.quantity + 1)}
                        onDecrement={() => onUpdateQuantity(item.quantity - 1)}
                        min={1}
                    />

                    <IconButton
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={onRemove}
                        variant="ghost"
                        className="text-red-700 hover:text-red-700 hover:bg-red-50 opacity-100"
                    />
                </div>
            </div>
        </div>
    );
}
