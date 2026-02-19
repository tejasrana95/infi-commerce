'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Template.module.scss';

interface AuthPageTemplateProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

const pageMeta = {
    login: {
        tag: 'Sign In',
        supportTitle: 'Need help signing in?',
        supportText: 'Use password reset or contact support for quick account recovery.'
    },
    register: {
        tag: 'Account Setup',
        supportTitle: 'Creating a new account?',
        supportText: 'Your account enables faster checkout, order tracking, and saved addresses.'
    },
    'forgot-password': {
        tag: 'Recovery',
        supportTitle: 'Password recovery support',
        supportText: 'Reset links are sent securely to your registered email address.'
    },
    'reset-password': {
        tag: 'Security',
        supportTitle: 'Set a secure new password',
        supportText: 'Use at least 8 characters and avoid reusing old passwords.'
    },
    'verify-email': {
        tag: 'Verification',
        supportTitle: 'Email confirmation in progress',
        supportText: 'Verification activates full access to account and communication features.'
    }
};

const inferTypeFromTitle = (title: string): keyof typeof pageMeta => {
    const normalized = title.toLowerCase();
    if (normalized.includes('create')) return 'register';
    if (normalized.includes('forgot')) return 'forgot-password';
    if (normalized.includes('reset')) return 'reset-password';
    if (normalized.includes('verify')) return 'verify-email';
    return 'login';
};

export default function AuthPageTemplate({ title, subtitle, children }: AuthPageTemplateProps) {
    const type = inferTypeFromTitle(title);
    const meta = pageMeta[type];

    return (
        <section className={styles.page}>
            <div className={styles.workspace}>
                <header className={styles.topBar}>
                    <div className={styles.topLeft}>
                        <span className={styles.tag}>{meta.tag}</span>
                        <span className={styles.secure}>Secure customer authentication</span>
                    </div>
                    <div className={styles.topRight}>
                        <span>256-bit encrypted</span>
                        <span>Session protected</span>
                    </div>
                </header>

                <div className={styles.contentGrid}>
                    <main className={styles.formPanel}>
                        <div className={styles.formCard}>
                            <header className={styles.header}>
                                <h1 className={styles.title}>{title}</h1>
                                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                            </header>
                            <div className={styles.formContent}>{children}</div>
                        </div>
                    </main>

                    <aside className={styles.supportPanel}>
                        <h2>{meta.supportTitle}</h2>
                        <p>{meta.supportText}</p>

                        <div className={styles.supportCards}>
                            <div className={styles.supportCard}>
                                <span className={styles.cardLabel}>Home</span>
                                <Link href="/">Return to home</Link>
                            </div>
                            <div className={styles.supportCard}>
                                <span className={styles.cardLabel}>Support</span>
                                <Link href="/contact-us">Contact assistance</Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}
