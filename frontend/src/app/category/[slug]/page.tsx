'use client';

import { use } from 'react';
import styles from './page.module.scss';

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = use(params);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <a href="/">Home</a>
                        <span>/</span>
                        <span>{slug.replace(/-/g, ' ')}</span>
                    </div>
                    <h1 className={styles.title}>{slug.replace(/-/g, ' ')}</h1>
                    <p className={styles.count}>0 products</p>
                </div>

                <div className={styles.layout}>
                    {/* Filters Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.filterSection}>
                            <h3>Categories</h3>
                            <ul>
                                <li><a href="#">All Categories</a></li>
                                <li><a href="#">Sub Category 1</a></li>
                                <li><a href="#">Sub Category 2</a></li>
                            </ul>
                        </div>
                        <div className={styles.filterSection}>
                            <h3>Price Range</h3>
                            <div className={styles.priceInputs}>
                                <input type="number" placeholder="Min" />
                                <span>-</span>
                                <input type="number" placeholder="Max" />
                            </div>
                        </div>
                        <div className={styles.filterSection}>
                            <h3>Brands</h3>
                            <ul>
                                <li><label><input type="checkbox" /> Brand 1</label></li>
                                <li><label><input type="checkbox" /> Brand 2</label></li>
                                <li><label><input type="checkbox" /> Brand 3</label></li>
                            </ul>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <main className={styles.main}>
                        <div className={styles.toolbar}>
                            <div className={styles.sortBy}>
                                <label>Sort by:</label>
                                <select>
                                    <option>Relevance</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                    <option>Newest</option>
                                </select>
                            </div>
                            <div className={styles.viewMode}>
                                <button className={styles.active}>Grid</button>
                                <button>List</button>
                            </div>
                        </div>

                        <div className={styles.productsGrid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className={styles.productCard}>
                                    <div className={styles.productImage}></div>
                                    <div className={styles.productInfo}>
                                        <h4>Product {i}</h4>
                                        <p className={styles.price}>$0.00</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.notice}>
                            <p>🚧 This page is under development. Products will be fetched from the API.</p>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
