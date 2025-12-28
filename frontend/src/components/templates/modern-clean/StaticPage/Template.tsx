// Modern Clean StaticPage Template - Layout-driven architecture

'use client';

import React from 'react';
import ModuleRenderer from '@/components/core/layout/ModuleRenderer';
import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { StaticPageTemplateProps } from '@/components/templates/core/StaticPage/types';
import styles from './StaticPage.module.scss';

export default function ModernCleanStaticPageTemplate({
    page,
    config,
    templateId,
    layout,
}: StaticPageTemplateProps) {
    const sections = layout?.sections || [];
    // Custom module rendering function for layout sections
    const renderModule = (module: any) => {
        switch (module.type) {
            case 'page-content':
            case 'page-hero':
                // Pass page data to the PageContent and PageHero modules
                return (
                    <ModuleRenderer
                        key={module.id}
                        module={{
                            ...module,
                            config: {
                                ...module.config,
                                pageData: page,
                            },
                        }}
                    />
                );
            default:
                return <ModuleRenderer key={module.id} module={module} />;
        }
    };

    // Render section with custom module handling
    const renderSection = (section: any) => {
        return (
            <SectionRenderer
                key={section.id}
                section={section}
                renderModule={(module) => renderModule(module)}
            />
        );
    };

    return (
        <div className={styles.staticPage}>
            {/* Main Content */}
            {sections.length > 0 ? (
                sections.map((section: any) => renderSection(section))
            ) : (
                <div className={styles.fallback}>
                    <p>No layout configured for this page. Please add modules in the admin panel.</p>
                </div>
            )}
        </div>
    );
}
