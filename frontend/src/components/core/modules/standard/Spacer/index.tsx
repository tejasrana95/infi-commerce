'use client';

import React from 'react';
import { ModuleProps } from '../..';
import styles from './Spacer.module.scss';

interface SpacerConfig {
    height?: number;
    mobileHeight?: number;
    backgroundColor?: string;
}

export default function SpacerModule({ config }: ModuleProps) {
    const {
        height = 40,
        mobileHeight,
        backgroundColor = 'transparent',
    } = config as SpacerConfig;

    return (
        <div
            className={styles.spacer}
            style={{
                '--spacer-height': `${height}px`,
                '--spacer-mobile-height': `${mobileHeight || height}px`,
                backgroundColor,
            } as React.CSSProperties}
        />
    );
}
