'use client';

import React from 'react';
import ProductGrid from '@/components/organisms/ProductGrid';
import CartPanel from '@/components/organisms/CartPanel';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

export default function Page() {
    const { isMobileCartOpen, closeMobileCart } = useUIStore();

    return (
        <div className="flex h-full relative">
            {/* Main Product Area (Flexible width) */}
            <div className="flex-1 h-full min-w-0">
                <ProductGrid />
            </div>

            {/* Mobile Cart Overlay */}
            {isMobileCartOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={closeMobileCart}
                />
            )}

            {/* Cart Panel (Fixed width on Desktop, Slide-over on Mobile) */}
            <div className={cn(
                "h-full shrink-0 z-30 transition-transform duration-300 ease-in-out bg-white",
                "fixed inset-y-0 right-0 w-full sm:w-[400px]", // Mobile styles
                "lg:relative lg:translate-x-0 lg:w-[400px]",   // Desktop styles
                isMobileCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
            )}>
                <CartPanel />
            </div>
        </div>
    );
}
