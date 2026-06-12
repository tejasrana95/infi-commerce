'use client';

import React from 'react';
import Link from 'next/link';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import { ModuleProps } from '../..';
import styles from './IconList.module.scss';

type Direction = 'horizontal' | 'vertical';
type IconPosition = 'left' | 'top' | 'right' | 'bottom';
type TextAlign = 'left' | 'center' | 'right';

interface IconListItem {
    id?: string;
    icon?: string;
    title?: string;
    description?: string;
    link?: string;
    openInNewTab?: boolean;
}

interface IconListConfig {
    direction?: Direction;
    iconColor?: string;
    titleColor?: string;
    descriptionColor?: string;
    iconPosition?: IconPosition;
    textAlign?: TextAlign;
    showRoundBackground?: boolean;
    showBorder?: boolean;
    borderWidth?: number;
    borderColor?: string;
    items?: IconListItem[];
}

export default function IconListModule({ config }: ModuleProps) {
    const {
        direction = 'vertical',
        iconColor = '#3b82f6',
        titleColor = '#1f2937',
        descriptionColor = '#4b5563',
        iconPosition = 'left',
        textAlign = 'left',
        showRoundBackground = false,
        showBorder = false,
        borderWidth = 1,
        borderColor = '#e5e7eb',
        items = [],
    } = config as IconListConfig;

    if (!items || items.length === 0) return null;

    const listStyle = {
        '--icon-list-icon-color': iconColor,
        '--icon-list-title-color': titleColor,
        '--icon-list-desc-color': descriptionColor,
        '--icon-list-border-color': borderColor,
        '--icon-list-border-width': `${borderWidth}px`,
        '--icon-list-text-align': textAlign,
    } as React.CSSProperties;

    return (
        <div 
            className={`${styles.iconList} ${styles[direction]} ${showBorder ? styles.hasBorder : ''}`} 
            style={listStyle}
        >
            {items.map((item, index) => {
                const isLink = !!item.link;
                const key = item.id || `${item.title || 'item'}-${index}`;
                
                const content = (
                    <>
                        <div className={`${styles.iconContainer} ${showRoundBackground ? styles.roundBackground : ''}`}>
                            <span className={styles.iconWrap}>
                                <DynamicIcon name={item.icon || 'FaCheck'} size={20} />
                            </span>
                        </div>
                        <div className={styles.copy}>
                            {item.title && <h4 className={styles.title}>{item.title}</h4>}
                            {item.description && <p className={styles.description}>{item.description}</p>}
                        </div>
                    </>
                );

                const itemClass = `${styles.item} ${styles[`icon-${iconPosition}`]}`;

                if (isLink && item.link) {
                    const isExternal = item.link.startsWith('http://') || item.link.startsWith('https://');
                    if (isExternal) {
                        return (
                            <a
                                key={key}
                                href={item.link}
                                target={item.openInNewTab ? '_blank' : undefined}
                                rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                                className={itemClass}
                            >
                                {content}
                            </a>
                        );
                    }
                    return (
                        <Link 
                            key={key} 
                            href={item.link}
                            target={item.openInNewTab ? '_blank' : undefined}
                            className={itemClass}
                        >
                            {content}
                        </Link>
                    );
                }

                return (
                    <div key={key} className={itemClass}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}
