'use client';

import Link from 'next/link';
import styles from './not-found.module.scss';

export default function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Animated 404 Number */}
                <div className={styles.errorNumber}>
                    <span className={styles.digit}>4</span>
                    <span className={styles.zero}>
                        <div className={styles.planet}>
                            <div className={styles.ring}></div>
                            <div className={styles.crater}></div>
                            <div className={styles.crater}></div>
                            <div className={styles.crater}></div>
                        </div>
                    </span>
                    <span className={styles.digit}>4</span>
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

                {/* Astronaut */}
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

                {/* Message */}
                <h1 className={styles.title}>Houston, we have a problem!</h1>
                <p className={styles.message}>
                    The page you're looking for has floated off into space.
                    Don't worry, we'll help you find your way back home.
                </p>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/" className={styles.primaryBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Back to Home
                    </Link>
                    <button onClick={() => window.history.back()} className={styles.secondaryBtn}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        Go Back
                    </button>
                </div>

                {/* Search */}
                <div className={styles.searchSection}>
                    <p>Or try searching for what you need:</p>
                    <form className={styles.searchForm} action="/search">
                        <input type="text" name="q" placeholder="Search products, categories..." />
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
