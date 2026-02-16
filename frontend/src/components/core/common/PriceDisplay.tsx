'use client';

import React from 'react';
import { usePriceVisibility } from '@/hooks/usePriceVisibility';

interface PriceDisplayProps {
    /** The actual price content to render when visible */
    children: React.ReactNode;
    /** Optional custom class for the hidden message container */
    className?: string;
    /** Optional inline styles for the hidden message */
    style?: React.CSSProperties;
}

/**
 * Wrapper component that conditionally renders price content
 * based on store price visibility settings.
 *
 * Usage:
 * ```tsx
 * <PriceDisplay>
 *     <span className="price">{formattedPrice}</span>
 * </PriceDisplay>
 * ```
 *
 * When price is hidden, renders a styled message instead of children.
 */
export default function PriceDisplay({ children, className, style }: PriceDisplayProps) {
    const { shouldShowPrice, hiddenMessage, isLoading } = usePriceVisibility();

    if (isLoading) {
        // Show a subtle placeholder while loading
        return React.createElement('span', {
            className,
            style: {
                display: 'inline-block',
                minWidth: '60px',
                height: '1em',
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite',
                ...style,
            },
        });
    }

    if (!shouldShowPrice) {
        return React.createElement('span', {
            className,
            style: {
                fontSize: '0.85em',
                color: 'var(--color-primary, #2563eb)',
                fontWeight: 500,
                cursor: 'pointer',
                ...style,
            },
        }, hiddenMessage);
    }

    // Price is visible — render children as-is
    return React.createElement(React.Fragment, null, children);
}
