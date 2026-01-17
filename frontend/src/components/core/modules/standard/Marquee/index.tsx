'use client';

import React from 'react';
import Marquee from 'react-fast-marquee';
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
    backgroundColor?: string;
    typography?: {
        textFontSize?: number;
        textFontWeight?: string;
        textColor?: string;
    };
    iconSize?: number;
    iconColor?: string;
}

export default function MarqueeModule({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as MarqueeModuleConfig;
    const items = config.items || [];
    const typography = config.typography || {};
    const speed = config.speed || 30;
    const direction = config.direction || 'left';
    const pauseOnHover = config.pauseOnHover !== false;
    const backgroundColor = config.backgroundColor || '#f8f9fa';
    const iconSize = config.iconSize || 24;
    const iconColor = config.iconColor || '#1976d2';

    if (items.length === 0) {
        return null;
    }

    const renderItems = () => {
        return items.map((item, index) => (
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
        ))
    };

    return (
        <div
            className={styles.marquee}
            style={{ backgroundColor }}
        >
            <Marquee
                speed={speed}
                direction={direction}
                pauseOnHover={pauseOnHover}
                gradient={false}
                className={styles.marqueeContent}
                autoFill={true}
            >
                {renderItems()}
            </Marquee>
        </div>
    );
}
