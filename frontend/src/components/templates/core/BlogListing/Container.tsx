// BlogListing Container - Business logic, data fetching, state management
// Uses layout sections with ModuleRenderer/SectionRenderer like CategoryPage

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import { getComponent } from '@/components/templates/registry';
import {
    BlogPost,
    BlogCategory,
    BlogPaginationState,
    BlogListingConfig,
    BlogListingTemplateProps,
    DEFAULT_BLOG_LISTING_CONFIG,
} from './types';

interface BlogListingContainerProps {
    initialPosts: BlogPost[];
    initialCategories: BlogCategory[];
    initialTags: string[];
    initialPagination: BlogPaginationState;
    initialLayout?: any;
    page?: number;
    category?: string;
    tag?: string;
    search?: string;
}

export default function BlogListingContainer({
    initialPosts = [],
    initialCategories = [],
    initialTags = [],
    initialPagination = { page: 1, limit: 12, total: 0, pages: 0 },
    initialLayout = null,
    page = 1,
    category,
    tag,
    search,
}: BlogListingContainerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { store } = useStore();

    // State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading] = useState(false);

    // Get config from theme
    const config: BlogListingConfig = useMemo(() => {
        const storeConfig = (store?.theme as any)?.blog || (store?.theme as any)?.blogPost || {};
        return {
            showViewCount: storeConfig.showViewCount ?? DEFAULT_BLOG_LISTING_CONFIG.showViewCount,
            showReadingTime: storeConfig.showReadingTime ?? DEFAULT_BLOG_LISTING_CONFIG.showReadingTime,
            showFavorite: storeConfig.showFavorite ?? storeConfig.showLikeButton ?? DEFAULT_BLOG_LISTING_CONFIG.showFavorite,
            showAuthorName: storeConfig.showAuthorName ?? DEFAULT_BLOG_LISTING_CONFIG.showAuthorName,
            authorAlias: storeConfig.authorAlias ?? DEFAULT_BLOG_LISTING_CONFIG.authorAlias,
            showCategories: storeConfig.showCategories ?? DEFAULT_BLOG_LISTING_CONFIG.showCategories,
            showTags: storeConfig.showTags ?? DEFAULT_BLOG_LISTING_CONFIG.showTags,
            header: { ...DEFAULT_BLOG_LISTING_CONFIG.header, ...storeConfig.header },
            grid: { ...DEFAULT_BLOG_LISTING_CONFIG.grid, ...storeConfig.grid },
            sidebar: { ...DEFAULT_BLOG_LISTING_CONFIG.sidebar, ...storeConfig.sidebar },
            featured: { ...DEFAULT_BLOG_LISTING_CONFIG.featured, ...storeConfig.featured },
        };
    }, [store?.theme]);

    const templateId = store?.theme?.templateId || 'modern-clean';

    // Handlers
    const handlePageChange = useCallback((newPage: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', newPage.toString());
        router.push(`/blog?${params.toString()}`);
    }, [router, searchParams]);

    const handleCategoryFilter = useCallback((categorySlug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categorySlug) {
            params.set('category', categorySlug);
        } else {
            params.delete('category');
        }
        params.delete('page');
        router.push(`/blog?${params.toString()}`);
    }, [router, searchParams]);

    const handleTagFilter = useCallback((tagName: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tagName) {
            params.set('tag', tagName);
        } else {
            params.delete('tag');
        }
        params.delete('page');
        router.push(`/blog?${params.toString()}`);
    }, [router, searchParams]);

    const handleSearch = useCallback((searchQuery: string) => {
        const params = new URLSearchParams();
        if (searchQuery) {
            params.set('search', searchQuery);
        }
        router.push(`/blog?${params.toString()}`);
    }, [router]);

    const handleClearFilters = useCallback(() => {
        router.push('/blog');
    }, [router]);

    // Get the template component
    const BlogListingTemplate = getComponent<BlogListingTemplateProps>(
        'BlogListingTemplate',
        templateId
    );

    return (
        <BlogListingTemplate
            posts={initialPosts}
            categories={initialCategories}
            tags={initialTags}
            isLoading={isLoading}
            pagination={initialPagination}
            currentPage={page}
            selectedCategory={category}
            selectedTag={tag}
            searchQuery={search}
            viewMode={viewMode}
            config={config}
            templateId={templateId}
            layout={initialLayout}
            onPageChange={handlePageChange}
            onCategoryFilter={handleCategoryFilter}
            onTagFilter={handleTagFilter}
            onSearch={handleSearch}
            onViewModeChange={setViewMode}
            onClearFilters={handleClearFilters}
        />
    );
}
