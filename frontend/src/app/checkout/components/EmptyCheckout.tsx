'use client';

import React from 'react';
import Link from 'next/link';
import styles from './EmptyCheckout.module.scss';

export default function EmptyCheckout() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Visual Section - Astronaut & Planet */}
                <div className={styles.visualSection}>
                    <div className={styles.planet}>
                        <div className={styles.ring}></div>
                        <div className={styles.crater}></div>
                        <div className={styles.crater}></div>
                        <div className={styles.crater}></div>
                    </div>

                    <div className={styles.astronaut}>
                        <div className={styles.helmet}>
                            <div className={styles.visor}></div>
                        </div>
                        <div className={styles.body}></div>
                        <div className={styles.armLeft}></div>
                        <div className={styles.armRight}></div>
                        <div className={styles.legLeft}></div>
                        <div className={styles.legRight}></div>
                    </div>
                </div>

                {/* Stars Background */}
                <div className={styles.stars}>
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className={styles.star} style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${1 + Math.random() * 2}s`
                        }}></div>
                    ))}
                </div>

                {/* Message */}
                <h1 className={styles.title}>Your cart is currently empty</h1>
                <p className={styles.message}>
                    Looks like your space cargo is empty! <br />
                    Travel back to our store and fill it up with amazing products.
                </p>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/" className={styles.primaryBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Start Shopping
                    </Link>
                </div>

                {/* Search */}
                <div className={styles.searchSection}>
                    <p>Or find exactly what you're looking for:</p>
                    <form className={styles.searchForm} action="/search">
                        <input type="text" name="q" placeholder="Search products..." />
                        <button type="submit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
