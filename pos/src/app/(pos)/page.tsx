'use client';

import React from 'react';
import ProductGrid from '@/components/organisms/ProductGrid';
import CartPanel from '@/components/organisms/CartPanel';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useSyncStore } from '@/store/syncStore';

export default function Page() {
    const { isMobileCartOpen, closeMobileCart } = useUIStore();
    const { isLoading } = useDataLoader();
    const { productCount, categoryCount, isSyncingProducts, isSyncingCategories } = useSyncStore();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Initializing POS...</h2>
                    <p className="text-gray-500 mb-4">Please wait while we prepare your store.</p>

                    {(isSyncingProducts || isSyncingCategories) && (
                        <div className="text-sm text-gray-400">
                            {isSyncingProducts && <div>Syncing products ({productCount})...</div>}
                            {isSyncingCategories && <div>Syncing categories ({categoryCount})...</div>}
                        </div>
                    )}
                </div>
            </div>
        );
    }

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
