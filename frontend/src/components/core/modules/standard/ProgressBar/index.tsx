import React from 'react';
import { ModuleProps } from '../../index';
import styles from './ProgressBar.module.scss';

interface ProgressBarItem {
    label: string;
    percentage: number;
    barColor: string;
}

interface ProgressBarModuleConfig {
    items?: ProgressBarItem[];
    layout?: {
        direction?: 'row' | 'column';
        gap?: number;
    };
    typography?: {
        labelFontSize?: number;
        labelFontWeight?: string;
        labelColor?: string;
        percentageFontSize?: number;
        percentageColor?: string;
    };
    barHeight?: number;
    // Legacy single item support
    title?: string;
    percentage?: number;
    barColor?: string;
}

export default function ProgressBar({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as ProgressBarModuleConfig;

    // Handle legacy single-item config
    const items = config.items || (config.title ? [{
        label: config.title,
        percentage: config.percentage || 0,
        barColor: config.barColor || '#2563eb',
    }] : []);

    const layout = config.layout || { direction: 'column', gap: 20 };
    const typography = config.typography || {};
    const barHeight = config.barHeight || 8;

    if (items.length === 0) {
        return null;
    }

    const containerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: layout.direction === 'row' ? 'row' : 'column',
        gap: `${layout.gap || 20}px`,
    };

    return (
        <div className={styles.container} style={containerStyle}>
            {items.map((item, index) => (
                <div key={index} className={styles.progressItem}>
                    <div className={styles.header}>
                        <span
                            className={styles.label}
                            style={{
                                fontSize: `${typography.labelFontSize || 16}px`,
                                fontWeight: typography.labelFontWeight || '600',
                                color: typography.labelColor || '#000',
                            }}
                        >
                            {item.label}
                        </span>
                        <span
                            className={styles.percentage}
                            style={{
                                fontSize: `${typography.percentageFontSize || 14}px`,
                                color: typography.percentageColor || '#666',
                            }}
                        >
                            {item.percentage}%
                        </span>
                    </div>
                    <div
                        className={styles.barBackground}
                        style={{ height: `${barHeight}px` }}
                    >
                        <div
                            className={styles.barFill}
                            style={{
                                width: `${item.percentage}%`,
                                backgroundColor: item.barColor,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
