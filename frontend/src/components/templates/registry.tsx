import React from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_TEMPLATE_ID } from '@/types';

// ============================================
// Component Types
// ============================================

export type ComponentName =
    | 'Header'
    | 'HeaderTemplate'
    | 'Footer'
    | 'FooterTemplate'
    | 'HomePage'
    | 'HomePageTemplate'
    | 'ProductCard'
    | 'ProductCardTemplate'
    | 'CategoryCard'
    | 'CategoryCardTemplate'
    | 'CategoryPage'
    | 'CategoryPageTemplate'
    | 'ProductPage'
    | 'ProductPageTemplate'
    | 'AuthPage'
    | 'AuthPageTemplate'
    | 'ComparePage'
    | 'ComparePageTemplate'
    | 'SearchPage'
    | 'BlogListing'
    | 'BlogListingTemplate'
    | 'BlogPost'
    | 'BlogPostTemplate'
    | 'StaticPage'
    | 'StaticPageTemplate'
    | 'Banner';

// ============================================
// Dynamic Import Factories (code-split per template)
// ============================================

// Core Containers — Used by all templates as the business logic layer.
// These are statically imported because they are always needed regardless of template.
import CoreHeaderContainer from './core/Header/Container';
import CoreFooterContainer from './core/Footer/Container';
import CoreHomePageContainer from '@/components/core/HomePage';
import CoreProductCardContainer from './core/ProductCard/Container';
import CoreCategoryCardContainer from './core/CategoryCard/Container';
import CoreCategoryPageContainer from './core/CategoryPage/Container';
import CoreProductPageContainer from './core/ProductPage/Container';
import CoreSearchPageContainer from './core/SearchPage/Container';
import CoreBlogListingContainer from './core/BlogListing/Container';
import CoreBlogPostContainer from './core/BlogPost/Container';
import CoreStaticPageContainer from './core/StaticPage/Container';

// Core Templates (fallback) — dynamically imported
const CoreHeaderTemplate = dynamic(() => import('./core/Header/Template'));
const CoreFooterTemplate = dynamic(() => import('./core/Footer/Template'));
const CoreProductCardTemplate = dynamic(() => import('./core/ProductCard/Template'));
const CoreCategoryCardTemplate = dynamic(() => import('./core/CategoryCard/Template'));
const CoreAuthPageContainer = dynamic(() => import('./core/AuthPage/Container'));
const CoreComparePageContainer = dynamic(() => import('./core/ComparePage/Container'));

// ============================================
// Template-Specific Components (dynamically imported)
// Only the active template's JS gets downloaded by the client.
// ============================================

const TEMPLATE_COMPONENTS: Record<string, Record<string, React.ComponentType<any>>> = {
    'modern-clean': {
        // Containers (shared business logic)
        Header: CoreHeaderContainer,
        Footer: CoreFooterContainer,
        HomePage: CoreHomePageContainer,
        ProductCard: CoreProductCardContainer,
        CategoryCard: CoreCategoryCardContainer,
        CategoryPage: CoreCategoryPageContainer,
        ProductPage: CoreProductPageContainer,
        SearchPage: CoreSearchPageContainer,
        BlogListing: CoreBlogListingContainer,
        BlogPost: CoreBlogPostContainer,
        StaticPage: CoreStaticPageContainer,
        // Templates (pure presentation) — dynamically imported
        HeaderTemplate: dynamic(() => import('./modern-clean/Header/Template')),
        FooterTemplate: dynamic(() => import('./modern-clean/Footer/Template')),
        HomePageTemplate: dynamic(() => import('./modern-clean/HomePage/Template')),
        ProductCardTemplate: dynamic(() => import('./modern-clean/ProductCard/Template')),
        CategoryCardTemplate: dynamic(() => import('./modern-clean/CategoryCard/Template')),
        CategoryPageTemplate: dynamic(() => import('./modern-clean/CategoryPage/Template')),
        ProductPageTemplate: dynamic(() => import('./modern-clean/ProductPage/Template')),
        AuthPage: CoreAuthPageContainer,
        AuthPageTemplate: dynamic(() => import('./modern-clean/AuthPage/Template')),
        ComparePage: CoreComparePageContainer,
        ComparePageTemplate: dynamic(() => import('./modern-clean/ComparePage/Template')),
        BlogListingTemplate: dynamic(() => import('./modern-clean/BlogListing/Template')),
        BlogPostTemplate: dynamic(() => import('./modern-clean/BlogPost/Template')),
        StaticPageTemplate: dynamic(() => import('./modern-clean/StaticPage/Template')),
    },
    'classic-elegance': {
        // Containers (shared business logic)
        Header: CoreHeaderContainer,
        Footer: CoreFooterContainer,
        HomePage: CoreHomePageContainer,
        ProductCard: CoreProductCardContainer,
        CategoryCard: CoreCategoryCardContainer,
        CategoryPage: CoreCategoryPageContainer,
        ProductPage: CoreProductPageContainer,
        SearchPage: CoreSearchPageContainer,
        BlogListing: CoreBlogListingContainer,
        BlogPost: CoreBlogPostContainer,
        StaticPage: CoreStaticPageContainer,
        // Templates (pure presentation) — dynamically imported
        HeaderTemplate: dynamic(() => import('./classic-elegance/Header/Template')),
        FooterTemplate: dynamic(() => import('./classic-elegance/Footer/Template')),
        ProductCardTemplate: dynamic(() => import('./classic-elegance/ProductCard/Template')),
        CategoryCardTemplate: dynamic(() => import('./modern-clean/CategoryCard/Template')), // fallback
        CategoryPageTemplate: dynamic(() => import('./modern-clean/CategoryPage/Template')), // fallback
        ProductPageTemplate: dynamic(() => import('./modern-clean/ProductPage/Template')), // fallback
        AuthPage: CoreAuthPageContainer,
        AuthPageTemplate: dynamic(() => import('./modern-clean/AuthPage/Template')), // fallback
        ComparePage: CoreComparePageContainer,
        ComparePageTemplate: dynamic(() => import('./modern-clean/ComparePage/Template')),
        BlogListingTemplate: dynamic(() => import('./modern-clean/BlogListing/Template')),
        BlogPostTemplate: dynamic(() => import('./modern-clean/BlogPost/Template')),
        StaticPageTemplate: dynamic(() => import('./modern-clean/StaticPage/Template')),
        HomePageTemplate: dynamic(() => import('./modern-clean/HomePage/Template')), // fallback
    },
};

