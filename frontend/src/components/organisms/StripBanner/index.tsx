import React from 'react';
import Link from 'next/link';

interface StripBannerProps {
    content?: string;
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
    className?: string; // For margin/padding from layout engine
}

const StripBanner: React.FC<StripBannerProps> = ({
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
    className,
}) => {
    const style: React.CSSProperties = {
        backgroundColor,
        color: textColor,
        minHeight: `${height}px`,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        borderRadius: '0.8rem',
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

    return (
        <div
            className={`w-full flex items-center justify-center px-4 md:px-8 py-6 ${className || ''}`}
            style={style}
        >
            {/* Overlay */}
            {(overlayColor && overlayOpacity !== undefined) && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: overlayColor,
                        opacity: overlayOpacity,
                        borderRadius: '0.8rem',
                    }}
                />
            )}

            <div className={`relative z-10 container mx-auto flex flex-col  items-center gap-4 ${ctaPosition === 'left' ? 'md:flex-row-reverse md:justify-end' :
                ctaPosition === 'right' ? 'md:justify-between md:flex-row' :
                    'flex-col text-center md:flex-col' // bottom
                }`}>

                {/* Content */}
                <div className={`text-lg md:text-xl font-medium ${ctaPosition === 'bottom' ? 'mb-2' : ''}`}>
                    {content}
                </div>

                {/* CTA */}
                {renderCTA()}
            </div>
        </div>
    );
};

export default StripBanner;
