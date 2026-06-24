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
    alignTablet?: 'left' | 'center' | 'right';
    alignMobile?: 'left' | 'center' | 'right';
    headingStyle?: 'plain' | 'bottom-accent' | 'double-line' | 'background-ribbon';
    subheadingFirst?: boolean;
    styles?: {
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: number;
        color?: string;
        textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

        subFontFamily?: string;
        subFontSize?: number;
        subFontWeight?: number;
        subColor?: string;
        subTextTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';

        backgroundColor?: string;
        decorationColor?: string;

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
        alignTablet,
        alignMobile,
        headingStyle = 'plain',
        subheadingFirst = false,
        styles = {}
    } = config as HeadingConfig;

    const id = React.useId().replace(/:/g, '');
    const headingId = `heading-${id}`;

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
    const baseHeadingStyle: React.CSSProperties = {
        fontFamily: formatFontFamily(styles.fontFamily),
        fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
        fontWeight: styles.fontWeight,
        color: styles.color,
        margin: 0,
        lineHeight: 1.2,
        textTransform: styles.textTransform || 'none',
    };

    // Subheading styles
    const subheadingStyle: React.CSSProperties = {
        fontFamily: formatFontFamily(styles.subFontFamily || styles.fontFamily),
        fontSize: styles.subFontSize ? `${styles.subFontSize}px` : (styles.fontSize ? `${Math.max(14, styles.fontSize * 0.6)}px` : '18px'),
        fontWeight: styles.subFontWeight || 400,
        color: styles.subColor || styles.color,
        marginTop: subheadingFirst ? 0 : '0.5em',
        marginBottom: subheadingFirst ? '0.5em' : 0,
        lineHeight: 1.4,
        textTransform: styles.subTextTransform || 'none',
    };

    const containerClass = sectionType === 'full-width' ? 'container mx-auto px-4' : '';

    const renderHeadingText = () => {
        if (!heading) return null;

        const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
        const decorColor = styles.decorationColor || styles.color || '#3b82f6';

        switch (headingStyle) {
            case 'bottom-accent':
                return (
                    <div className="heading-accent-wrapper" style={{ display: 'inline-flex', flexDirection: 'column' }}>
                        <Tag style={baseHeadingStyle}>
                            {heading}
                        </Tag>
                        <div style={{ width: '48px', height: '3px', backgroundColor: decorColor, marginTop: '10px', borderRadius: '2px' }} />
                    </div>
                );

            case 'double-line':
                return (
                    <div className="heading-flex-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '0 1 60px' }}>
                            <span style={{ height: '1px', backgroundColor: decorColor }} />
                            <span style={{ height: '1px', backgroundColor: decorColor }} />
                        </div>
                        <Tag style={baseHeadingStyle}>
                            {heading}
                        </Tag>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '0 1 60px' }}>
                            <span style={{ height: '1px', backgroundColor: decorColor }} />
                            <span style={{ height: '1px', backgroundColor: decorColor }} />
                        </div>
                    </div>
                );

            case 'background-ribbon':
                return (
                    <div style={{
                        display: 'inline-flex',
                        padding: '8px 20px',
                        backgroundColor: decorColor ? `color-mix(in srgb, ${decorColor} 8%, #f8fafc)` : '#f1f5f9',
                        borderLeft: `4px solid ${decorColor}`,
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        <Tag style={baseHeadingStyle}>
                            {heading}
                        </Tag>
                    </div>
                );

            case 'plain':
            default:
                return (
                    <Tag style={baseHeadingStyle}>
                        {heading}
                    </Tag>
                );
        }
    };

    const mobileAlign = alignMobile || align;
    const tabletAlign = alignTablet || align;
    const desktopAlign = align;

    const justifyMobile = mobileAlign === 'left' ? 'flex-start' : mobileAlign === 'right' ? 'flex-end' : 'center';
    const justifyTablet = tabletAlign === 'left' ? 'flex-start' : tabletAlign === 'right' ? 'flex-end' : 'center';
    const justifyDesktop = desktopAlign === 'left' ? 'flex-start' : desktopAlign === 'right' ? 'flex-end' : 'center';

    const itemsMobile = mobileAlign === 'left' ? 'flex-start' : mobileAlign === 'right' ? 'flex-end' : 'center';
    const itemsTablet = tabletAlign === 'left' ? 'flex-start' : tabletAlign === 'right' ? 'flex-end' : 'center';
    const itemsDesktop = desktopAlign === 'left' ? 'flex-start' : desktopAlign === 'right' ? 'flex-end' : 'center';

    const styleContent = `
        #${headingId} {
            text-align: ${mobileAlign};
        }
        #${headingId} .heading-accent-wrapper {
            align-items: ${itemsMobile};
        }
        #${headingId} .heading-flex-wrapper {
            justify-content: ${justifyMobile};
        }
        @media (min-width: 768px) {
            #${headingId} {
                text-align: ${tabletAlign};
            }
            #${headingId} .heading-accent-wrapper {
                align-items: ${itemsTablet};
            }
            #${headingId} .heading-flex-wrapper {
                justify-content: ${justifyTablet};
            }
        }
        @media (min-width: 1024px) {
            #${headingId} {
                text-align: ${desktopAlign};
            }
            #${headingId} .heading-accent-wrapper {
                align-items: ${itemsDesktop};
            }
            #${headingId} .heading-flex-wrapper {
                justify-content: ${justifyDesktop};
            }
        }
    `;

    return (
        <div className={containerClass}>
            <style dangerouslySetInnerHTML={{ __html: styleContent }} />
            <div id={headingId} style={containerStyle}>
                {subheadingFirst ? (
                    <>
                        {subheading && (
                            <div style={subheadingStyle}>
                                {subheading}
                            </div>
                        )}
                        {renderHeadingText()}
                    </>
                ) : (
                    <>
                        {renderHeadingText()}
                        {subheading && (
                            <div style={subheadingStyle}>
                                {subheading}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
