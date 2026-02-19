'use client';

import Link from 'next/link';
import styles from './not-found.module.scss';

const quickLinks = [
    { label: 'Marble Ganesh Ji', href: '/search?q=ganesh' },
    { label: 'Radha Krishna', href: '/search?q=radha+krishna' },
    { label: 'Garlands', href: '/search?q=garland' }
];

export default function NotFound() {
    return (
        <section className={styles.wrap}>
            <div className={styles.card}>
                <div className={styles.leftPanel}>
                    <p className={styles.eyebrow}>Error 404</p>
                    <div className={styles.code}>404</div>
                    <h1>We couldn&apos;t find that page</h1>
                    <p>
                        The page may have moved or the link may be outdated. Try going back,
                        start from home, or search the catalog.
                    </p>

                    <div className={styles.actions}>
                        <Link href="/" className={styles.primaryBtn}>
                            Back to Home
                        </Link>
                        <button type="button" className={styles.secondaryBtn} onClick={() => window.history.back()}>
                            Go Back
                        </button>
                    </div>
                </div>

                <aside className={styles.rightPanel}>
                    <h2>Find what you need</h2>
                    <form className={styles.searchForm} action="/search">
                        <input type="text" name="q" placeholder="Search products, categories..." />
                        <button type="submit">Search</button>
                    </form>

                    <div className={styles.quickLinks}>
                        {quickLinks.map((item) => (
                            <Link key={item.href} href={item.href} className={styles.quickLink}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className={styles.noteBox}>
                        <strong>Tip</strong>
                        <p>
                            If you typed the URL manually, check for spelling mistakes and try again.
                        </p>
                    </div>
                </aside>
            </div>
        </section>
    );
}
