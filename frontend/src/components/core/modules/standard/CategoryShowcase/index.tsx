'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface CategoryShowcaseConfig {
    categoryIds: string[];
    style: 'card' | 'banner' | 'minimal';
    columns: number;
}

interface Category {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    description?: string;
    productCount?: number;
}

export default function CategoryShowcaseModule({ config }: ModuleProps) {
    const { categoryIds, style, columns } = config as CategoryShowcaseConfig;
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const ids = categoryIds.join(',');
                const data = await api.get<Category[] | { categories: Category[] }>(`/categories?ids=${ids}`);
                setCategories(Array.isArray(data) ? data : data.categories || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError(err instanceof Error ? err.message : 'Failed to load categories');
            } finally {
                setLoading(false);
            }
        };

        if (categoryIds && categoryIds.length > 0) {
            fetchCategories();
        } else {
            setLoading(false);
        }
    }, [categoryIds]);

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div
                        className="grid gap-6"
                        style={{
                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        }}
                    >
                        {Array.from({ length: columns }).map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || categories.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8">
                    <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                        <p className="text-red-600">Error loading categories: {error || 'No categories found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const renderCard = (category: Category) => {
        if (style === 'banner') {
            return (
                <Link
                    href={`/category/${category.slug}`}
                    className="relative h-64 rounded-lg overflow-hidden group"
                >
                    {category.image ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                        <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                        {category.productCount !== undefined && (
                            <p className="text-sm opacity-90">{category.productCount} Products</p>
                        )}
                    </div>
                </Link>
            );
        }

        if (style === 'minimal') {
            return (
                <Link
                    href={`/category/${category.slug}`}
                    className="flex flex-col items-center p-6 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                    {category.image ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                            <span className="text-3xl text-gray-400">
                                {category.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 text-center">{category.name}</h3>
                    {category.productCount !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">{category.productCount} items</p>
                    )}
                </Link>
            );
        }

        // Default: card style
        return (
            <Link
                href={`/category/${category.slug}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
            >
                {category.image ? (
                    <div className="relative w-full h-48">
                        <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
                    {category.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{category.description}</p>
                    )}
                    {category.productCount !== undefined && (
                        <p className="text-sm text-gray-500">{category.productCount} Products</p>
                    )}
                    <div className="mt-4 text-blue-600 font-semibold group-hover:text-blue-700">
                        View Category →
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="w-full py-12">
            <div className="max-w-7xl mx-auto px-4">
                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(100 / columns)}%, 1fr))`,
                    }}
                >
                    {categories.map((category) => (
                        <div key={category._id}>
                            {renderCard(category)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
