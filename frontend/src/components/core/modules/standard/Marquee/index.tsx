import React from 'react';
import { ModuleProps } from '../../index';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import styles from './Marquee.module.scss';

interface MarqueeItem {
    icon: string;
    text: string;
}

interface MarqueeModuleConfig {
    items?: MarqueeItem[];
    speed?: number;
    direction?: 'left' | 'right';
    pauseOnHover?: boolean;
    typography?: {
        textFontSize?: number;
        textFontWeight?: string;
        textColor?: string;
    };
    iconSize?: number;
    iconColor?: string;
}

export default function Marquee({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as MarqueeModuleConfig;
    const items = config.items || [];
    const typography = config.typography || {};
    const speed = config.speed || 30;
    const direction = config.direction || 'left';
    const pauseOnHover = config.pauseOnHover !== false;
    const iconSize = config.iconSize || 24;
    const iconColor = config.iconColor || '#1976d2';

    if (items.length === 0) {
        return null;
    }

    // Duplicate items for seamless loop
    const duplicatedItems = [...items, ...items];

    return (
        <div className={`${styles.marquee} ${pauseOnHover ? styles.pauseOnHover : ''}`}>
            <div
                className={styles.marqueeContent}
                style={{
                    animationDuration: `${speed}s`,
                    animationDirection: direction === 'right' ? 'reverse' : 'normal',
                }}
            >
                {duplicatedItems.map((item, index) => (
                    <div key={index} className={styles.marqueeItem}>
                        <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
                            <DynamicIcon
                                name={item.icon}
                                size={iconSize}
                            />
                        </span>
                        <span
                            className={styles.marqueeText}
                            style={{
                                fontSize: `${typography.textFontSize || 16}px`,
                                fontWeight: typography.textFontWeight || '500',
                                color: typography.textColor || '#000',
                            }}
                        >
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
