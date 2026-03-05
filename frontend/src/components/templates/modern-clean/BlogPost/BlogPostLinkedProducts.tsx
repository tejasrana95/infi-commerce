// BlogPost Linked Products Section - Shows a product grid or carousel after the article content

'use client';

import React, { useRef } from 'react';
import { getComponent } from '@/components/templates/registry';
import { LinkedProduct, LinkedProductsConfig } from '@/components/templates/core/BlogPost/types';
import styles from './BlogPost.module.scss';

interface BlogPostLinkedProductsProps {
    products: LinkedProduct[];
    config: LinkedProductsConfig;
}

export default function BlogPostLinkedProducts({ products, config }: BlogPostLinkedProductsProps) {
    const carouselRef = useRef<HTMLDivElement>(null);

    if (!products || products.length === 0) return null;

    const ProductCard = getComponent('ProductCard');
    const title = config.title?.trim() || 'Related Products';
    const isCarousel = config.layout === 'carousel';
    const columns = Math.min(Math.max(config.columns ?? 4, 1), 5);

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const scrollAmount = carouselRef.current.offsetWidth * 0.75;
        carouselRef.current.scrollBy({
            left: direction === 'right' ? scrollAmount : -scrollAmount,
            behavior: 'smooth',
        });
    };

    return (
        <section className={styles.linkedProducts}>
            <div className={styles.linkedProductsInner}>
                <h2 className={styles.linkedProductsTitle}>{title}</h2>

                {isCarousel ? (
                    <div className={styles.carouselWrapper}>
                        <button
                            className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                            onClick={() => scrollCarousel('left')}
                            aria-label="Scroll left"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className={styles.carousel} ref={carouselRef}>
                            {products.map((product) => (
                                <div key={product._id} className={styles.carouselItem}>
                                    <ProductCard
                                        product={{
                                            _id: product._id,
                                            name: product.name,
                                            slug: product.slug,
                                            price: product.price,
                                            compareAtPrice: product.compareAtPrice ?? product.salePrice,
                                            images: product.images,
                                            averageRating: product.averageRating,
                                            reviewCount: product.reviewCount,
                                            isNew: product.isNew,
                                            inStock: product.inStock,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                            onClick={() => scrollCarousel('right')}
                            aria-label="Scroll right"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div
                        className={styles.linkedProductsGrid}
                        style={{ '--lp-columns': columns } as React.CSSProperties}
                    >
                        {products.map((product) => (
                            <div key={product._id}>
                                <ProductCard
                                    product={{
                                        _id: product._id,
                                        name: product.name,
                                        slug: product.slug,
                                        price: product.price,
                                        compareAtPrice: product.compareAtPrice ?? product.salePrice,
                                        images: product.images,
                                        averageRating: product.averageRating,
                                        reviewCount: product.reviewCount,
                                        isNew: product.isNew,
                                        inStock: product.inStock,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
