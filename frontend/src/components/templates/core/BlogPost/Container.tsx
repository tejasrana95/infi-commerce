// BlogPost Container - Business logic for single blog post page

'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/providers/StoreProvider';
import { getComponent } from '@/components/templates/registry';
import {
    BlogPost,
    RelatedPost,
    BlogPostConfig,
    BlogPostTemplateProps,
    DEFAULT_BLOG_POST_CONFIG,
} from './types';

interface BlogPostContainerProps {
    post: BlogPost;
    relatedPosts?: RelatedPost[];
    initialLayout?: any;
}

export default function BlogPostContainer({
    post,
    relatedPosts = [],
    initialLayout = null,
}: BlogPostContainerProps) {
    const { store } = useStore();

    // Get config from theme
    const config: BlogPostConfig = useMemo(() => {
        const storeConfig = (store?.theme as any)?.blogPost || {};
        return {
            showFeaturedImage: storeConfig.showFeaturedImage ?? DEFAULT_BLOG_POST_CONFIG.showFeaturedImage,
            showAuthorCard: storeConfig.showAuthorCard ?? DEFAULT_BLOG_POST_CONFIG.showAuthorCard,
            showRelatedPosts: storeConfig.showRelatedPosts ?? DEFAULT_BLOG_POST_CONFIG.showRelatedPosts,
            relatedPostsCount: storeConfig.relatedPostsCount ?? DEFAULT_BLOG_POST_CONFIG.relatedPostsCount,
            showTableOfContents: storeConfig.showTableOfContents ?? DEFAULT_BLOG_POST_CONFIG.showTableOfContents,
            showShareButtons: storeConfig.showShareButtons ?? DEFAULT_BLOG_POST_CONFIG.showShareButtons,
            showTags: storeConfig.showTags ?? DEFAULT_BLOG_POST_CONFIG.showTags,
            showCategories: storeConfig.showCategories ?? DEFAULT_BLOG_POST_CONFIG.showCategories,
            showComments: storeConfig.showComments ?? DEFAULT_BLOG_POST_CONFIG.showComments,
            sidebar: { ...DEFAULT_BLOG_POST_CONFIG.sidebar, ...storeConfig.sidebar },
        };
    }, [(store?.theme as any)?.blogPost]);

    const templateId = store?.theme?.templateId || 'modern-clean';

    // Get the template component
    const BlogPostTemplate = getComponent<BlogPostTemplateProps>(
        'BlogPostTemplate',
        templateId
    );

    return (
        <BlogPostTemplate
            post={post}
            relatedPosts={relatedPosts}
            config={config}
            templateId={templateId}
            layout={initialLayout}
        />
    );
}
