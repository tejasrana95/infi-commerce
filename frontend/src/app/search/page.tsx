'use client';

import { useSearchParams } from 'next/navigation';
import styles from './page.module.scss';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Search Header */}
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        {query ? `Search results for "${query}"` : 'Search Products'}
                    </h1>
                    <p className={styles.count}>0 results found</p>
                </div>

                {/* Search Bar */}
                <form className={styles.searchForm}>
                    <input
                        type="text"
                        name="q"
                        defaultValue={query}
                        placeholder="Search for products, brands, categories..."
                    />
                    <button type="submit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>

                {/* Results */}
                {query ? (
                    <div className={styles.results}>
                        <div className={styles.productsGrid}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className={styles.productCard}>
                                    <div className={styles.productImage}></div>
                                    <div className={styles.productInfo}>
                                        <h4>Product {i}</h4>
                                        <p className={styles.price}>$0.00</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3>Start searching</h3>
                        <p>Enter a keyword to find products, categories, and more.</p>
                    </div>
                )}

                <div className={styles.notice}>
                    <p>🚧 This page is under development. Search will be powered by the API.</p>
                </div>
            </div>
        </div>
    );
}
