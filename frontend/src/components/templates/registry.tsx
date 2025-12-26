import React from 'react';
import { DEFAULT_TEMPLATE_ID } from '@/types';

// ============================================
// Import Template Components (Static for SSR)
// ============================================

// Core (Fallback) - Containers
import CoreHeaderContainer from './core/Header/Container';
import CoreFooterContainer from './core/Footer/Container';
import CoreHomePageContainer from '@/components/core/HomePage';
import CoreProductCardContainer from './core/ProductCard/Container';
import CoreCategoryCardContainer from './core/CategoryCard/Container';
import CoreCategoryPageContainer from './core/CategoryPage/Container';
import CoreProductPageContainer from './core/ProductPage/Container';
import CoreAuthPageContainer from './core/AuthPage/Container';
import CoreComparePageContainer from './core/ComparePage/Container';
import CoreSearchPageContainer from './core/SearchPage/Container';

// Core (Fallback) - Templates (pure presentation)
import CoreHeaderTemplate from './core/Header/Template';
import CoreFooterTemplate from './core/Footer/Template';
import CoreProductCardTemplate from './core/ProductCard/Template';
import CoreCategoryCardTemplate from './core/CategoryCard/Template';

// Modern Clean - Templates (pure presentation)
import ModernCleanHeaderTemplate from './modern-clean/Header/Template';
import ModernCleanFooterTemplate from './modern-clean/Footer/Template';
import ModernCleanHomePageTemplate from './modern-clean/HomePage/Template';
import ModernCleanProductCardTemplate from './modern-clean/ProductCard/Template';
import ModernCleanCategoryCardTemplate from './modern-clean/CategoryCard/Template';
import ModernCleanCategoryPageTemplate from './modern-clean/CategoryPage/Template';
import ModernCleanProductPageTemplate from './modern-clean/ProductPage/Template';
import ModernCleanAuthPageTemplate from './modern-clean/AuthPage/Template';
import ModernCleanComparePageTemplate from './modern-clean/ComparePage/Template';
import ModernCleanSearchPageTemplate from './modern-clean/SearchPage/Template';

// Classic Elegance - Templates (pure presentation)
import ClassicEleganceHeaderTemplate from './classic-elegance/Header/Template';
import ClassicEleganceFooterTemplate from './classic-elegance/Footer/Template';
import ClassicEleganceProductCardTemplate from './classic-elegance/ProductCard/Template';

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
    | 'SearchPageTemplate'
    | 'Banner';

// ============================================
// Template Component Registry
// ============================================

const TEMPLATE_COMPONENTS: Record<string, Record<string, React.ComponentType<any>>> = {
    'modern-clean': {
        // Containers (with business logic)
        Header: CoreHeaderContainer,
        Footer: CoreFooterContainer,
        HomePage: CoreHomePageContainer,
        ProductCard: CoreProductCardContainer,
        CategoryCard: CoreCategoryCardContainer,
        CategoryPage: CoreCategoryPageContainer,
        ProductPage: CoreProductPageContainer,
        // Templates (pure presentation)
        HeaderTemplate: ModernCleanHeaderTemplate,
        FooterTemplate: ModernCleanFooterTemplate,
        HomePageTemplate: ModernCleanHomePageTemplate,
        ProductCardTemplate: ModernCleanProductCardTemplate,
        CategoryCardTemplate: ModernCleanCategoryCardTemplate,
        CategoryPageTemplate: ModernCleanCategoryPageTemplate,
        ProductPageTemplate: ModernCleanProductPageTemplate,
        AuthPage: CoreAuthPageContainer,
        AuthPageTemplate: ModernCleanAuthPageTemplate,
        ComparePage: CoreComparePageContainer,
        ComparePageTemplate: ModernCleanComparePageTemplate,
        SearchPage: CoreSearchPageContainer,
        SearchPageTemplate: ModernCleanSearchPageTemplate,
    },
    'classic-elegance': {
        // Containers (with business logic) - Use same Core containers
        Header: CoreHeaderContainer,
        Footer: CoreFooterContainer,
        HomePage: CoreHomePageContainer,
        ProductCard: CoreProductCardContainer,
        CategoryCard: CoreCategoryCardContainer,
        CategoryPage: CoreCategoryPageContainer,
        ProductPage: CoreProductPageContainer,
        // Templates (pure presentation)
        HeaderTemplate: ClassicEleganceHeaderTemplate,
        FooterTemplate: ClassicEleganceFooterTemplate,
        ProductCardTemplate: ClassicEleganceProductCardTemplate,
        CategoryCardTemplate: ModernCleanCategoryCardTemplate, // Use modern-clean as fallback
        CategoryPageTemplate: ModernCleanCategoryPageTemplate, // Use modern-clean as fallback
        ProductPageTemplate: ModernCleanProductPageTemplate, // Use modern-clean as fallback
        AuthPage: CoreAuthPageContainer,
        AuthPageTemplate: ModernCleanAuthPageTemplate, // Use modern-clean as fallback
        ComparePage: CoreComparePageContainer,
        ComparePageTemplate: ModernCleanComparePageTemplate,
        SearchPage: CoreSearchPageContainer,
        SearchPageTemplate: ModernCleanSearchPageTemplate,
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
    CategoryPageTemplate: ModernCleanCategoryPageTemplate, // Use modern-clean as core fallback
    ProductPage: CoreProductPageContainer,
    ProductPageTemplate: ModernCleanProductPageTemplate, // Use modern-clean as core fallback
    // Auth
    AuthPage: React.lazy(() => import('./core/AuthPage/Container')),
    AuthPageTemplate: React.lazy(() => import('./modern-clean/AuthPage/Template')),
    ComparePage: CoreComparePageContainer,
    ComparePageTemplate: ModernCleanComparePageTemplate,
    SearchPage: CoreSearchPageContainer,
    SearchPageTemplate: ModernCleanSearchPageTemplate,
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
            Component "{componentName}" not found for template "{templateId}"
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
