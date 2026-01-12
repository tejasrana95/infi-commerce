'use client';

// Core CategoryCard Container - Handles business logic and data processing

import { getComponent } from '@/components/templates/registry';
import { CategoryTemplateProps, Category } from './types';

interface CategoryCardContainerProps {
    category: Category;
    style?: 'card' | 'banner' | 'minimal' | 'overlay';
    templateId?: string;
}

// Process category data into template-ready props
function processCategoryData(category: Category, style: string): CategoryTemplateProps {
    return {
        id: category._id,
        title: category.title,
        slug: category.slug,
        description: category.description,
        imageUrl: category.image,
        imageAlt: category.title,
        productCount: category.productCount,
        categoryUrl: `/${category.slug}`,
        style: style as CategoryTemplateProps['style'],
        showDescription: category.showDescription ?? true,
    };
}

// The Container component
export default function CategoryCardContainer({
    category,
    style = 'card',
    templateId = 'modern-clean',
}: CategoryCardContainerProps) {
    // Process the category data
    const templateProps = processCategoryData(category, style);

    // Get the template-specific presenter component
    const CategoryCardTemplate = getComponent('CategoryCardTemplate', templateId);

    // Render the template with processed data
    return <CategoryCardTemplate {...templateProps} />;
}
