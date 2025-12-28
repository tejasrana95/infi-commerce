// BlogPost Types - Shared interfaces for single blog post page

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
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
    };
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
