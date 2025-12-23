'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import api from '@/lib/api';
import styles from './SocialLoginButtons.module.scss';

interface SocialLoginButtonsProps {
    onSuccess: (data: any) => void;
    onError: (error: string) => void;
}

export default function SocialLoginButtons({ onSuccess, onError }: SocialLoginButtonsProps) {
    const router = useRouter();
    const { store } = useStore();
    const socialConfig = store?.settings?.socialLogin;
    const popupRef = useRef<Window | null>(null);

    // Listen for messages from popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify origin
            if (event.origin !== window.location.origin) return;

            const { type, data, error } = event.data;

            if (type === 'SOCIAL_LOGIN_SUCCESS') {
                // Store the token and customer data
                if (data.accessToken) {
                    api.setToken(data.accessToken);
                }
                if (data.customer) {
                    const customerData = {
                        _id: data.customer.id || data.customer._id,
                        ...data.customer,
                    };
                    localStorage.setItem('customer', JSON.stringify(customerData));
                }

                onSuccess(data);

                // Use hard navigation to ensure fresh auth state check
                // Small delay to ensure localStorage is persisted
                setTimeout(() => {
                    window.location.href = '/account';
                }, 100);
            } else if (type === 'SOCIAL_LOGIN_ERROR') {
                onError(error || 'Social login failed');
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSuccess, onError, router]);

    if (!socialConfig) return null;

    const handleGoogleLogin = () => {
        const clientId = socialConfig.google.clientId;
        if (!clientId) {
            onError('Google Login is not configured for this store.');
            return;
        }

        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${window.location.origin}/auth/callback/google&response_type=token&scope=email profile&state=${store._id}`;

        popupRef.current = window.open(
            url,
            'Google Login',
            `width=${width},height=${height},top=${top},left=${left}`
        );
    };

    const handleFacebookLogin = () => {
        const clientId = socialConfig.facebook.clientId;
        if (!clientId) {
            onError('Facebook Login is not configured for this store.');
            return;
        }

        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${window.location.origin}/auth/callback/facebook&response_type=token&scope=email,public_profile&state=${store._id}`;

        popupRef.current = window.open(
            url,
            'Facebook Login',
            `width=${width},height=${height},top=${top},left=${left}`
        );
    };

    const hasGoogle = socialConfig.google?.enabled;
    const hasFacebook = socialConfig.facebook?.enabled;

    if (!hasGoogle && !hasFacebook) return null;

    return (
        <div className={styles.container}>
            <div className={styles.divider}>
                <span>Or continue with</span>
            </div>
            <div className={styles.buttons}>
                {hasGoogle && (
                    <button
                        type="button"
                        className={`${styles.socialBtn} ${styles.google}`}
                        onClick={handleGoogleLogin}
                        aria-label="Sign in with Google"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                            </g>
                        </svg>
                        <span>Google</span>
                    </button>
                )}
                {hasFacebook && (
                    <button
                        type="button"
                        className={`${styles.socialBtn} ${styles.facebook}`}
                        onClick={handleFacebookLogin}
                        aria-label="Sign in with Facebook"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span>Facebook</span>
                    </button>
                )}
            </div>
        </div>
    );
}
