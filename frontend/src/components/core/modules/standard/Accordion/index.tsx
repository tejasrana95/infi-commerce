'use client';

import React, { useState } from 'react';
import { ModuleProps } from '../../index';
import DynamicIcon from '../../../common/DynamicIcon';
import styles from './Accordion.module.scss';
import Image from 'next/image';

interface AccordionItem {
    title: string;
    content: string;
    icon?: string;
    image?: string;
}

interface AccordionConfig {
    title?: string;
    selectionMode?: 'single' | 'multiple';
    defaultState?: 'closed' | 'first' | 'all';
    variant?: 'default' | 'boxed' | 'separated';
    iconType?: 'none' | 'icon' | 'image';
    iconColor?: string;
    items?: AccordionItem[];
}

export default function Accordion({ config, sectionType }: ModuleProps) {
    const {
        title,
        selectionMode = 'single',
        defaultState = 'closed',
        variant = 'default',
        iconType = 'none',
        iconColor = '#d112ad',
        items = []
    } = config as AccordionConfig;

    const [openItems, setOpenItems] = useState<number[]>(() => {
        if (defaultState === 'all') {
            return items.map((_, idx) => idx);
        }
        if (defaultState === 'first' && items.length > 0) {
            return [0];
        }
        return [];
    });

    const toggleItem = (index: number) => {
        setOpenItems(prev => {
            const isOpen = prev.includes(index);

            if (selectionMode === 'single') {
                return isOpen ? [] : [index];
            } else {
                return isOpen
                    ? prev.filter(i => i !== index)
                    : [...prev, index];
            }
        });
    };

    if (!items || items.length === 0) {
        return null;
    }

    const containerClass = sectionType === 'full-width' ? 'container mx-auto px-4' : '';

    return (
        <div className={`py-6 ${containerClass} ${styles.accordionContainer}`}>
            {title && (
                <h2 className="text-2xl font-bold mb-6 text-gray-900">{title}</h2>
            )}

            <div className={variant === 'default' ? 'space-y-0' : 'space-y-4'}>
                {items.map((item, index) => {
                    const isOpen = openItems.includes(index);

                    const itemClasses = [
                        styles.item,
                        styles[`item_${variant}`]
                    ].filter(Boolean).join(' ');

                    return (
                        <div key={index} className={itemClasses}>
                            <button
                                className={styles.trigger}
                                onClick={() => toggleItem(index)}
                                aria-expanded={isOpen}
                                data-track="accordion_toggle"
                                data-accordion-title={item.title}
                                data-accordion-index={index}
                                data-accordion-action={isOpen ? 'collapse' : 'expand'}
                            >
                                <div className={styles.titleWrapper}>
                                    {iconType === 'icon' && item.icon && (
                                        <div className={styles.icon} style={{ color: iconColor }}>
                                            <DynamicIcon name={item.icon} size={28} />
                                        </div>
                                    )}
                                    {iconType === 'image' && item.image && (
                                        <div className={styles.image}>
                                            <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <span className={styles.title}>{item.title}</span>
                                </div>
                                <span className={`${styles.indicator} ${isOpen ? styles.isOpen : ''}`}>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </span>
                            </button>

                            <div
                                className={`${styles.contentWrapper} ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                            >
                                <div className={styles.content}>
                                    <div className="prose max-w-none whitespace-pre-wrap">
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
