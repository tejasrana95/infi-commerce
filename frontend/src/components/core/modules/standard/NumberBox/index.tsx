import React from 'react';
import { ModuleProps } from '../../index';
import styles from './NumberBox.module.scss';

interface NumberBoxItem {
    number: string;
    title: string;
    description: string;
    icon?: string;
}

interface NumberBoxModuleConfig {
    items?: NumberBoxItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
        itemsPerRow?: number;
    };
    typography?: {
        numberFontSize?: number;
        numberFontWeight?: string;
        numberColor?: string;
        titleFontSize?: number;
        titleFontWeight?: string;
        titleColor?: string;
        descriptionFontSize?: number;
        descriptionColor?: string;
    };
    // Legacy single item support
    number?: string;
    title?: string;
    description?: string;
    color?: string;
    customColor?: string;
}

export default function NumberBox({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as NumberBoxModuleConfig;

    // Handle legacy single-item config
    const items = config.items || (config.number ? [{
        number: config.number,
        title: config.title || '',
        description: config.description || '',
    }] : []);

    const layout = config.layout || { direction: 'row', gap: 24, itemsPerRow: 3 };
    const typography = config.typography || {};

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
                <div key={index} className={styles.numberBox}>
                    <div
                        className={styles.number}
                        style={{
                            fontSize: `${typography.numberFontSize || 48}px`,
                            fontWeight: typography.numberFontWeight || 'bold',
                            color: typography.numberColor || '#1976d2',
                        }}
                    >
                        {item.number}
                    </div>
                    <h3
                        className={styles.title}
                        style={{
                            fontSize: `${typography.titleFontSize || 20}px`,
                            fontWeight: typography.titleFontWeight || '600',
                            color: typography.titleColor || '#000',
                        }}
                    >
                        {item.title}
                    </h3>
                    <p
                        className={styles.description}
                        style={{
                            fontSize: `${typography.descriptionFontSize || 14}px`,
                            color: typography.descriptionColor || '#666',
                        }}
                    >
                        {item.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
