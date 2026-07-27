// BlogListing Types - Shared interfaces for blog listing page

export interface BlogPostCategory {
    _id: string;
    name: string;
    slug: string;
    path?: string;
    parentId?: string;
    level?: number;
}

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    featuredImage?: string;
    author: {
        name: string;
        avatar?: string;
        userId?: string;
    };
    categoryIds: BlogPostCategory[];
    tags: string[];
    publishedAt: string;
    readingTime?: number;
    viewCount: number;
    likeCount: number;
    isFeatured: boolean;
    isPinned: boolean;
}

export interface BlogCategory {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    postCount: number;
    path?: string;
    parentId?: string;
    level?: number;
}

export interface BlogListingConfig {
    showViewCount?: boolean;
    showReadingTime?: boolean;
    showFavorite?: boolean;
    showAuthorName?: boolean;
    authorAlias?: string;
    showCategories?: boolean;
    showTags?: boolean;
    header: {
        showBanner: boolean;
        bannerImage?: string;
        title: string;
        subtitle?: string;
    };
    grid: {
        columns: 2 | 3 | 4;
        postsPerPage: number;
    };
    sidebar: {
        position: 'left' | 'right' | 'none';
        showCategories: boolean;
        showTags: boolean;
        showSearch: boolean;
    };
    featured: {
        showFeaturedPosts: boolean;
        featuredCount: number;
    };
}

export interface BlogPaginationState {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export interface BlogListingTemplateProps {
    posts: BlogPost[];
    categories: BlogCategory[];
    tags: string[];
    isLoading: boolean;
    pagination: BlogPaginationState;
    currentPage: number;
    selectedCategory?: string;
    selectedTag?: string;
    searchQuery?: string;
    viewMode: 'grid' | 'list';
    config: BlogListingConfig;
    templateId: string;
    layout: any;
    onPageChange: (page: number) => void;
    onCategoryFilter: (category: string) => void;
    onTagFilter: (tag: string) => void;
    onSearch: (query: string) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onClearFilters: () => void;
}

export const DEFAULT_BLOG_LISTING_CONFIG: BlogListingConfig = {
    showViewCount: true,
    showReadingTime: true,
    showFavorite: true,
    showAuthorName: true,
    authorAlias: '',
    showCategories: true,
    showTags: true,
    header: {
        showBanner: true,
        title: 'Blog',
        subtitle: 'Discover insights, stories, and inspiration',
    },
    grid: {
        columns: 3,
        postsPerPage: 12,
    },
    sidebar: {
        position: 'left',
        showCategories: true,
        showTags: true,
        showSearch: true,
    },
    featured: {
        showFeaturedPosts: true,
        featuredCount: 3,
    },
};
