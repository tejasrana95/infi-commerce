'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface BrandLogosConfig {
    showcaseId: string;
}

interface BrandLogo {
    image: string;
    alt: string;
    link?: string;
    order: number;
}

interface BrandShowcaseData {
    _id: string;
    name: string;
    logos: BrandLogo[];
    settings: {
        layout: 'grid' | 'carousel';
        columns: number;
        grayscale: boolean;
        hoverEffect: boolean;
        autoplay: boolean;
        interval: number;
    };
}

export default function BrandLogosModule({ config }: ModuleProps) {
    const { showcaseId } = config as BrandLogosConfig;
    const [showcase, setShowcase] = useState<BrandShowcaseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                setLoading(true);
                const data = await api.get<{ brands: BrandShowcaseData }>(`brand-showcases/${showcaseId}`);
                setShowcase(data.brands);
            } catch (err) {
                console.error('Error fetching brand showcase:', err);
                setError(err instanceof Error ? err.message : 'Failed to load brand showcase');
            } finally {
                setLoading(false);
            }
        };

        if (showcaseId) {
            fetchShowcase();
        }
    }, [showcaseId]);

    // Auto-play for carousel layout
    useEffect(() => {
        if (
            showcase?.settings.layout === 'carousel' &&
            showcase?.settings.autoplay &&
            showcase.logos.length > showcase.settings.columns
        ) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => {
                    const maxIndex = showcase.logos.length - showcase.settings.columns;
                    return prev >= maxIndex ? 0 : prev + 1;
                });
            }, showcase.settings.interval);

            return () => clearInterval(timer);
        }
    }, [showcase]);

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !showcase || showcase.logos.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8">
                    <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                        <p className="text-red-600">Error loading brand logos: {error || 'No logos found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const sortedLogos = [...showcase.logos].sort((a, b) => a.order - b.order);

    const LogoImage = ({ logo }: { logo: BrandLogo }) => {
        const imageClass = `
            w-full h-20 object-contain transition-all duration-300
            ${showcase.settings.grayscale ? 'grayscale' : ''}
            ${showcase.settings.hoverEffect ? 'hover:grayscale-0 hover:scale-110' : ''}
        `;

        const imageElement = (
            <div className="relative w-full h-20">
                <Image
                    src={logo.image}
                    alt={logo.alt}
                    fill
                    className={imageClass}
                    style={{ objectFit: 'contain' }}
                />
            </div>
        );

        if (logo.link) {
            return (
                <Link
                    href={logo.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                >
                    {imageElement}
                </Link>
            );
        }

        return imageElement;
    };

    if (showcase.settings.layout === 'carousel') {
        const visibleLogos = sortedLogos.slice(
            currentIndex,
            currentIndex + showcase.settings.columns
        );

        // If we need to wrap around
        if (visibleLogos.length < showcase.settings.columns) {
            visibleLogos.push(...sortedLogos.slice(0, showcase.settings.columns - visibleLogos.length));
        }

        return (
            <div className="w-full py-12 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="overflow-hidden">
                        <div
                            className="grid gap-8 transition-transform duration-500"
                            style={{
                                gridTemplateColumns: `repeat(${showcase.settings.columns}, minmax(0, 1fr))`,
                            }}
                        >
                            {visibleLogos.map((logo, index) => (
                                <div key={`${logo.image}-${index}`} className="flex items-center justify-center p-4">
                                    <LogoImage logo={logo} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {sortedLogos.length > showcase.settings.columns && (
                        <div className="flex justify-center gap-2 mt-6">
                            {Array.from({ length: Math.ceil(sortedLogos.length / showcase.settings.columns) }).map(
                                (_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index * showcase.settings.columns)}
                                        className={`w-2 h-2 rounded-full transition-all ${Math.floor(currentIndex / showcase.settings.columns) === index
                                            ? 'bg-blue-600 w-8'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to brand group ${index + 1}`}
                                    />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Grid layout
    return (
        <div className="w-full py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div
                    className="grid gap-8"
                    style={{
                        gridTemplateColumns: `repeat(auto-fit, minmax(${100 / showcase.settings.columns}px, 1fr))`,
                    }}
                >
                    {sortedLogos.map((logo, index) => (
                        <div key={`${logo.image}-${index}`} className="flex items-center justify-center p-4">
                            <LogoImage logo={logo} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
