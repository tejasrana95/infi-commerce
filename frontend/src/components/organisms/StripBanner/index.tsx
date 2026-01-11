import React from 'react';
import Link from 'next/link';
import { formatFontFamily } from '@/lib/fonts';

interface StripBannerProps {
    title?: string;
    description?: string;
    content?: string; // Legacy field
    backgroundImage?: string;
    backgroundColor?: string;
    textColor?: string;
    ctaText?: string;
    ctaLink?: string;
    ctaPosition?: 'bottom' | 'left' | 'right';
    height?: number;
    overlayColor?: string;
    overlayOpacity?: number;
    ctaBackgroundColor?: string;
    ctaTextColor?: string;
    titleStyles?: {
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: number;
        color?: string;
    };
    descriptionStyles?: {
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: number;
        color?: string;
    };
    className?: string; // For margin/padding from layout engine
}

const StripBanner: React.FC<StripBannerProps> = ({
    title,
    description,
    content,
    backgroundImage,
    backgroundColor = '#f5f5f5',
    textColor = '#000000',
    ctaText,
    ctaLink,
    ctaPosition = 'right',
    height = 120,
    overlayColor,
    overlayOpacity,
    ctaBackgroundColor = '#000000', // Default to black
    ctaTextColor = '#ffffff',       // Default to white
    titleStyles,
    descriptionStyles,
    className,
}) => {
    const containerStyle: React.CSSProperties = {
        backgroundColor,
        color: textColor,
        minHeight: `${height}px`,
        position: 'relative',
        borderRadius: '0.8rem',
        overflow: 'hidden',
        zIndex: 0, // Stacking context
    };

    const hasCTA = ctaText && ctaLink;

    const renderCTA = () => {
        if (!hasCTA) return null;

        const btnClass = "inline-block px-6 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90";
        const btnStyle = {
            backgroundColor: ctaBackgroundColor,
            color: ctaTextColor
        };

        return ctaLink.startsWith('/') ? (
            <Link href={ctaLink} className={btnClass} style={btnStyle}>
                {ctaText}
            </Link>
        ) : (
            <a href={ctaLink} className={btnClass} target="_blank" rel="noopener noreferrer" style={btnStyle}>
                {ctaText}
            </a>
        );
    };

    const effectiveDescription = description || content;

    // Robust Overlay Logic
    // If color is present, render.
    // If opacity is present (>0) but no color, default to black and render.
    let safeColor = overlayColor;
    let safeOpacity = (overlayOpacity !== undefined && !isNaN(overlayOpacity)) ? overlayOpacity : 0.5;

    // Default to black if opacity is explicitly set but no color provided
    if (!safeColor && overlayOpacity !== undefined && overlayOpacity > 0) {
        safeColor = '#000000';
    }

    const showOverlay = !!safeColor;

    return (
        <div
            className={`w-full flex items-center justify-center px-4 md:px-8 py-6 ${className || ''}`}
            style={containerStyle}
        >
            {/* Background Image Layer */}
            {backgroundImage && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 1,
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            )}

            {/* Overlay Color Layer */}
            {showOverlay && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    data-overlay-debug={`color:${safeColor}, opacity:${safeOpacity}`}
                    style={{
                        backgroundColor: safeColor,
                        opacity: safeOpacity,
                        zIndex: 2,
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                    }}
                />
            )}

            {/* Content Layer */}
            <div
                className={`relative container mx-auto flex flex-col items-center gap-4 ${ctaPosition === 'left' ? 'md:flex-row-reverse md:justify-end' :
                    ctaPosition === 'right' ? 'md:justify-between md:flex-row' :
                        'flex-col text-center md:flex-col' // bottom
                    }`}
                style={{ zIndex: 10 }}
            >

                {/* Content */}
                <div className={`flex flex-col gap-1 ${ctaPosition === 'bottom' ? 'mb-2' : ''} ${ctaPosition === 'right' ? 'text-left' : ctaPosition === 'left' ? 'text-right' : 'text-center'}`}>
                    {title && (
                        <div
                            style={{
                                fontFamily: formatFontFamily(titleStyles?.fontFamily),
                                fontSize: titleStyles?.fontSize ? `${titleStyles.fontSize}px` : '1.5rem',
                                fontWeight: titleStyles?.fontWeight || 700,
                                color: titleStyles?.color || textColor,
                                lineHeight: 1.2,
                            }}
                        >
                            {title}
                        </div>
                    )}
                    {effectiveDescription && (
                        <div
                            dangerouslySetInnerHTML={{ __html: effectiveDescription }}
                            style={{
                                fontFamily: formatFontFamily(descriptionStyles?.fontFamily),
                                fontSize: descriptionStyles?.fontSize ? `${descriptionStyles.fontSize}px` : '1rem',
                                fontWeight: descriptionStyles?.fontWeight || 400,
                                color: descriptionStyles?.color || textColor,
                                // opacity: descriptionStyles?.color ? 1 : 0.9, // Removed opacity to avoid conflict with RTE colors
                            }}
                            className="prose prose-sm max-w-none"
                        />
                    )}
                </div>

                {/* CTA */}
                {renderCTA()}
            </div>
        </div>
    );
};

export default StripBanner;
