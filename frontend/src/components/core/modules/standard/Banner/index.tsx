'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface BannerConfig {
    bannerId: string;
}

interface BannerData {
    _id: string;
    name: string;
    image: string;
    mobileImage?: string;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    alignment: 'left' | 'center' | 'right';
    overlay: {
        enabled: boolean;
        color: string;
        opacity: number;
    };
    textColor?: string;
}

export default function BannerModule({ config }: ModuleProps) {
    const { bannerId } = config as BannerConfig;
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                setLoading(true);
                const data = await api.get<{ banner: BannerData }>(`/banners/${bannerId}`);
                setBanner(data.banner);
            } catch (err) {
                console.error('Error fetching banner:', err);
                setError(err instanceof Error ? err.message : 'Failed to load banner');
            } finally {
                setLoading(false);
            }
        };

        if (bannerId) {
            fetchBanner();
        }
    }, [bannerId]);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-gray-200 animate-pulse rounded-lg" />
        );
    }

    if (error || !banner) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Error loading banner: {error || 'Banner not found'}</p>
                </div>
            );
        }
        return null;
    }

    const alignmentClass = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right',
    }[banner.alignment];

    return (
        <div className="relative w-full overflow-hidden rounded-lg">
            {/* Banner Image */}
            <div className="relative w-full aspect-[21/9]">
                <Image
                    src={banner.image}
                    alt={banner.title || banner.name}
                    fill
                    className="object-cover hidden md:block"
                    priority
                />
                {banner.mobileImage && (
                    <Image
                        src={banner.mobileImage}
                        alt={banner.title || banner.name}
                        fill
                        className="object-cover md:hidden"
                        priority
                    />
                )}

                {/* Overlay */}
                {banner.overlay.enabled && (
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: banner.overlay.color,
                            opacity: banner.overlay.opacity,
                        }}
                    />
                )}

                {/* Text Content */}
                {(banner.title || banner.subtitle || banner.ctaText) && (
                    <div className={`absolute inset-0 flex flex-col justify-center ${alignmentClass} p-8 md:p-16`}>
                        <div className="max-w-2xl" style={{ color: banner.textColor }}>
                            {banner.title && (
                                <h2 className="text-3xl md:text-5xl font-bold mb-4">
                                    {banner.title}
                                </h2>
                            )}
                            {banner.subtitle && (
                                <p className="text-lg md:text-xl mb-6 opacity-90">
                                    {banner.subtitle}
                                </p>
                            )}
                            {banner.ctaText && banner.ctaLink && (
                                <Link
                                    href={banner.ctaLink}
                                    className="inline-block px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-opacity-90 transition-all"
                                >
                                    {banner.ctaText}
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
