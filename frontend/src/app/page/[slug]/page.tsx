'use client';

import { use } from 'react';
import styles from './page.module.scss';

interface PageContentProps {
    params: Promise<{ slug: string }>;
}

export default function PageContent({ params }: PageContentProps) {
    const { slug } = use(params);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.breadcrumb}>
                    <a href="/">Home</a>
                    <span>/</span>
                    <span>{slug.replace(/-/g, ' ')}</span>
                </div>

                <h1 className={styles.title}>{slug.replace(/-/g, ' ')}</h1>

                <div className={styles.pageContent}>
                    <p>
                        This is a placeholder for the <strong>{slug}</strong> page.
                        Content will be loaded from the CMS.
                    </p>
                </div>

                <div className={styles.notice}>
                    <p>🚧 This page is under development. Content will be fetched from the API.</p>
                </div>
            </div>
        </div>
    );
}
