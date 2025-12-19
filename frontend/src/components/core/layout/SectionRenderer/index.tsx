// Section Renderer - Renders layout sections with proper styling and structure

import { LayoutSection } from '@/types/layout';
import ModuleRenderer from '../ModuleRenderer';
import styles from './SectionRenderer.module.scss';

interface SectionRendererProps {
    section: LayoutSection;
}

export default function SectionRenderer({ section }: SectionRendererProps) {
    const { settings = {}, type, modules = [], columns, visibility = { desktop: true, tablet: true, mobile: true } } = section;

    // Apply visibility classes
    const visibilityClasses = [];
    if (!visibility.desktop) visibilityClasses.push(styles.hideDesktop);
    if (!visibility.tablet) visibilityClasses.push(styles.hideTablet);
    if (!visibility.mobile) visibilityClasses.push(styles.hideMobile);

    // Determine layout type
    const isFullWidth = type === 'full-width';
    const isSplit = type === 'split';

    // Build section styles
    const sectionStyles: React.CSSProperties = {
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: settings.backgroundSize || 'cover',
        backgroundPosition: settings.backgroundPosition || 'center',
        paddingTop: settings.paddingTop !== undefined ? `${settings.paddingTop}px` : undefined,
        paddingBottom: settings.paddingBottom !== undefined ? `${settings.paddingBottom}px` : undefined,
        paddingLeft: settings.paddingLeft !== undefined ? `${settings.paddingLeft}px` : undefined,
        paddingRight: settings.paddingRight !== undefined ? `${settings.paddingRight}px` : undefined,
        marginTop: settings.marginTop !== undefined ? `${settings.marginTop}px` : undefined,
        marginBottom: settings.marginBottom !== undefined ? `${settings.marginBottom}px` : undefined,
    };

    return (
        <section
            className={`${styles.section} ${visibilityClasses.join(' ')} ${settings.customClass || ''}`}
            style={sectionStyles}
            data-section-id={section.id}
            data-section-type={type}
        >
            <div
                className={isFullWidth ? styles.fullWidth : styles.container}
                style={{ maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : undefined }}
            >
                {isSplit && columns ? (
                    <div className={styles.splitGrid}>
                        {columns.map((column) => (
                            <div
                                key={column.id}
                                className={styles.column}
                                style={{ gridColumn: `span ${column.width}` }}
                            >
                                {column.modules.map(module => (
                                    <ModuleRenderer
                                        key={module.id}
                                        module={module}
                                        sectionSettings={settings}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    modules.map(module => (
                        <ModuleRenderer
                            key={module.id}
                            module={module}
                            sectionSettings={settings}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
