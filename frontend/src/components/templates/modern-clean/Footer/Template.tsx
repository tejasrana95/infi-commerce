'use client';

// Modern Clean Footer Template - Dynamic rendering based on admin configuration
// Supports multiple rows, columns, and various element types

import React from 'react';
import { useStore } from '@/providers/StoreProvider';
import { FooterElementRenderer } from './FooterElements';
import { FooterSection, FooterColumn, FooterElement } from '@/types/store';
import styles from './Footer.module.scss';

export default function ModernCleanFooterTemplate() {
    const { themeConfig } = useStore();
    const footerConfig = themeConfig?.footer;
    const colors = themeConfig?.colors;

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
    } as React.CSSProperties;

    return (
        <footer className={styles.footer} style={footerStyles}>
            {/* Main Footer - Rows and Columns */}
            {columnsSection && rows.length > 0 && (
                <div className={styles.footerMain}>
                    <div className={styles.container}>
                        {rows.map((row: { id: string; columns: FooterColumn[] }, rowIndex: number) => (
                            <div
                                key={row.id}
                                className={styles.footerRow}
                                style={{
                                    '--animation-delay': `${rowIndex * 0.1}s`,
                                } as React.CSSProperties}
                            >
                                <div className={styles.grid}>
                                    {row.columns.map((column: FooterColumn, colIndex: number) => {
                                        // Calculate column span based on width (1-12)
                                        const colSpan = Math.max(1, Math.min(12, column.width));

                                        return (
                                            <div
                                                key={column.id}
                                                className={styles.footerColumn}
                                                style={{
                                                    gridColumn: `span ${colSpan}`,
                                                    '--column-delay': `${(rowIndex * 0.1) + (colIndex * 0.05)}s`,
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

            {/* Fallback for empty footer */}
            {(!columnsSection || rows.length === 0) && !bottomBarSection && (
                <div className={styles.footerFallback}>
                    <div className={styles.container}>
                        <p>© {new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            )}
        </footer>
    );
}
