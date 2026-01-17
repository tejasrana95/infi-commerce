import { Store } from '@/types/store';

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

export function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
    });
}

export function getInstallPrompt() {
    return deferredPrompt;
}

export function clearInstallPrompt() {
    deferredPrompt = null;
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
        return 'Tap the menu button and then "Add to Home Screen"';
    }
    return 'Use your browser menu to install this app';
}
