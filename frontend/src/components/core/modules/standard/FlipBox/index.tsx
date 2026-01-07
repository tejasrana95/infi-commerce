import React from 'react';
import { ModuleProps } from '../../index';
import CTAButton from '@/components/molecules/CTAButton';
import styles from './FlipBox.module.scss';

interface FlipBoxItem {
    frontImage: string;
    frontTitle: string;
    frontSubtitle: string;
    backDescription: string;
    ctaText: string;
    ctaUrl: string;
}

interface FlipBoxModuleConfig {
    items?: FlipBoxItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
        itemsPerRow?: number;
    };
    typography?: {
        frontTitleFontSize?: number;
        frontTitleFontWeight?: string;
        frontTitleColor?: string;
        frontSubtitleFontSize?: number;
        frontSubtitleColor?: string;
        backDescriptionFontSize?: number;
        backDescriptionColor?: string;
    };
    flipDirection?: 'horizontal' | 'vertical';
    // Legacy single item support
    frontImage?: string;
    frontTitle?: string;
    frontSubtitle?: string;
    backDescription?: string;
    ctaText?: string;
    ctaUrl?: string;
}

export default function FlipBox({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as FlipBoxModuleConfig;

    // Handle legacy single-item config
    const items = config.items || (config.frontTitle ? [{
        frontImage: config.frontImage || '',
        frontTitle: config.frontTitle,
        frontSubtitle: config.frontSubtitle || '',
        backDescription: config.backDescription || '',
        ctaText: config.ctaText || '',
        ctaUrl: config.ctaUrl || '#',
    }] : []);

    const layout = config.layout || { direction: 'row', gap: 24, itemsPerRow: 3 };
    const typography = config.typography || {};
    const flipDirection = config.flipDirection || 'horizontal';

    if (items.length === 0) {
        return null;
    }

    const containerStyle: React.CSSProperties = {
        display: 'grid',
        gap: `${layout.gap || 24}px`,
        gridTemplateColumns: layout.direction === 'row'
            ? `repeat(${layout.itemsPerRow || 3}, 1fr)`
            : '1fr',
    };

    return (
        <div className={styles.container} style={containerStyle}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`${styles.flipBox} ${flipDirection === 'vertical' ? styles.vertical : ''}`}
                >
                    <div className={styles.flipBoxInner}>
                        {/* Front */}
                        <div
                            className={styles.flipBoxFront}
                            style={{
                                backgroundImage: item.frontImage ? `url(${item.frontImage})` : undefined,
                            }}
                        >
                            <div className={styles.frontContent}>
                                <h3
                                    className={styles.frontTitle}
                                    style={{
                                        fontSize: `${typography.frontTitleFontSize || 24}px`,
                                        fontWeight: typography.frontTitleFontWeight || 'bold',
                                        color: typography.frontTitleColor || '#ffffff',
                                    }}
                                >
                                    {item.frontTitle}
                                </h3>
                                <p
                                    className={styles.frontSubtitle}
                                    style={{
                                        fontSize: `${typography.frontSubtitleFontSize || 14}px`,
                                        color: typography.frontSubtitleColor || '#e0e0e0',
                                    }}
                                >
                                    {item.frontSubtitle}
                                </p>
                            </div>
                        </div>

                        {/* Back */}
                        <div className={styles.flipBoxBack}>
                            <div className={styles.backContent}>
                                <p
                                    className={styles.backDescription}
                                    style={{
                                        fontSize: `${typography.backDescriptionFontSize || 14}px`,
                                        color: typography.backDescriptionColor || '#333333',
                                    }}
                                >
                                    {item.backDescription}
                                </p>
                                {item.ctaText && item.ctaUrl && (
                                    <CTAButton
                                        text={item.ctaText}
                                        link={item.ctaUrl}
                                        variant="contained"
                                        size="medium"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
