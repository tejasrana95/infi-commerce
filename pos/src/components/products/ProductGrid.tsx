'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, ProductVariant } from '@/types';
import { mockApi } from '@/services/mockApi';
import { useCartStore } from '@/store/cartStore';
import CategoryTabs from './CategoryTabs';
import VariantModal from './VariantModal';
import { Search, Package, AlertCircle } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function ProductGrid() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const addToCart = useCartStore((state) => state.addToCart);

    // Shortcuts
    const searchInputRef = useRef<HTMLInputElement>(null);
    useKeyboardShortcuts([
        {
            key: '/',
            action: () => {
                searchInputRef.current?.focus();
            },
            preventDefault: true
        }
    ]);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [cats, prods] = await Promise.all([
                mockApi.getCategories(),
                mockApi.getProducts()
            ]);
            setCategories(cats);
            setProducts(prods);
            setLoading(false);
        };
        loadData();
    }, []);

    // Filter effect
    useEffect(() => {
        const filterProducts = async () => {
            setLoading(true);
            const prods = await mockApi.getProducts(
                selectedCategory === 'all' ? undefined : selectedCategory,
                searchQuery
            );
            setProducts(prods);
            setLoading(false);
        };
        const timer = setTimeout(filterProducts, 300);
        return () => clearTimeout(timer);
    }, [selectedCategory, searchQuery]);

    const handleProductClick = (product: Product) => {
        if (product.type === 'variable') {
            setModalProduct(product);
            setIsModalOpen(true);
        } else {
            addToCart(product);
        }
    };

    const handleVariantAddToCart = (product: Product, variant: ProductVariant, quantity: number) => {
        addToCart(product, variant, quantity);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Top Controls */}
            <div className="p-4 space-y-4 bg-white border-b sticky top-0 z-10">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search products by name, SKU, or scan barcode... (/)"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all font-medium text-lg placeholder:text-slate-500 text-slate-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Categories */}
                <CategoryTabs
                    categories={categories}
                    selectedId={selectedCategory}
                    onSelect={setSelectedCategory}
                />
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-4 relative">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Package className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No products found</p>
                        <p>Try adjusting your search or category</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all group active:scale-[0.98] flex flex-col h-full"
                            >
                                {/* Image */}
                                <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    {product.stock <= 5 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                            <AlertCircle className="w-3 h-3" /> Low Stock
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                                    <p className="text-xs text-slate-600 mb-3">{product.sku}</p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {product.salePrice ? (
                                                <>
                                                    <span className="text-xs text-slate-500 line-through">${product.price.toFixed(2)}</span>
                                                    <span className="text-lg font-bold text-red-600">${product.salePrice.toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="text-lg font-bold text-blue-700">${product.price.toFixed(2)}</span>
                                            )}
                                        </div>

                                        <button className="bg-slate-100 hover:bg-blue-600 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-slate-800">
                                            <span className="text-xl font-bold mb-0.5">+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Variant Modal */}
            <VariantModal
                product={modalProduct}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAddToCart={handleVariantAddToCart}
            />
        </div>
    );
}
