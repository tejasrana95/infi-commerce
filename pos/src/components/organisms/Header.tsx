'use client';

import React, { useState } from 'react';
import { Store, User, Camera, RotateCcw, BarChart3, Package, History, ArrowRightLeft } from 'lucide-react';
import TimeDisplay from '../molecules/TimeDisplay';
import { useUser } from '@/contexts/UserContext';
import { useStore } from '@/contexts/StoreContext';
import Image from 'next/image';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { EndShiftModal } from './EndShiftModal';
import { ReturnOrderModal } from './ReturnOrderModal';
import { useCartStore } from '@/store/cartStore';
import { useSessionStore } from '@/store/sessionStore';

import IconButton from '../atoms/IconButton';
import api from '@/services/api';
import { useUIStore } from '@/store/uiStore';
import { Menu, ShoppingCart } from 'lucide-react';
import { SyncStatus } from '../SyncStatus';
import { productCacheService } from '@/services/productCache.service';
import { Product } from '@/types';


export default function Header({ setShowReturnModal }: { setShowReturnModal: (show: boolean) => void }) {
    const { store } = useStore();
    const { user } = useUser();
    const { activeSession, endSession, startSession } = useSessionStore();
    const { addToCart } = useCartStore();
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);

    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const { toggleSidebar, toggleMobileCart } = useUIStore();
    const { items } = useCartStore();

    const handleBarcodeScan = async (barcode: string) => {
        let product: Product | undefined;
        try {
            // 1. Check Offline Cache First
            const cachedProduct = await productCacheService.getProductByBarcode(barcode);

            if (cachedProduct) {
                // Map IndexedDBProduct to Product
                product = {
                    id: cachedProduct.id,
                    name: cachedProduct.name,
                    sku: cachedProduct.sku,
                    barcode: cachedProduct.barcode,
                    price: cachedProduct.salePrice || cachedProduct.price,
                    salePrice: cachedProduct.salePrice,
                    stock: cachedProduct.stock,
                    image: cachedProduct.image,
                    type: cachedProduct.type,
                    categoryIds: cachedProduct.categoryIds,
                    variants: cachedProduct.variants,
                    taxRate: cachedProduct.taxRate,
                    taxAmount: cachedProduct.taxAmount,
                    productOptions: cachedProduct.productOptions,
                    // attributes: cachedProduct.productOptions // Optional: map attributes if needed for UI
                };
            }
        } catch (err) {
            console.warn('Local product lookup failed:', err);
        }

        // 2. Fallback to API if not found locally
        if (!product) {
            product = await api.getProductByBarcode(barcode);
        }

        if (!product) {
            throw new Error('Product not found');
        }

        // For simple products, add directly
        if (product.type === 'simple') {
            addToCart(product);
        } else if (product.type === 'variable' && product.variants) {
            // For variable products, check if barcode matches a specific variant
            const variant = product.variants.find(
                v => v.barcode === barcode || v.sku === barcode
            );

            if (variant) {
                addToCart(product, variant);
            } else {
                // If no specific variant found, this will need variant selection
                // For now, we'll throw an error - could enhance later with variant modal
                throw new Error('Please scan a specific variant barcode or select manually');
            }
        }
    };

    const handleEndShiftSuccess = () => {
        endSession();
        setShowEndShiftModal(false);
        // Page reload will trigger POCLayout to show StartShiftModal
        window.location.reload();
    };

    return (
        <>
            <header className="bg-white border-b shadow-sm px-3 py-3 flex items-center justify-between">
                {/* Left: Store & Barcode Scanner */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 mr-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-3 border-r pr-4 hidden xl:flex">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 hidden sm:flex">
                            {store?.logo && <Image src={store?.logo || ''} alt={store?.name || 'Store Logo'} width={40} height={40} />}
                            {!store?.logo && <Store size={22} />}
                        </div>
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-bold text-slate-800 leading-none">{store?.name || 'My Store'}</h2>
                            <p className="text-xs text-slate-500 mt-1" style={{ fontSize: '10px' }}>
                                {activeSession?.sessionNumber || 'Loading...'}
                            </p>
                        </div>
                        {/* Mobile Store Name */}
                        <div className="block sm:hidden">
                            <h2 className="text-sm font-bold text-slate-800 leading-none truncate max-w-[120px]">{store?.name || 'My Store'}</h2>
                        </div>
                    </div>

                    {/* Barcode Input */}
                    <div className="flex-1 max-w-sm">
                        <BarcodeInput onScan={handleBarcodeScan} autoFocus={false} setShowCameraScanner={setShowCameraScanner} />
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 border-l pl-4 hidden md:flex">
                        <IconButton
                            icon={<ArrowRightLeft className="w-5 h-5" />}
                            onClick={() => setShowReturnModal(true)}
                            variant="outline"
                            title="Returns"
                        />
                    </div>
                </div>




                {/* Right: User Info & Cart Toggle */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-3">
                        {/* Middle: Time Display */}
                        <SyncStatus />
                        <TimeDisplay />
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                            <User size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-none">
                                {user ? `${user.firstName} ${user.lastName}` : 'Cashier'}
                            </h2>
                            <span className="text-[10px] text-green-600 font-bold uppercase">{user?.role?.replace('_', ' ') || 'Online'}</span>
                        </div>
                    </div>

                    {/* Mobile Cart Toggle */}
                    <button
                        onClick={toggleMobileCart}
                        className="p-2 lg:hidden text-slate-600 hover:bg-slate-100 rounded-lg relative"
                    >
                        <ShoppingCart size={24} />
                        {items.length > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full">
                                {items.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>
            </header >

            {/* Camera Scanner Modal */}
            <BarcodeScannerModal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)
                }
                onScan={handleBarcodeScan}
            />

            {/* End Shift Modal */}
            {
                activeSession && (
                    <EndShiftModal
                        isOpen={showEndShiftModal}
                        onClose={() => setShowEndShiftModal(false)}
                        session={activeSession}
                        onSuccess={handleEndShiftSuccess}
                    />
                )
            }
        </>
    );
}
