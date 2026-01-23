'use client';

import React, { useState } from 'react';
import { Store, User, Camera, RotateCcw, BarChart3, Package } from 'lucide-react';
import TimeDisplay from '../molecules/TimeDisplay';
import { useUser } from '@/contexts/UserContext';
import { useStore } from '@/contexts/StoreContext';
import Image from 'next/image';
import { BarcodeInput } from '../molecules/BarcodeInput';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { EndShiftModal } from './EndShiftModal';
import { useCartStore } from '@/store/cartStore';
import { useSessionStore } from '@/store/sessionStore';

import IconButton from '../atoms/IconButton';
import api from '@/services/api';

export default function Header() {
    const { store } = useStore();
    const { user } = useUser();
    const { activeSession, endSession, startSession } = useSessionStore();
    const { addToCart } = useCartStore();
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const handleBarcodeScan = async (barcode: string) => {
        const product = await api.getProductByBarcode(barcode);

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
            <header className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
                {/* Left: Store & Barcode Scanner */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 border-r pr-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            {store?.logo && <Image src={store?.logo || ''} alt={store?.name || 'Store Logo'} width={40} height={40} />}
                            {!store?.logo && <Store size={22} />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 leading-none">{store?.name || 'My Store'}</h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Session: {activeSession?.sessionNumber || 'Loading...'}
                            </p>
                        </div>
                    </div>

                    {/* Barcode Input */}
                    <div className="w-72">
                        <BarcodeInput onScan={handleBarcodeScan} autoFocus={false} />
                    </div>

                    {/* Camera Scanner Button */}
                    <IconButton
                        icon={<Camera className="w-5 h-5" />}
                        onClick={() => setShowCameraScanner(true)}
                        variant="outline"
                        title="Open camera scanner"
                    />

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 border-l pl-4">
                        <IconButton
                            icon={<RotateCcw className="w-5 h-5" />}
                            onClick={() => {/* TODO: Open returns modal */ }}
                            variant="outline"
                            title="Returns"
                        />
                        <IconButton
                            icon={<BarChart3 className="w-5 h-5" />}
                            onClick={() => {/* TODO: Open reports modal */ }}
                            variant="outline"
                            title="Reports"
                        />
                        <IconButton
                            icon={<Package className="w-5 h-5 text-red-600" />}
                            onClick={() => setShowEndShiftModal(true)}
                            variant="outline"
                            title="End Shift"
                            className="border-red-200 hover:bg-red-50 hover:border-red-300"
                        />
                    </div>
                </div>

                {/* Middle: Time Display */}
                <TimeDisplay />

                {/* Right: User Info */}
                <div className="flex items-center gap-3">
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
            </header>

            {/* Camera Scanner Modal */}
            <BarcodeScannerModal
                isOpen={showCameraScanner}
                onClose={() => setShowCameraScanner(false)}
                onScan={handleBarcodeScan}
            />

            {/* End Shift Modal */}
            {activeSession && (
                <EndShiftModal
                    isOpen={showEndShiftModal}
                    onClose={() => setShowEndShiftModal(false)}
                    session={activeSession}
                    onSuccess={handleEndShiftSuccess}
                />
            )}
        </>
    );
}
