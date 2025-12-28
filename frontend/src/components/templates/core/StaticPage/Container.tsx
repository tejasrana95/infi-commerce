// StaticPage Container - Business logic for static/CMS pages

'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { getComponent } from '@/components/templates/registry';
import {
    PageData,
    StaticPageConfig,
    StaticPageTemplateProps,
    DEFAULT_STATIC_PAGE_CONFIG,
} from './types';

interface StaticPageContainerProps {
    page: PageData;
    initialLayout?: any;
}

export default function StaticPageContainer({ page, initialLayout = null }: StaticPageContainerProps) {
    const { store } = useStore();

    // Get config from theme
    const config: StaticPageConfig = useMemo(() => {
        const storeConfig = (store?.theme as any)?.staticPage || {};
        return {
            showTitle: storeConfig.showTitle ?? DEFAULT_STATIC_PAGE_CONFIG.showTitle,
            showBreadcrumbs: storeConfig.showBreadcrumbs ?? DEFAULT_STATIC_PAGE_CONFIG.showBreadcrumbs,
            containerWidth: storeConfig.containerWidth ?? DEFAULT_STATIC_PAGE_CONFIG.containerWidth,
        };
    }, [(store?.theme as any)?.staticPage]);

    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the template component
    const StaticPageTemplate = getComponent<StaticPageTemplateProps>(
        'StaticPageTemplate',
        templateId
    );
    return (
        <StaticPageTemplate
            page={page}
            config={config}
            templateId={templateId}
            layout={initialLayout}
        />
    );
}
