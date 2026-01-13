'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/providers/StoreProvider';
import {
    setupInstallPrompt,
    getInstallPrompt,
    showInstallPrompt,
    clearInstallPrompt,
    isPWAInstalled,
    isIOS,
    getInstallInstructions,
} from '@/lib/pwa/pwa-utils';
import styles from './InstallPrompt.module.scss';

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_EXPIRY_DAYS = 7;

export default function InstallPrompt() {
    const { store } = useStore();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);

    const promptStyle = store?.pwaSettings?.installPromptStyle || 'toast';

    useEffect(() => {
        // Don't show if PWA is not enabled
        if (!store?.pwaSettings?.enabled) {
            return;
        }

        // Don't show if already installed
        if (isPWAInstalled()) {
            return;
        }

        // Check if user dismissed recently
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const expiryDate = new Date(dismissedDate.getTime() + DISMISSED_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
            if (new Date() < expiryDate) {
                return;
            }
        }

        // Setup install prompt listener
        setupInstallPrompt();

        // Check if prompt is available after a short delay
        const timer = setTimeout(() => {
            if (getInstallPrompt() || isIOS()) {
                setShowPrompt(true);
            }
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(timer);
    }, [store]);

    const handleInstall = async () => {
        if (isIOS()) {
            // For iOS, just show instructions
            return;
        }

        setIsInstalling(true);
        const accepted = await showInstallPrompt();
        setIsInstalling(false);

        if (accepted) {
            setShowPrompt(false);
            clearInstallPrompt();
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    };

    if (!showPrompt) return null;

    const appName = store?.pwaSettings?.appName || store?.name || 'App';

    // Toast style
    if (promptStyle === 'toast') {
        return (
            <div className={`${styles.installPrompt} ${styles.toast}`}>
                <div className={styles.toastContent}>
                    {store?.pwaSettings?.icons?.icon192 && (
                        <img
                            src={store.pwaSettings.icons.icon192}
                            alt={appName}
                            className={styles.toastIcon}
                        />
                    )}
                    <div className={styles.toastText}>
                        <h4 className={styles.toastTitle}>Install {appName}</h4>
                        <p className={styles.toastMessage}>
                            {isIOS() ? getInstallInstructions() : 'Install our app for a better experience'}
                        </p>
                    </div>
                    <div className={styles.toastActions}>
                        {!isIOS() && (
                            <button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                className={styles.installButton}
                            >
                                {isInstalling ? 'Installing...' : 'Install'}
                            </button>
                        )}
                        <button onClick={handleDismiss} className={styles.dismissButton}>
                            ×
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Banner style
    if (promptStyle === 'banner') {
        return (
            <div className={`${styles.installPrompt} ${styles.banner}`}>
                <div className={styles.bannerContent}>
                    {store?.pwaSettings?.icons?.icon192 && (
                        <img
                            src={store.pwaSettings.icons.icon192}
                            alt={appName}
                            className={styles.bannerIcon}
                        />
                    )}
                    <div className={styles.bannerText}>
                        <h3 className={styles.bannerTitle}>Install {appName}</h3>
                        <p className={styles.bannerMessage}>
                            {isIOS() ? getInstallInstructions() : 'Get quick access and a better experience'}
                        </p>
                    </div>
                    <div className={styles.bannerActions}>
                        {!isIOS() && (
                            <button
                                onClick={handleInstall}
                                disabled={isInstalling}
                                className={styles.installButton}
                            >
                                {isInstalling ? 'Installing...' : 'Install App'}
                            </button>
                        )}
                        <button onClick={handleDismiss} className={styles.dismissButton}>
                            Not Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Modal style
    return (
        <>
            <div className={styles.modalOverlay} onClick={handleDismiss} />
            <div className={`${styles.installPrompt} ${styles.modal}`}>
                <button onClick={handleDismiss} className={styles.modalClose}>
                    ×
                </button>
                {store?.pwaSettings?.icons?.icon512 && (
                    <img
                        src={store.pwaSettings.icons.icon512}
                        alt={appName}
                        className={styles.modalIcon}
                    />
                )}
                <h2 className={styles.modalTitle}>Install {appName}</h2>
                <p className={styles.modalMessage}>
                    {isIOS()
                        ? getInstallInstructions()
                        : 'Install our app for quick access, offline support, and a native app experience.'}
                </p>
                <div className={styles.modalActions}>
                    {!isIOS() && (
                        <button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className={styles.installButton}
                        >
                            {isInstalling ? 'Installing...' : 'Install App'}
                        </button>
                    )}
                    <button onClick={handleDismiss} className={styles.dismissButton}>
                        Maybe Later
                    </button>
                </div>
            </div>
        </>
    );
}
