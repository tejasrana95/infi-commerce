'use client';

import React, { useState } from 'react';
import styles from './CookieBanner.module.scss';
import DynamicIcon from '../common/DynamicIcon';

interface CookieConsentSettings {
    enabled: boolean;
    title?: string;
    description?: string;
    ctaLink?: string;
    ctaText?: string;
    icon?: string;
    position: 'bottom-left' | 'bottom-center' | 'bottom-right';
    width: 'full' | 'half' | 'custom';
    customWidth?: number;
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
}

interface CookieBannerProps {
    settings: CookieConsentSettings;
}

const renderIcon = (iconName: string) => {
    return <DynamicIcon name={iconName} size={24} />;
};

export default function CookieBanner({ settings }: CookieBannerProps) {
    const [dismissed, setDismissed] = useState(true);
    const [hasAccepted, setHasAccepted] = useState(() => {
        if (typeof window !== 'undefined') {
            setDismissed(localStorage.getItem('cookieConsent') === 'accepted');
            return localStorage.getItem('cookieConsent') === 'accepted';
        }
        return false;
    }
    );
    // Check if cookie consent has been previously accepted
    const shouldShow = !hasAccepted && !dismissed && settings.enabled;



    const handleAccept = () => {
        // Set cookie consent in localStorage for 1 year
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookieConsentDate', expiryDate.toISOString());
        
        setDismissed(true);

        // Trigger any analytics or cookie loading scripts here
        if (typeof window !== 'undefined' && (window as Window & { gtag?: (action: string, type: string, settings: Record<string, string>) => void }).gtag) {
            (window as Window & { gtag?: (action: string, type: string, settings: Record<string, string>) => void }).gtag?.('consent', 'update', {
                'analytics_storage': 'granted',
                'functionality_storage': 'granted',
            });
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    if (!shouldShow) {
        return null;
    }

    const positionClass = `position-${settings.position}`;
    const widthClass = `width-${settings.width}`;

    const customStyles: React.CSSProperties = {
        backgroundColor: settings.backgroundColor || '#1f2937',
        color: settings.textColor || '#ffffff',
        ...(settings.width === 'custom' && settings.customWidth ? { maxWidth: `${settings.customWidth}px` } : {}),
    };

    const buttonStyles = {
        backgroundColor: settings.buttonColor || '#3b82f6',
        color: settings.buttonTextColor || '#ffffff',
    };

    return (
        <div
            className={`${styles.cookieBanner} ${styles[positionClass]} ${styles[widthClass]}`}
            style={customStyles}
        >
            <div className={styles.content}>
                {settings.icon && (
                    <div className={styles.icon}>
                        {renderIcon(settings.icon)}
                    </div>
                )}
                
                <div className={styles.textContent}>
                    {settings.title && (
                        <h3 className={styles.title}>{settings.title}</h3>
                    )}
                    
                    {settings.description && (
                        <div
                            className={styles.description}
                            dangerouslySetInnerHTML={{ __html: settings.description }}
                        />
                    )}
                </div>
            </div>

            <div className={styles.actions}>
                <button
                    className={styles.acceptButton}
                    onClick={handleAccept}
                    style={buttonStyles}
                >
                    {settings.ctaText || 'Accept'}
                </button>

                {settings.ctaLink && (
                    <a href={settings.ctaLink} className={styles.linkButton} target="_blank" rel="noopener noreferrer">
                        Learn More
                    </a>
                )}

                <button
                    className={styles.dismissButton}
                    onClick={handleDismiss}
                    aria-label="Dismiss cookie banner"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
