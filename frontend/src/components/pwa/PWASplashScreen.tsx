'use client';

import React from 'react';
import styles from './PWASplashScreen.module.scss';
import { PWASettings } from '@/types/store';

interface PWASplashScreenProps {
    pwaSettings: PWASettings;
    storeLogo?: string;
    storeName?: string;
}

export default function PWASplashScreen({ pwaSettings, storeLogo, storeName }: PWASplashScreenProps) {
    const { splashScreen, backgroundColor, icons } = pwaSettings;
    const spinnerType = splashScreen?.spinnerType || 'circular';
    const spinnerColor = splashScreen?.spinnerColor || '#000000';
    const bgImage = splashScreen?.image;
    const bgColor = backgroundColor || '#ffffff';

    return (
        <div
            className={styles.splashScreen}
            style={{
                backgroundColor: bgColor,
                backgroundImage: bgImage ? `url(${bgImage})` : undefined,
            }}
        >
            <div className={styles.content}>
                {/* Logo/Icon */}
                {(storeLogo || icons?.icon512) && (
                    <img
                        src={storeLogo || icons?.icon512}
                        alt={storeName || 'Loading'}
                        className={styles.logo}
                    />
                )}

                {/* Store Name */}
                {storeName && <h1 className={styles.storeName}>{storeName}</h1>}

                {/* Spinner */}
                <div className={styles.spinnerContainer}>
                    {spinnerType === 'circular' && (
                        <div
                            className={styles.circularSpinner}
                            style={{ borderColor: `${spinnerColor}20`, borderTopColor: spinnerColor }}
                        />
                    )}

                    {spinnerType === 'dots' && (
                        <div className={styles.dotsSpinner}>
                            <div className={styles.dot} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.dot} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.dot} style={{ backgroundColor: spinnerColor }} />
                        </div>
                    )}

                    {spinnerType === 'pulse' && (
                        <div
                            className={styles.pulseSpinner}
                            style={{ backgroundColor: spinnerColor }}
                        />
                    )}

                    {spinnerType === 'bars' && (
                        <div className={styles.barsSpinner}>
                            <div className={styles.bar} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.bar} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.bar} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.bar} style={{ backgroundColor: spinnerColor }} />
                            <div className={styles.bar} style={{ backgroundColor: spinnerColor }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