// ============================================
// Core (Fallback) Components
// ============================================

const CORE_COMPONENTS: Record<string, React.ComponentType<any>> = {
    Header: CoreHeaderContainer,
    HeaderTemplate: CoreHeaderTemplate,
    Footer: CoreFooterContainer,
    FooterTemplate: CoreFooterTemplate,
    HomePage: CoreHomePageContainer,
    ProductCard: CoreProductCardContainer,
    ProductCardTemplate: CoreProductCardTemplate,
    CategoryCard: CoreCategoryCardContainer,
    CategoryCardTemplate: CoreCategoryCardTemplate,
    CategoryPage: CoreCategoryPageContainer,
    CategoryPageTemplate: dynamic(() => import('./modern-clean/CategoryPage/Template')),
    ProductPage: CoreProductPageContainer,
    ProductPageTemplate: dynamic(() => import('./modern-clean/ProductPage/Template')),
    AuthPage: CoreAuthPageContainer,
    AuthPageTemplate: dynamic(() => import('./modern-clean/AuthPage/Template')),
    ComparePage: CoreComparePageContainer,
    ComparePageTemplate: dynamic(() => import('./modern-clean/ComparePage/Template')),
    SearchPage: CoreSearchPageContainer,
    BlogListing: CoreBlogListingContainer,
    BlogListingTemplate: dynamic(() => import('./modern-clean/BlogListing/Template')),
    BlogPost: CoreBlogPostContainer,
    BlogPostTemplate: dynamic(() => import('./modern-clean/BlogPost/Template')),
    StaticPage: CoreStaticPageContainer,
    StaticPageTemplate: dynamic(() => import('./modern-clean/StaticPage/Template')),
};

// ============================================
// Get Component Function
// ============================================

/**
 * Get the appropriate component for a template.
 * Falls back to core components if template variant doesn't exist.
 *
 * @param componentName - Name of the component (Header, Footer, etc.)
 * @param templateId - Template identifier (modern-clean, classic-elegance, etc.)
 * @returns React component
 */
export function getComponent<T = any>(
    componentName: ComponentName,
    templateId: string = DEFAULT_TEMPLATE_ID
): React.ComponentType<T> {
    // Try to get template-specific component
    const templateComponents = TEMPLATE_COMPONENTS[templateId];
    if (templateComponents && templateComponents[componentName]) {
        return templateComponents[componentName];
    }

    // Fall back to core component
    if (CORE_COMPONENTS[componentName]) {
        return CORE_COMPONENTS[componentName];
    }

    // Last resort: return a placeholder
    const PlaceholderComponent = () => (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-800">
            Component &quot;{componentName}&quot; not found for template &quot;{templateId}&quot;
        </div>
    );
    PlaceholderComponent.displayName = `Placeholder_${componentName}`;

    return PlaceholderComponent;
}

// ============================================
// Get Available Templates
// ============================================

export function getAvailableTemplates(): string[] {
    return Object.keys(TEMPLATE_COMPONENTS);
}

// ============================================
// Check if Template Exists
// ============================================

export function hasTemplateComponent(templateId: string, componentName: ComponentName): boolean {
    return !!(TEMPLATE_COMPONENTS[templateId]?.[componentName]);
}
