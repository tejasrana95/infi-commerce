'use client';

import React from 'react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';

interface CategoryTabsProps {
    categories: Category[];
    selectedId: string | 'all';
    onSelect: (id: string | 'all') => void;
}

export default function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
    const rootCategories = categories.filter(cat => !cat.parentCategory);
    // Find if the current selectedId is a sub-category or a root
    const selectedCategory = categories.find(c => c.id === selectedId);
    const activeRootId = selectedId === 'all'
        ? 'all'
        : (selectedCategory?.parentCategory?._id || selectedId);

    const subCategories = activeRootId !== 'all'
        ? categories.filter(cat => cat.parentCategory?._id === activeRootId)
        : [];

    const activeRoot = rootCategories.find(c => c.id === activeRootId);

    return (
        <div className="space-y-3">
            {/* Root Categories */}
            <div className="flex gap-2 pl-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                <button
                    onClick={() => onSelect('all')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 snap-start",
                        activeRootId === 'all'
                            ? "bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" />
                    All Products
                </button>

                {rootCategories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border snap-start",
                            activeRootId === cat.id
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Sub Categories (Small buttons) */}
            {subCategories.length > 0 && (
                <div className="flex gap-2 pl-4 overflow-x-auto pb-2 scrollbar-hide snap-x border-t pt-3">
                    <button
                        onClick={() => onSelect(activeRootId)}
                        className={cn(
                            "px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all border snap-start",
                            selectedId === activeRootId
                                ? "bg-slate-200 text-slate-900 border-slate-300"
                                : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                        )}
                    >
                        All {activeRoot?.name}
                    </button>
                    {subCategories.map((sub) => (
                        <button
                            key={sub.id}
                            onClick={() => onSelect(sub.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all border snap-start",
                                selectedId === sub.id
                                    ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            )}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
