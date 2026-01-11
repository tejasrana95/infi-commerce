'use client';

import React from 'react';
import { ModuleProps } from '../index';
import { formatFontFamily } from '@/lib/fonts';
import { useDynamicFonts } from '@/hooks/useDynamicFonts';

interface HeadingConfig {
    heading?: string;
    subheading?: string;
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
    align?: 'left' | 'center' | 'right';
    styles?: {
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: number;
        color?: string;

        subFontFamily?: string;
        subFontSize?: number;
        subFontWeight?: number;
        subColor?: string;

        backgroundColor?: string;

        borderStyle?: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius?: number;
        borderTop?: boolean;
        borderRight?: boolean;
        borderBottom?: boolean;
        borderLeft?: boolean;

        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
    };
}

export default function Heading({ config, sectionType }: ModuleProps) {
    const {
        heading,
        subheading,
        tag = 'h2',
        align = 'center',
        styles = {}
    } = config as HeadingConfig;

    // Dynamically load fonts used in this component
    const fontsToLoad = [];
    if (styles?.fontFamily) fontsToLoad.push(styles.fontFamily);
    if (styles?.subFontFamily) fontsToLoad.push(styles.subFontFamily);
    useDynamicFonts(fontsToLoad);

    if (!heading && !subheading) {
        return null;
    }

    const Tag = tag;

    // Construct container styles (padding, background, border)
    const containerStyle: React.CSSProperties = {
        textAlign: align,
        backgroundColor: styles.backgroundColor || 'transparent',
        paddingTop: styles.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        paddingLeft: styles.paddingLeft ? `${styles.paddingLeft}px` : undefined,
        paddingRight: styles.paddingRight ? `${styles.paddingRight}px` : undefined,

        // Borders
        borderStyle: 'solid',
        borderColor: styles.borderColor || 'transparent',
        borderWidth: 0, // Reset default
        borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,

        borderTopWidth: styles.borderTop ? `${styles.borderWidth || 1}px` : 0,
        borderBottomWidth: styles.borderBottom ? `${styles.borderWidth || 1}px` : 0,
        borderLeftWidth: styles.borderLeft ? `${styles.borderWidth || 1}px` : 0,
        borderRightWidth: styles.borderRight ? `${styles.borderWidth || 1}px` : 0,
    };

    // Heading specific styles
    const headingStyle: React.CSSProperties = {
        fontFamily: formatFontFamily(styles.fontFamily),
        fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
        fontWeight: styles.fontWeight,
        color: styles.color,
        margin: 0,
        lineHeight: 1.2,
    };

    // Subheading styles
    const subheadingStyle: React.CSSProperties = {
        fontFamily: formatFontFamily(styles.subFontFamily || styles.fontFamily),
        fontSize: styles.subFontSize ? `${styles.subFontSize}px` : (styles.fontSize ? `${Math.max(14, styles.fontSize * 0.6)}px` : '18px'),
        fontWeight: styles.subFontWeight || 400,
        color: styles.subColor || styles.color,
        marginTop: '0.5em',
        lineHeight: 1.4,
    };

    const containerClass = sectionType === 'full-width' ? 'container mx-auto px-4' : '';

    return (
        <div className={containerClass}>
            <div style={containerStyle}>
                {heading && (
                    <Tag style={headingStyle}>
                        {heading}
                    </Tag>
                )}
                {subheading && (
                    <div style={subheadingStyle}>
                        {subheading}
                    </div>
                )}
            </div>
        </div>
    );
}
