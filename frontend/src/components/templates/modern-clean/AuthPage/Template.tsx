'use client';

import React from 'react';
import styles from './Template.module.scss';

interface AuthPageTemplateProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export default function AuthPageTemplate({ title, subtitle, children }: AuthPageTemplateProps) {
    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>

                    <div className={styles.content}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
