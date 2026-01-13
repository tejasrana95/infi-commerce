'use client';

import { useEffect, useState } from 'react';
import styles from './OfflineIndicator.module.scss';

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        // Set initial state
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!showOffline) return null;

    return (
        <div className={styles.offlineIndicator}>
            <div className={styles.content}>
                <svg
                    className={styles.icon}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M1 1l22 22" />
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <path d="M12 20h.01" />
                </svg>
                <div className={styles.text}>
                    <h3 className={styles.title}>You're Offline</h3>
                    <p className={styles.message}>
                        Some features may be unavailable. We'll reconnect automatically when your connection is restored.
                    </p>
                </div>
            </div>
        </div>
    );
}
