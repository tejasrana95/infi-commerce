'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { ShoppingCart, User, ChevronRight, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useStore } from '@/contexts/StoreContext';
import CartItem from '../molecules/CartItem';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import Avatar from '../atoms/Avatar';

export default function CartPanel() {
    const { items, getTotal, getSubtotal, getTaxTotal, removeFromCart, updateQuantity, clearCart, customer, setCustomer } = useCartStore();
    const { formatPrice } = useCurrency();
    const { store } = useStore();
    const allowQuickCheckout = store?.posSettings?.allowQuickCheckout ?? true;
    const total = getTotal();
    const subtotal = getSubtotal();
    const taxTotal = getTaxTotal();

    const { closeMobileCart, openCheckout, openCustomerModal, openHoldOrder, isCheckoutOpen } = useUIStore();

    // Global Shortcuts
    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrlKey: true,
            action: () => {
                // Only open checkout if it's not already open
                if (items.length > 0 && allowQuickCheckout && !isCheckoutOpen) openCheckout();
            }
        },
        {
            key: 'F3',
            action: () => {
                if (items.length > 0) openHoldOrder();
            }
        }
    ]);

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-xl w-full">
            {/* Cart Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2 text-slate-800">
                    <ShoppingCart className="w-5 h-5" />
                    <h2 className="font-bold text-lg">Current Order</h2>
                    <Badge variant="primary">
                        {items.reduce((acc, item) => acc + item.quantity, 0)}
                    </Badge>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeMobileCart}
                    className="text-slate-500 hover:bg-slate-100"
                >
                    <X size={20} className="lg:hidden" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    disabled={items.length === 0}
                    className="text-red-500 hover:bg-red-50"
                >
                    Clear
                </Button>
            </div>

            {/* Customer Selector */}
            <div
                className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={openCustomerModal}
            >
                <div className="flex items-center gap-3 text-slate-600">
                    <Avatar
                        name={customer?.name}
                        size="sm"
                        className={customer ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"}
                    />
                    <div className="flex flex-col">
                        <span className={cn("text-sm font-bold", customer ? "text-slate-800" : "text-slate-600")}>
                            {customer ? customer.name : "Walk-in Customer"}
                        </span>
                        {customer && (
                            <span className="text-xs text-slate-600">{customer.phone || customer.email || "No details"}</span>
                        )}
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <ShoppingCart className="w-16 h-16 opacity-20" />
                        <p className="font-medium">Cart is empty</p>
                        <p className="text-sm text-center px-8">Select products from the grid to add them to the order</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <CartItem
                            key={item.cartId}
                            item={item}
                            onUpdateQuantity={(qty) => updateQuantity(item.cartId, qty)}
                            onRemove={() => removeFromCart(item.cartId)}
                        />
                    ))
                )}
            </div>

            {/* Footer / Totals */}
            <div className="bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0 z-10">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax</span>
                        <span>{formatPrice(taxTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-dashed">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full h-14 text-lg flex items-center justify-center gap-2"
                    disabled={items.length === 0}
                    onClick={openCheckout}
                >
                    Pay {formatPrice(total)}
                    {allowQuickCheckout && <span className="text-xs bg-black/20 px-2 py-0.5 rounded font-mono font-normal">Ctrl+Enter</span>}
                </Button>
                <Button
                    variant="outline"
                    className="w-full h-12 flex items-center justify-center gap-2 text-sm mt-2"
                    disabled={items.length === 0}
                    onClick={openHoldOrder}
                    title="Hold Current Order (F3)"
                >
                    <Package className="w-4 h-4" />
                    Hold Order
                </Button>
            </div>

        </div>
    );
}
