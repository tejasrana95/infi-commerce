'use client';

import { use } from 'react';
import styles from './page.module.scss';

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = use(params);

    return (
        <div className={styles.container}>
            <article className={styles.article}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <a href="/">Home</a>
                        <span>/</span>
                        <a href="/blog">Blog</a>
                        <span>/</span>
                        <span>{slug.replace(/-/g, ' ')}</span>
                    </div>
                    <span className={styles.category}>Category</span>
                    <h1 className={styles.title}>{slug.replace(/-/g, ' ')}</h1>
                    <div className={styles.meta}>
                        <div className={styles.author}>
                            <div className={styles.avatar}></div>
                            <span>Author Name</span>
                        </div>
                        <span>•</span>
                        <span>January 1, 2024</span>
                        <span>•</span>
                        <span>5 min read</span>
                    </div>
                </header>

                {/* Featured Image */}
                <div className={styles.featuredImage}></div>

                {/* Content */}
                <div className={styles.content}>
                    <p>
                        This is a placeholder for the blog post content. The actual content
                        will be loaded from the CMS and rendered here with proper formatting.
                    </p>
                    <p>
                        Blog posts can include various elements like headings, paragraphs,
                        images, code blocks, and more. The content management system will
                        provide rich text editing capabilities for creating engaging content.
                    </p>
                    <h2>Section Title</h2>
                    <p>
                        Additional content paragraphs will appear here with proper styling
                        and typography for an optimal reading experience.
                    </p>
                </div>

                {/* Share */}
                <div className={styles.share}>
                    <span>Share this post:</span>
                    <div className={styles.socialLinks}>
                        <button>Twitter</button>
                        <button>Facebook</button>
                        <button>LinkedIn</button>
                    </div>
                </div>

                <div className={styles.notice}>
                    <p>🚧 This page is under development. Content will be fetched from the API.</p>
                </div>
            </article>
        </div>
    );
}
