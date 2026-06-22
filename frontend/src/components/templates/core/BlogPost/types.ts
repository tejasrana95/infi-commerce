// BlogPost Types - Shared interfaces for single blog post page

export interface LinkedProduct {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    compareAtPrice?: number;
    images?: string[];
    averageRating?: number;
    reviewCount?: number;
    isNew?: boolean;
    inStock?: boolean;
    brand?: string;
    sku?: string;
}

export interface LinkedProductsConfig {
    enabled: boolean;
    sourceType: 'category' | 'products';
    categoryId?: string;
    productIds?: string[];
    limit?: number;
    order?: 'latest' | 'random' | 'best-selling' | 'most-viewed';
    layout?: 'carousel' | 'grid';
    columns?: number;
    title?: string;
}

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featuredImage?: string;
    author: {
        name: string;
        avatar?: string;
        userId?: string;
        bio?: string;
    };
    categoryIds: Array<{ _id: string; name: string; slug: string }>;
    tags: string[];
    publishedAt: string;
    readingTime?: number;
    viewCount: number;
    likeCount: number;
    isFeatured: boolean;
    showRelatedArticles?: boolean;
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
    };
    linkedProductsConfig?: LinkedProductsConfig;
    linkedProducts?: LinkedProduct[];
}

export interface RelatedPost {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    publishedAt: string;
    categoryIds?: Array<{ _id: string; name: string; slug: string }>;
    readingTime?: number;
}

export interface BlogPostConfig {
    showFeaturedImage: boolean;
    showAuthorCard: boolean;
    showRelatedPosts: boolean;
    relatedPostsCount: number;
    showTableOfContents: boolean;
    showShareButtons: boolean;
    showTags: boolean;
    showCategories: boolean;
    showComments: boolean;
    sidebar: {
        position: 'left' | 'right' | 'none';
        showRecentPosts: boolean;
        showCategories: boolean;
        showNewsletter: boolean;
    };
}

export interface BlogPostTemplateProps {
    post: BlogPost;
    relatedPosts: RelatedPost[];
    config: BlogPostConfig;
    templateId: string;
    layout: any;
}

export const DEFAULT_BLOG_POST_CONFIG: BlogPostConfig = {
    showFeaturedImage: true,
    showAuthorCard: true,
    showRelatedPosts: true,
    relatedPostsCount: 3,
    showTableOfContents: true,
    showShareButtons: true,
    showTags: true,
    showCategories: true,
    showComments: false,
    sidebar: {
        position: 'right',
        showRecentPosts: true,
        showCategories: true,
        showNewsletter: true,
    },
};
