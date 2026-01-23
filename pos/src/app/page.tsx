import React from 'react';
import POCLayout from '@/components/layout/POCLayout';
import ProductGrid from '@/components/organisms/ProductGrid';
import CartPanel from '@/components/organisms/CartPanel';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <POCLayout>
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
      </POCLayout>
    </ProtectedRoute>
  );
}
