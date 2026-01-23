'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, ProductVariant } from '@/types';
import pocApi from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import CategoryTabs from '../products/CategoryTabs';
import VariantModal from '../products/VariantModal';
import { Package } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import SearchBar from '../molecules/SearchBar';
import ProductCard from '../molecules/ProductCard';
import Spinner from '../atoms/Spinner';

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
    useKeyboardShortcuts([
        {
            key: '/',
            action: () => {
                document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
            },
            preventDefault: true
        }
    ]);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [cats, prods] = await Promise.all([
                pocApi.getCategories(),
                pocApi.getProducts()
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
            const prods = await pocApi.getProducts(
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
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search products by name, SKU, or scan barcode... (/)"
                    autoFocus
                />

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
                    <div className="flex items-center justify-center h-64">
                        <Spinner size="lg" />
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
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => handleProductClick(product)}
                            />
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
