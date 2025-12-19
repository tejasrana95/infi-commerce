'use client';

import styles from './page.module.scss';

export default function BlogPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Hero Section */}
                <div className={styles.hero}>
                    <h1>Our Blog</h1>
                    <p>Discover tips, trends, and stories from our team</p>
                </div>

                {/* Featured Post */}
                <div className={styles.featured}>
                    <div className={styles.featuredImage}></div>
                    <div className={styles.featuredContent}>
                        <span className={styles.category}>Featured</span>
                        <h2>Featured Blog Post Title</h2>
                        <p>This is a preview of the featured blog post content. It will be loaded from the API when the blog system is fully implemented.</p>
                        <div className={styles.meta}>
                            <span>Jan 1, 2024</span>
                            <span>•</span>
                            <span>5 min read</span>
                        </div>
                    </div>
                </div>

                {/* Blog Grid */}
                <div className={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <article key={i} className={styles.card}>
                            <div className={styles.cardImage}></div>
                            <div className={styles.cardContent}>
                                <span className={styles.category}>Category</span>
                                <h3>Blog Post Title {i}</h3>
                                <p>A brief excerpt from the blog post that gives readers an idea of what the content is about.</p>
                                <div className={styles.meta}>
                                    <span>Jan {i}, 2024</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className={styles.notice}>
                    <p>🚧 This page is under development. Blog posts will be fetched from the API.</p>
                </div>
            </div>
        </div>
    );
}
