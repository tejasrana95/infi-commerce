import React from 'react';
import Link from 'next/link';
import styles from './CTAButton.module.scss';

interface CTAButtonProps {
    text: string;
    link: string;
    variant?: 'contained' | 'outlined' | 'text' | 'ghost' | 'glass' | 'glow' | '3d' | 'underline';
    color?: 'primary' | 'secondary' | 'custom';
    alignment?: 'left' | 'center' | 'right';
    size?: 'small' | 'medium' | 'large';
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    showArrow?: boolean;
    className?: string;
}

const CTAButton: React.FC<CTAButtonProps> = ({
    text,
    link = '#!',
    variant = 'contained',
    color = 'primary',
    alignment = 'center',
    size = 'medium',
    backgroundColor,
    borderColor,
    textColor,
    showArrow = false,
    className,
}) => {
    // Generate class names
    const buttonClasses = [
        styles.button,
        styles[size] || styles.medium,
        styles[`variant_${variant}`] || styles.variant_contained,
        styles[`color_${color}`],
        className
    ].filter(Boolean).join(' ');

    // Dynamic style overrides
    const dynamicStyles: React.CSSProperties = {
        '--cta-bg': backgroundColor,
        '--cta-border': borderColor,
        '--cta-text': textColor,
    } as React.CSSProperties;

    const wrapperClasses = `w-full flex ${alignment === 'left' ? 'justify-start' :
        alignment === 'right' ? 'justify-end' :
            'justify-center'
        }`;

    const renderContent = () => (
        <>
            {text}
            {showArrow && <span className={styles.arrow}>→</span>}
        </>
    );

    const isInternalLink = link && link.startsWith('/') && !link.startsWith('/#');

    return (
        <div className={wrapperClasses}>
            {isInternalLink ? (
                <Link
                    href={link}
                    className={buttonClasses}
                    style={dynamicStyles}
                    data-track="cta_button_click"
                    data-button-text={text}
                    data-button-link={link}
                >
                    {renderContent()}
                </Link>
            ) : (
                <a
                    href={link || '#!'}
                    className={buttonClasses}
                    target={link?.startsWith('#') ? undefined : "_blank"}
                    rel={link?.startsWith('#') ? undefined : "noopener noreferrer"}
                    style={dynamicStyles}
                    onClick={(e) => {
                        if (!link || link === '#' || link === '#!') {
                            e.preventDefault();
                        }
                    }}
                    data-track="cta_button_click"
                    data-button-text={text}
                    data-button-link={link}
                >
                    {renderContent()}
                </a>
            )}
        </div>
    );
};

export default CTAButton;
