'use client';

import React from 'react';
import DynamicIcon from '@/components/core/common/DynamicIcon';
import { ModuleProps } from '../..';
import styles from './IconGroup.module.scss';

type IconPosition = 'left' | 'top' | 'right' | 'bottom';
type TextAlign = 'left' | 'center' | 'right';

interface IconGroupItem {
    id?: string;
    icon?: string;
    title?: string;
    description?: string;
    link?: string;
    openInNewTab?: boolean;
}

interface IconGroupConfig {
    items?: IconGroupItem[];
    borderColor?: string;
    backgroundColor?: string;
    iconColor?: string;
    titleColor?: string;
    descriptionColor?: string;
    iconPosition?: IconPosition;
    textAlign?: TextAlign;
}

export default function IconGroupModule({ config }: ModuleProps) {
    const {
        items = [],
        borderColor = '#e8d8bd',
        backgroundColor = '#fffaf2',
        iconColor = '#6f5330',
        titleColor = '#1f2937',
        descriptionColor = '#6b7280',
        iconPosition = 'left',
        textAlign = 'left',
    } = config as IconGroupConfig;

    if (items.length === 0) return null;

    const groupStyle = {
        '--icon-group-border-color': borderColor,
        '--icon-group-background-color': backgroundColor,
        '--icon-group-icon-color': iconColor,
        '--icon-group-title-color': titleColor,
        '--icon-group-description-color': descriptionColor,
        '--icon-group-text-align': textAlign,
    } as React.CSSProperties;

    return (
        <div className={styles.iconGroup} style={groupStyle}>
            {items.map((item, index) => {
                const content = (
                    <>
                        <span className={styles.iconWrap}>
                            <DynamicIcon name={item.icon || 'FaStar'} size={24} />
                        </span>
                        <span className={styles.copy}>
                            {item.title && <span className={styles.title}>{item.title}</span>}
                            {item.description && <span className={styles.description}>{item.description}</span>}
                        </span>
                    </>
                );

                const className = `${styles.item} ${styles[`icon-${iconPosition}`]}`;
                const key = item.id || `${item.title || 'icon-group'}-${index}`;

                if (item.link) {
                    return (
                        <a
                            key={key}
                            href={item.link}
                            className={className}
                            target={item.openInNewTab ? '_blank' : undefined}
                            rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                        >
                            {content}
                        </a>
                    );
                }

                return (
                    <div key={key} className={className}>
                        {content}
                    </div>
                );
            })}
        </div>
    );
}
