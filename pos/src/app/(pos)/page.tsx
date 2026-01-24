'use client';

import React from 'react';
import ProductGrid from '@/components/organisms/ProductGrid';
import CartPanel from '@/components/organisms/CartPanel';

export default function Page() {
    return (
        <div className="flex h-full">
            {/* Main Product Area (Flexible width) */}
            <div className="flex-1 h-full min-w-0">
                <ProductGrid />
            </div>

            {/* Cart Panel (Fixed width) */}
            <div className="h-full shrink-0 z-20">
                <CartPanel />
            </div>
        </div>
    );
}
