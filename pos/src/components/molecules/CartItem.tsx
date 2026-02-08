import React, { useState } from 'react';
import { CartItem as CartItemType } from '@/types';
import { Trash2, Tag } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePOSPermissions } from '@/hooks/usePOSPermissions';
import QuantityControl from './QuantityControl';
import IconButton from '../atoms/IconButton';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';

interface CartItemProps {
    item: CartItemType;
    onUpdateQuantity: (quantity: number) => void;
    onRemove: () => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const { formatPrice } = useCurrency();
    const { canApplyDiscount } = usePOSPermissions();
    const { applyDiscount } = useCartStore();
    const [showDiscount, setShowDiscount] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<string>(item.discountAmount?.toString() || '');
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(item.discountType || 'fixed');
    const handleApplyDiscount = () => {
        if (discountAmount) {
            applyDiscount(item.cartId, parseFloat(discountAmount), discountType);
            setShowDiscount(false);
        }
    };

    const handleRemoveDiscount = () => {
        applyDiscount(item.cartId, null);
        setDiscountAmount('');
        setShowDiscount(false);
    };

    // Calculate effective price with discount
    let effectivePrice = item.basePrice;
    if (item.discountAmount) {
        if (item.discountType === 'percentage') {
            effectivePrice -= (item.basePrice * item.discountAmount) / 100;
        } else {
            effectivePrice -= item.discountAmount;
        }
    }
    // Add tax
    const totalPrice = effectivePrice + (effectivePrice * item.taxRate / 100);
    return (
        <div className="bg-white p-3 rounded-xl border shadow-sm flex flex-col gap-3 group">
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden relative">
                    <Image width={56} height={56} src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">
                            {item.name}
                        </h4>
                        <span className="font-bold text-sm text-slate-900 text-right">
                            {(item.discountAmount || item.originalPrice) ? (
                                <>
                                    <div className="text-xs text-slate-400 line-through">
                                        {formatPrice((item.originalPrice ?? item.price) * item.quantity)}
                                    </div>
                                    <div className="text-green-600">
                                        {formatPrice(totalPrice * item.quantity)}
                                    </div>
                                </>
                            ) : (
                                formatPrice(totalPrice * item.quantity)
                            )}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                        {item.sku} {item.attributes && `• ${Object.values(item.attributes).join(', ')}`}
                    </p>

                    {/* Discount Info */}
                    {item.discountAmount && (
                        <div className="text-xs text-amber-600 mt-1">
                            Discount: {item.discountType === 'percentage'
                                ? `${item.discountAmount}%`
                                : formatPrice(item.discountAmount)
                            }
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex items-center justify-between mt-2">
                        <QuantityControl
                            quantity={item.quantity}
                            onIncrement={() => onUpdateQuantity(item.quantity + 1)}
                            onDecrement={() => onUpdateQuantity(item.quantity - 1)}
                            min={1}
                            max={item.manageStock ? item.stock : undefined}
                        />
                        <div className="flex items-center gap-1">
                            {/* Discount Button */}
                            {canApplyDiscount && (
                                <IconButton
                                    icon={<Tag className="w-4 h-4" />}
                                    onClick={() => setShowDiscount(!showDiscount)}
                                    variant={item.discountAmount ? "outline" : "ghost"}
                                    title="Apply Discount"
                                    className={item.discountAmount ? "bg-green-100 text-green-600" : ""}
                                />
                            )}

                            <IconButton
                                icon={<Trash2 className="w-4 h-4" />}
                                onClick={onRemove}
                                variant="ghost"
                                className="text-red-700 hover:text-red-700 hover:bg-red-50 opacity-100"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Discount Form */}
            {showDiscount && canApplyDiscount && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Discount:</label>
                        <input
                            type="number"
                            step={discountType === 'percentage' ? "0.1" : "0.01"}
                            value={discountAmount}
                            onChange={(e) => setDiscountAmount(e.target.value)}
                            placeholder="0"
                            className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')}
                            className="px-2 py-1 border border-slate-300 rounded text-sm bg-white"
                        >
                            <option value="fixed">Fixed</option>
                            <option value="percentage">%</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleApplyDiscount}
                            disabled={!discountAmount}
                            className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                            Apply
                        </button>
                        {item.discountAmount && (
                            <button
                                onClick={handleRemoveDiscount}
                                className="flex-1 px-2 py-1 bg-slate-300 text-slate-700 rounded text-sm font-medium hover:bg-slate-400"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={() => setShowDiscount(false)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm font-medium hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
