/**
 * POS PWA Utilities
 * Provides functions for service worker management and PWA features
 */

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000); // Check every hour

            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            dispatchEvent(new CustomEvent('sw-update-available'));
                        }
                    });
                }
            });

            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    }
    return null;
}

/**
 * Unregister service worker (for disabling PWA)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            return await registration.unregister();
        }
    }
    return false;
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }

    // Check for iOS standalone
    if ((window.navigator as any).standalone === true) {
        return true;
    }

    return false;
}

/**
 * Get install prompt event
 */
let deferredPrompt: any = null;

export function setupInstallPrompt(onPromptReady?: () => void) {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;

        if (onPromptReady) {
            onPromptReady();
        }
    });
}

export function getInstallPrompt() {
    return deferredPrompt;
}

export function clearInstallPrompt() {
    deferredPrompt = null;
}

/**
 * Check if install prompt is available
 */
export function canInstall(): boolean {
    return deferredPrompt !== null;
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
    if (!deferredPrompt) {
        return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    deferredPrompt = null;

    return outcome === 'accepted';
}

/**
 * Check if browser supports PWA
 */
export function supportsPWA(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get PWA display mode
 */
export function getPWADisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
        return 'fullscreen';
    }
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
        return 'minimal-ui';
    }
    return 'browser';
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
}

/**
 * Get install instructions based on device
 */
export function getInstallInstructions(): string {
    if (isIOS()) {
        return 'Tap the share button and then "Add to Home Screen"';
    }
    if (isAndroid()) {
        return 'Tap the menu button and then "Install app"';
    }
    return 'Use your browser menu to install this app';
}

/**
 * Send message to service worker
 */
export async function sendMessageToSW(message: any): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(message);
    }
}

/**
 * Request to skip waiting (activate new service worker immediately)
 */
export async function skipWaiting(): Promise<void> {
    await sendMessageToSW({ type: 'SKIP_WAITING' });
}

/**
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
    await sendMessageToSW({ type: 'CLEAR_CACHE' });
}

/**
 * Cache product images for offline use
 */
export async function cacheProducts(products: any[]): Promise<void> {
    await sendMessageToSW({ type: 'CACHE_PRODUCTS', products });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
}
