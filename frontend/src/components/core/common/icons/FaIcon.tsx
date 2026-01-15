'use client';

import React, { lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Cache for dynamically loaded icons to avoid re-importing
const iconCache = new Map<string, React.ComponentType<any>>();

export default function FaIcon({ name, size = 24, ...props }: { name: string; size?: number;[key: string]: any }) {
    if (!name) return null;

    // Check cache first
    if (!iconCache.has(name)) {
        // Dynamically import only the specific icon
        const IconComponent = dynamic(
            () => import('react-icons/fa').then((mod) => {
                const Icon = (mod as any)[name];
                if (!Icon) {
                    console.warn(`Icon "${name}" not found in react-icons/fa`);
                    return () => null;
                }
                return Icon;
            }),
            {
                loading: () => <div style={{ width: size, height: size, display: 'inline-block' }} />,
                ssr: false
            }
        );
        iconCache.set(name, IconComponent);
    }

    const Icon = iconCache.get(name)!;
    return <Icon size={size} {...props} />;
}
