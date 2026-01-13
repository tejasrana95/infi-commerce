'use client';

import React, { useEffect, useRef } from 'react';
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

export default function Marquee({ config: moduleConfig }: ModuleProps) {
    const config = moduleConfig as MarqueeModuleConfig;
    const items = config.items || [];
    const typography = config.typography || {};
    const speed = config.speed || 30;
    const direction = config.direction || 'left';
    const pauseOnHover = config.pauseOnHover !== false;
    const backgroundColor = config.backgroundColor || '#f8f9fa';
    const iconSize = config.iconSize || 24;
    const iconColor = config.iconColor || '#1976d2';

    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const isPausedRef = useRef(false);

    useEffect(() => {
        const container = containerRef.current;
        const content = contentRef.current;

        if (!container || !content || items.length === 0) return;

        // Get the width of one set of items
        const firstGroup = content.querySelector(`.${styles.marqueeGroup}`) as HTMLElement;
        if (!firstGroup) return;

        const groupWidth = firstGroup.offsetWidth;
        const gap = 48; // Gap between groups
        const scrollDistance = groupWidth + gap; // Include gap in scroll distance

        let scrollPosition = 0;
        const pixelsPerSecond = scrollDistance / speed;
        let lastTimestamp = 0;

        const animate = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000; // Convert to seconds
            lastTimestamp = timestamp;

            if (!isPausedRef.current) {
                if (direction === 'left') {
                    scrollPosition += pixelsPerSecond * deltaTime;
                } else {
                    scrollPosition -= pixelsPerSecond * deltaTime;
                }

                // Reset when we've scrolled past one full group (including its gap)
                if (scrollPosition >= scrollDistance) {
                    scrollPosition = scrollPosition % scrollDistance;
                } else if (scrollPosition <= -scrollDistance) {
                    scrollPosition = scrollPosition % scrollDistance;
                }

                content.style.transform = `translateX(-${scrollPosition}px)`;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [items, speed, direction]);

    if (items.length === 0) {
        return null;
    }

    const renderItems = () => (
        <>
            {items.map((item, index) => (
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
        </>
    );

    const handleMouseEnter = () => {
        if (pauseOnHover) {
            isPausedRef.current = true;
        }
    };

    const handleMouseLeave = () => {
        if (pauseOnHover) {
            isPausedRef.current = false;
        }
    };

    return (
        <div
            ref={containerRef}
            className={styles.marquee}
            style={{ backgroundColor }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div ref={contentRef} className={styles.marqueeContent}>
                <div className={styles.marqueeGroup}>
                    {renderItems()}
                </div>
                <div className={styles.marqueeGroup} aria-hidden="true">
                    {renderItems()}
                </div>
                <div className={styles.marqueeGroup} aria-hidden="true">
                    {renderItems()}
                </div>
                <div className={styles.marqueeGroup} aria-hidden="true">
                    {renderItems()}
                </div>
                <div className={styles.marqueeGroup} aria-hidden="true">
                    {renderItems()}
                </div>
            </div>
        </div>
    );
}
