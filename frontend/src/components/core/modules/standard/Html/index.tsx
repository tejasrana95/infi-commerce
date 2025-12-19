'use client';

import React from 'react';
import { ModuleProps } from '../..';
import styles from './Html.module.scss';

interface HtmlConfig {
    content: string;
    containerClass?: string;
}

export default function HtmlModule({ config }: ModuleProps) {
    const {
        content,
        containerClass = '',
    } = config as HtmlConfig;

    if (!content) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.placeholder}>
                        <span>📝</span>
                        <p>No HTML content provided</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <div className={`${styles.container} ${containerClass}`}>
            <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
}
