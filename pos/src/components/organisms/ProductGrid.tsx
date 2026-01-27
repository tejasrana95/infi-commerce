'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, ProductVariant } from '@/types';
import pocApi from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import CategoryTabs from '../products/CategoryTabs';
import VariantModal from '../products/VariantModal';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import SearchBar from '../molecules/SearchBar';
import ProductCard from '../molecules/ProductCard';
import Spinner from '../atoms/Spinner';

export default function ProductGrid() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20); // Fixed page size for POS
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal State
    const [modalProduct, setModalProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const addToCart = useCartStore((state) => state.addToCart);
    const requestIdRef = useRef(0);

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
            // Only load categories here. Products will be loaded by the filter effect
            const cats = await pocApi.getCategories();
            setCategories(cats);
        };
        loadData();
    }, [pageSize]);

    // Filter effect
    useEffect(() => {
        // Debounced filter with request id to ignore stale responses
        const timer = setTimeout(() => {
            const run = async () => {
                requestIdRef.current += 1;
                const thisId = requestIdRef.current;
                setLoading(true);
                const prodsData = await pocApi.getProducts(
                    selectedCategory === 'all' ? undefined : selectedCategory,
                    searchQuery,
                    1, // Reset to page 1 when filters change
                    pageSize
                );
                // If a newer request started, ignore this response
                if (thisId !== requestIdRef.current) return;
                setProducts(prodsData.products);
                setTotalProducts(prodsData.pagination.total);
                setTotalPages(prodsData.pagination.pages);
                setCurrentPage(1); // Reset to first page
                setLoading(false);
            };
            run();
        }, 300);

        return () => {
            // invalidate in-flight responses and clear timer
            requestIdRef.current += 1;
            clearTimeout(timer);
        };
    }, [selectedCategory, searchQuery, pageSize]);

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

    const handlePageChange = async (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;

        requestIdRef.current += 1;
        const thisId = requestIdRef.current;
        setLoading(true);
        const prodsData = await pocApi.getProducts(
            selectedCategory === 'all' ? undefined : selectedCategory,
            searchQuery,
            page,
            pageSize
        );
        if (thisId !== requestIdRef.current) return;
        setProducts(prodsData.products);
        setCurrentPage(page);
        setLoading(false);
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
                    <div className="grid grid-cols-1  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 pb-20">
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 bg-white border-t flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        Showing {products.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, totalProducts)} of {totalProducts} products
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || loading}
                            className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            pageNum === currentPage
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-slate-300 hover:bg-slate-50'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || loading}
                            className="p-2 rounded-md border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

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
