'use client';

import React from 'react';
import styles from './Loader.module.scss';

export type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'ring';
export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoaderProps {
    variant?: LoaderVariant;
    size?: LoaderSize;
    color?: string;
    fullScreen?: boolean;
    overlay?: boolean;
    text?: string;
    className?: string;
}

export default function Loader({
    variant = 'spinner',
    size = 'md',
    color,
    fullScreen = false,
    overlay = false,
    text,
    className = '',
}: LoaderProps) {
    const loaderContent = (
        <div
            className={`${styles.loaderWrapper} ${styles[size]} ${className}`}
            style={color ? { '--loader-color': color } as React.CSSProperties : undefined}
        >
            {variant === 'spinner' && (
                <div className={styles.spinner}>
                    <div className={styles.spinnerRing}></div>
                    <div className={styles.spinnerRing}></div>
                    <div className={styles.spinnerRing}></div>
                </div>
            )}

            {variant === 'dots' && (
                <div className={styles.dots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                </div>
            )}

            {variant === 'pulse' && (
                <div className={styles.pulse}>
                    <div className={styles.pulseCircle}></div>
                    <div className={styles.pulseCircle}></div>
                </div>
            )}

            {variant === 'ring' && (
                <div className={styles.ring}>
                    <div className={styles.ringArc}></div>
                </div>
            )}

            {text && <p className={styles.loaderText}>{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className={`${styles.fullScreen} ${overlay ? styles.overlay : ''}`}>
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}

// Named exports for convenience
export { Loader };
