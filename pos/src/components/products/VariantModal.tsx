'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VariantModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
}

import { useCurrency } from '@/contexts/CurrencyContext';

export default function VariantModal({ product, isOpen, onClose, onAddToCart }: VariantModalProps) {
    const { formatPrice } = useCurrency();
    const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);

    // Reset state when product changes
    useEffect(() => {
        if (product) {
            setSelectedAttributes({});
            setQuantity(1);

            // Pre-select first options if available
            if (product.attributes) {
                const initialAttributes: Record<string, string> = {};
                product.attributes.forEach(attr => {
                    // Optional: Pre-select first value
                    // initialAttributes[attr.name] = attr.options[0];
                });
                // setSelectedAttributes(initialAttributes);
            }
        }
    }, [product]);

    if (!isOpen || !product) return null;

    // Find matching variant
    const selectedVariant = product.variants?.find(variant => {
        return Object.entries(variant.attributes).every(
            ([key, value]) => selectedAttributes[key] === value
        );
    });

    const isReadyToAdd = !!selectedVariant;

    const handleAttributeSelect = (id: string, value: string) => {
        setSelectedAttributes(prev => ({ ...prev, [id]: value }));
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-lg overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-bold text-xl text-slate-800">{product.name}</h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Product Summary */}
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                <img src={selectedVariant?.image || product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.price)}
                                </div>
                                <p className="text-slate-500 text-sm mt-1">
                                    SKU: {selectedVariant ? selectedVariant.sku : product.sku}
                                </p>
                                {selectedVariant && (
                                    <p className={cn("text-xs mt-2 px-2 py-0.5 rounded-full inline-block font-medium",
                                        selectedVariant.stock > 10 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                    )}>
                                        Stock: {selectedVariant.stock}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Attributes Selection */}
                        {product.attributes?.map((attr) => (
                            <div key={attr.id}>
                                <label className="block text-sm font-bold text-slate-700 mb-2">{attr.name}</label>
                                <div className="flex flex-wrap gap-2">
                                    {attr.options.map((option) => {
                                        const isSelected = selectedAttributes[attr.id] === option;
                                        return (
                                            <button
                                                key={option}
                                                onClick={() => handleAttributeSelect(attr.id, option)}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all",
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                                                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                {option}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Quantity</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50"
                                >-</button>
                                <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-12 h-12 rounded-xl border-2 border-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-50"
                                >+</button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-slate-50">
                        <button
                            onClick={() => {
                                if (selectedVariant) {
                                    onAddToCart(product, selectedVariant, quantity);
                                    onClose();
                                }
                            }}
                            disabled={!isReadyToAdd}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all",
                                isReadyToAdd
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-900/20 active:translate-y-0.5"
                                    : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                            )}
                        >
                            {isReadyToAdd ? (
                                <>
                                    <Check className="w-6 h-6" /> Add to Order - {formatPrice(selectedVariant!.price * quantity)}
                                </>
                            ) : (
                                "Select Options"
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
