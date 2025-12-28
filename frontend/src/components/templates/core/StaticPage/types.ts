// StaticPage Types - Shared interfaces for static/CMS pages

export interface PageData {
    _id: string;
    title: string;
    slug: string;
    content: string;
    featuredImage?: string;
    status: 'draft' | 'published';
    useLayout: boolean;
    layoutId?: any;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
    };
}

export interface StaticPageConfig {
    showTitle: boolean;
    showBreadcrumbs: boolean;
    containerWidth: 'narrow' | 'medium' | 'full';
}

export interface StaticPageTemplateProps {
    page: PageData;
    config: StaticPageConfig;
    templateId: string;
    layout: any;
}

export const DEFAULT_STATIC_PAGE_CONFIG: StaticPageConfig = {
    showTitle: true,
    showBreadcrumbs: true,
    containerWidth: 'medium',
};
