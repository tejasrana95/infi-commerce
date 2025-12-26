import React from 'react';
import Link from 'next/link';

interface CTAButtonProps {
    text: string;
    link: string;
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'custom';
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    backgroundColor?: string;
    textColor?: string;
    className?: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({
    text,
    link,
    variant = 'contained',
    color = 'primary',
    alignment = 'center',
    size = 'medium',
    backgroundColor,
    textColor,
    className,
}) => {
    // Determine classes based on props
    const getButtonClasses = () => {
        const baseClasses = "inline-flex items-center justify-center transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

        let variantClasses = "";
        const customStyle: React.CSSProperties = {};

        if (color === 'custom') {
            if (variant === 'contained') {
                // Custom Contained: bg = custom bg, text = custom text
                // We'll use inline styles for dynamic colors if possible, but here we perform class generation.
                // However, Tailwind classes can't dynamic arbitrary values easily without JIT or style objects.
                // We will handle custom colors via the style attribute on the element, returned separately or we return style object?
                // The current structure only returns a string className. I should change the component to apply styles.
                // But let's first set base classes.
                variantClasses = "focus:ring-gray-500";
            } else if (variant === 'outlined') {
                // Custom Outlined: border = custom bg, text = custom text
                variantClasses = "border hover:bg-gray-50 focus:ring-gray-500";
            } else { // text
                // Custom Text: text = custom text
                variantClasses = "underline hover:no-underline focus:ring-gray-500";
            }
        } else if (variant === 'contained') {
            if (color === 'primary') variantClasses = "bg-[var(--color-primary)] hover:opacity-90 text-white focus:ring-[var(--color-primary)]";
            else if (color === 'secondary') variantClasses = "bg-[var(--color-secondary)] hover:opacity-90 text-white focus:ring-[var(--color-secondary)]";
            else variantClasses = "bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-500";
        } else if (variant === 'outlined') {
            if (color === 'primary') variantClasses = "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-gray-50 focus:ring-[var(--color-primary)]";
            else if (color === 'secondary') variantClasses = "border border-[var(--color-secondary)] text-[var(--color-secondary)] hover:bg-gray-50 focus:ring-[var(--color-secondary)]";
            else variantClasses = "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500";
        } else { // text
            if (color === 'primary') variantClasses = "text-[var(--color-primary)] hover:opacity-80 underline hover:no-underline";
            else if (color === 'secondary') variantClasses = "text-[var(--color-secondary)] hover:opacity-80 underline hover:no-underline";
            else variantClasses = "text-gray-600 hover:text-gray-900 underline hover:no-underline";
        }

        let sizeClasses = "";
        if (size === 'small') sizeClasses = "px-3 py-1.5 text-sm rounded-md";
        else if (size === 'large') sizeClasses = "px-6 py-3 text-lg rounded-lg";
        else sizeClasses = "px-4 py-2 text-base rounded-md";

        return `${baseClasses} ${variantClasses} ${sizeClasses} ${className || ''}`;
    };

    const getCustomStyles = () => {
        if (color !== 'custom') return {};

        if (variant === 'contained') {
            return {
                backgroundColor: backgroundColor,
                color: textColor,
                borderColor: 'transparent'
            };
        } else if (variant === 'outlined') {
            return {
                borderColor: backgroundColor,
                color: textColor,
                backgroundColor: 'transparent'
            };
        } else { // text
            return {
                color: textColor,
                backgroundColor: 'transparent'
            };
        }
    };

    const wrapperClasses = `w-full flex ${alignment === 'left' ? 'justify-start' :
        alignment === 'right' ? 'justify-end' :
            'justify-center'
        }`;

    return (
        <div className={wrapperClasses}>
            {link.startsWith('/') ? (
                <Link href={link} className={getButtonClasses()} style={getCustomStyles()}>
                    {text}
                </Link>
            ) : (
                <a href={link} className={getButtonClasses()} target="_blank" rel="noopener noreferrer" style={getCustomStyles()}>
                    {text}
                </a>
            )}
        </div>
    );
};

export default CTAButton;
