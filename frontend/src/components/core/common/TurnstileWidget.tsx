'use client';

import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement | string,
                options: {
                    sitekey: string;
                    callback?: (token: string) => void;
                    'error-callback'?: () => void;
                    'expired-callback'?: () => void;
                    theme?: 'light' | 'dark' | 'auto';
                }
            ) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

interface TurnstileWidgetProps {
    siteKey: string;
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
    theme?: 'light' | 'dark' | 'auto';
}

export default function TurnstileWidget({
    siteKey,
    onVerify,
    onExpire,
    onError,
    theme = 'auto',
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    // Keep stable references to callback functions so re-renders don't trigger effect re-execution
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    useEffect(() => {
        onVerifyRef.current = onVerify;
        onExpireRef.current = onExpire;
        onErrorRef.current = onError;
    });

    useEffect(() => {
        if (!siteKey) return;

        // Check if turnstile script is already loaded and available on window
        if (typeof window !== 'undefined' && window.turnstile) {
            setScriptLoaded(true);
            return;
        }

        const existingScript = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'cf-turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = () => setScriptLoaded(true);
            document.head.appendChild(script);
        } else {
            if (window.turnstile) {
                setScriptLoaded(true);
            } else {
                const handleLoad = () => setScriptLoaded(true);
                existingScript.addEventListener('load', handleLoad);
                return () => {
                    existingScript.removeEventListener('load', handleLoad);
                };
            }
        }
    }, [siteKey]);

    useEffect(() => {
        if (!scriptLoaded || !siteKey || !containerRef.current || !window.turnstile) return;

        // If widget is already mounted, do not re-render it
        if (widgetIdRef.current) return;

        try {
            const id = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => {
                    onVerifyRef.current?.(token);
                },
                'expired-callback': () => {
                    onExpireRef.current?.();
                },
                'error-callback': () => {
                    onErrorRef.current?.();
                },
                theme,
            });
            widgetIdRef.current = id;
        } catch (e) {
            console.error('Error rendering Turnstile widget:', e);
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // Ignore removal error
                }
                widgetIdRef.current = null;
            }
        };
    }, [scriptLoaded, siteKey, theme]);

    if (!siteKey) return null;

    return (
        <div className="turnstile-container" style={{ margin: '16px 0', minHeight: '65px' }}>
            <div ref={containerRef} />
        </div>
    );
}
