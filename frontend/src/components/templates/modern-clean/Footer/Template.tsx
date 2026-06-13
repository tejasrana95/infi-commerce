

// Modern Clean Footer Template - Dynamic rendering based on admin configuration
// Supports multiple rows, columns, and various element types

import React from 'react';
// import { useStore } from '@/providers/StoreProvider';
import { FooterElementRenderer } from './FooterElements';
import { FooterSection, FooterRow, FooterColumn, FooterElement } from '@/types/store';
import styles from './Footer.module.scss';

interface ModernCleanFooterTemplateProps {
    config?: {
        sections?: FooterSection[];
    } | null;
    store?: {
        theme?: {
            footer?: {
                sections?: FooterSection[];
            } | null;
            colors?: {
                primary?: string;
                secondary?: string;
                accent?: string;
                background?: string;
            };
        };
    } | null;
}

export default function ModernCleanFooterTemplate(props: ModernCleanFooterTemplateProps) {
    const { config, store } = props;
    const footerConfig = config || store?.theme?.footer;
    const colors = store?.theme?.colors;

    if (!footerConfig || !footerConfig.sections) {
        return null;
    }

    // Get sections
    const columnsSection = footerConfig.sections.find((s: FooterSection) => s.type === 'columns');
    const bottomBarSection = footerConfig.sections.find((s: FooterSection) => s.type === 'bottom-bar');

    // Get rows from columns section
    const rows = columnsSection?.rows || [];

    // Prepare CSS variables for theming - set once on root
    const footerStyles = {
        '--footer-bg-start': columnsSection?.backgroundColor || colors?.secondary || '#1a1a2e',
        '--footer-bg-end': columnsSection?.backgroundColor || colors?.secondary || '#16213e',
        '--footer-text': columnsSection?.textColor || colors?.background || '#ffffff',
        '--footer-accent': colors?.accent || colors?.primary || '#667eea',
        '--footer-primary': colors?.primary || '#667eea',
        '--footer-bottom-bg': bottomBarSection?.backgroundColor || '#000000',
        '--footer-bottom-text': bottomBarSection?.textColor || '#888888',
        '--footer-bottom-border-style': bottomBarSection?.showTopBorder ? 'solid' : 'none',
        '--footer-bottom-border-color': bottomBarSection?.borderColor || 'rgba(255, 255, 255, 0.1)',
        '--footer-bottom-border-padding': bottomBarSection?.borderPadding !== undefined ? `${bottomBarSection.borderPadding}px` : '20px',
    } as React.CSSProperties;

    return (
        <footer className={styles.footer} style={footerStyles}>
            {/* Main Footer - Rows and Columns */}
            {columnsSection && rows.length > 0 && (
                <div className={styles.footerMain}>
                    <div className={styles.container}>
                        {rows.map((row: FooterRow, rowIndex: number) => (
                            <div
                                key={row.id}
                                className={styles.footerRow}
                                style={{
                                    '--animation-delay': `${rowIndex * 0.1}s`,
                                    '--row-justify': row.settings?.position === 'center'
                                        ? 'center'
                                        : row.settings?.position === 'right'
                                            ? 'flex-end'
                                            : 'flex-start',
                                    '--row-heading-font-family': row.settings?.headingFontFamily || 'inherit',
                                    '--row-heading-font-size': `${row.settings?.headingFontSize || 16}px`,
                                    '--row-heading-color': row.settings?.headingColor || 'inherit',
                                    '--row-heading-align': row.settings?.headingAlign || 'left',
                                    '--row-content-align': row.settings?.headingAlign === 'center'
                                        ? 'center'
                                        : row.settings?.headingAlign === 'right'
                                            ? 'flex-end'
                                            : 'flex-start',
                                    '--row-column-gap': `${row.settings?.columnGap ?? 16}px`,
                                    '--row-padding-top': row.settings?.showPadding !== false ? `${row.settings?.rowPaddingTop ?? 24}px` : '0px',
                                    '--row-padding-bottom': row.settings?.showPadding !== false ? `${row.settings?.rowPaddingBottom ?? 24}px` : '0px',
                                    '--row-border-style': row.settings?.showBorder ? 'solid' : 'none',
                                    '--row-border-color': row.settings?.borderColor || 'rgba(255, 255, 255, 0.1)',
                                } as React.CSSProperties}
                            >
                                <div className={styles.footerFlexGrid}>
                                    {row.columns.map((column: FooterColumn, colIndex: number) => {
                                        // Calculate column span based on width (1-12)
                                        const colSpan = Math.max(1, Math.min(12, column.width));
                                        const desktopAlign = column.settings?.contentAlign?.desktop || row.settings?.headingAlign || 'left';
                                        const tabletAlign = column.settings?.contentAlign?.tablet || desktopAlign;
                                        const mobileAlign = column.settings?.contentAlign?.mobile || tabletAlign;
                                        const alignToJustify = (align: 'left' | 'center' | 'right') => (
                                            align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
                                        );

                                        return (
                                            <div
                                                key={column.id}
                                                className={styles.footerColumn}
                                                style={{
                                                    flexBasis: `${(colSpan / 12) * 100}%`,
                                                    maxWidth: `${(colSpan / 12) * 100}%`,
                                                    '--column-delay': `${(rowIndex * 0.1) + (colIndex * 0.05)}s`,
                                                    '--col-align-desktop': desktopAlign,
                                                    '--col-align-tablet': tabletAlign,
                                                    '--col-align-mobile': mobileAlign,
                                                    '--col-justify-desktop': alignToJustify(desktopAlign),
                                                    '--col-justify-tablet': alignToJustify(tabletAlign),
                                                    '--col-justify-mobile': alignToJustify(mobileAlign),
                                                } as React.CSSProperties}
                                            >
                                                {/* Column Title */}
                                                {column.title && (
                                                    <h3>{column.title}</h3>
                                                )}

                                                {/* Column Elements */}
                                                <div className={`${styles.footerColumnElements} space-y-4`}>
                                                    {column.items.map((element: FooterElement) => (
                                                        <FooterElementRenderer
                                                            key={element.id}
                                                            element={element}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Bar */}
            {bottomBarSection && (
                <div className={styles.footerBottomBar}>
                    <div className={styles.container}>
                        <p>{bottomBarSection.bottomBarContent || `© ${new Date().getFullYear()} All rights reserved.`}</p>
                    </div>
                </div>
            )}
        </footer>
    );
}
