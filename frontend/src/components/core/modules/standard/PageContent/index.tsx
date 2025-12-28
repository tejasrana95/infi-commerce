import React from 'react';
import styles from './index.module.scss';

interface PageContentProps {
    config: {
        containerWidth?: 'narrow' | 'medium' | 'full';
        pageData?: {
            title: string;
            content: string;
            slug: string;
        };
    };
}

export default function PageContent({ config }: PageContentProps) {
    const {
        containerWidth = 'medium',
        pageData
    } = config;

    if (!pageData) {
        return (
            <div className={styles.pageContent}>
                <div className={`${styles.documentContainer} ${styles[containerWidth]}`}>
                    <p className={styles.noData}>No content available.</p>
                </div>
            </div>
        );
    }

    const containerClass = `${styles.documentContainer} ${styles[containerWidth] || styles.medium}`;

    return (
        <article className={styles.pageContent}>
            <div className={styles.contentSection}>
                <div className={containerClass}>
                    <div className={styles.contentBody}>
                        <div
                            className={styles.richText}
                            dangerouslySetInnerHTML={{ __html: pageData.content }}
                        />
                    </div>
                </div>
            </div>
        </article>
    );
}
