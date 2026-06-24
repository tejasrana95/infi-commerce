'use client';

import React, { useState } from 'react';
import { ModuleProps } from '../..';
import styles from './TextBlock.module.scss';

interface TextBlockConfig {
    content: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    alignmentTablet?: 'left' | 'center' | 'right' | 'justify';
    alignmentMobile?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
    padding?: number;
    maxWidth?: string;
    textColor?: string;
    backgroundColor?: string;
    // Collapse options
    enableCollapse?: boolean;
    defaultState?: 'collapsed' | 'expanded';
    linesToShow?: number;
    expandLabel?: string;
    collapseLabel?: string;
}

export default function TextBlockModule({ config }: ModuleProps) {
    const {
        content,
        alignment = 'left',
        alignmentTablet,
        alignmentMobile,
        fontSize = 'medium',
        fontWeight = 'normal',
        padding = 16,
        maxWidth,
        textColor,
        backgroundColor,
        enableCollapse = false,
        defaultState = 'expanded',
        linesToShow = 3,
        expandLabel = 'Read More',
        collapseLabel = 'Show Less',
    } = config as TextBlockConfig;

    const id = React.useId().replace(/:/g, '');
    const blockId = `textblock-${id}`;

    const [isExpanded, setIsExpanded] = useState(defaultState === 'expanded');

    if (!content) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.emptyState}>
                        <p>No content provided for text block</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const sizeClass = styles[`size${fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}`];
    const weightClass = styles[`weight${fontWeight.charAt(0).toUpperCase() + fontWeight.slice(1)}`];

    // Calculate collapsed height based on line-height and lines to show
    const collapsedHeight = `calc(${linesToShow} * 1.8em)`;

    const mobileAlign = alignmentMobile || alignment;
    const tabletAlign = alignmentTablet || alignment;
    const desktopAlign = alignment;

    const marginMobile = mobileAlign === 'center' ? 'margin-left: auto; margin-right: auto;' : mobileAlign === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-left: 0; margin-right: auto;';
    const marginTablet = tabletAlign === 'center' ? 'margin-left: auto; margin-right: auto;' : tabletAlign === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-left: 0; margin-right: auto;';
    const marginDesktop = desktopAlign === 'center' ? 'margin-left: auto; margin-right: auto;' : desktopAlign === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-left: 0; margin-right: auto;';

    const styleContent = `
        #${blockId} {
            text-align: ${mobileAlign};
            ${marginMobile}
        }
        @media (min-width: 768px) {
            #${blockId} {
                text-align: ${tabletAlign};
                ${marginTablet}
            }
        }
        @media (min-width: 1024px) {
            #${blockId} {
                text-align: ${desktopAlign};
                ${marginDesktop}
            }
        }
    `;

    return (
        <div className={styles.container}>
            <style dangerouslySetInnerHTML={{ __html: styleContent }} />
            <div
                className={`${styles.contentWrapper} ${enableCollapse ? styles.animatable : ''} ${!isExpanded ? styles.collapsed : ''}`}
                style={{
                    '--collapsed-height': collapsedHeight,
                } as React.CSSProperties}
            >
                <div
                    id={blockId}
                    className={`${styles.textBlock} ${sizeClass} ${weightClass}`}
                    style={{
                        padding: `${padding}px`,
                        maxWidth: maxWidth || undefined,
                        color: textColor || undefined,
                        backgroundColor: backgroundColor || undefined,
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            </div>
            {enableCollapse && (
                <div className={styles.toggleContainer}>
                    <button
                        className={styles.toggleButton}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                    >
                        {isExpanded ? collapseLabel : expandLabel}
                        <svg
                            className={`${styles.toggleIcon} ${isExpanded ? styles.rotated : ''}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
