'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import styles from './page.module.scss';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
    const { slug } = use(params);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.breadcrumb}>
                    <a href="/">Home</a>
                    <span>/</span>
                    <a href="/category">Products</a>
                    <span>/</span>
                    <span>{slug}</span>
                </div>

                <div className={styles.productLayout}>
                    {/* Image Gallery Placeholder */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImage}>
                            <div className={styles.placeholder}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p>Product Image</p>
                            </div>
                        </div>
                        <div className={styles.thumbnails}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={styles.thumbnail}>
                                    <div className={styles.placeholder}></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Info Placeholder */}
                    <div className={styles.info}>
                        <h1 className={styles.title}>Product: {slug.replace(/-/g, ' ')}</h1>
                        <div className={styles.rating}>
                            <div className={styles.stars}>★★★★☆</div>
                            <span>(0 reviews)</span>
                        </div>
                        <div className={styles.price}>
                            <span className={styles.current}>$0.00</span>
                            <span className={styles.original}>$0.00</span>
                        </div>
                        <p className={styles.description}>
                            Product description will be loaded here. This is a placeholder page
                            for the product detail view.
                        </p>
                        <div className={styles.actions}>
                            <button className={styles.addToCart}>Add to Cart</button>
                            <button className={styles.buyNow}>Buy Now</button>
                        </div>
                    </div>
                </div>

                <div className={styles.notice}>
                    <p>🚧 This page is under development. Product data will be fetched from the API.</p>
                </div>
            </div>
        </div>
    );
}
