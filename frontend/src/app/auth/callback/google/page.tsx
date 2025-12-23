'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useStore } from '@/providers/StoreProvider';

export default function GoogleCallbackPage() {
    const { store } = useStore();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing your login...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the hash fragment (contains access_token for implicit flow)
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);

                const accessToken = params.get('access_token');
                const error = params.get('error');

                if (error) {
                    throw new Error(error);
                }

                if (!accessToken) {
                    throw new Error('No access token received from Google');
                }

                setMessage('Verifying your account...');

                // Send the token to our backend to verify and create/login customer
                const response = await api.post('auth/customer/social-login', {
                    provider: 'google',
                    token: accessToken,
                    storeId: store?._id,
                });

                if (response.accessToken && response.customer) {
                    setStatus('success');
                    setMessage('Login successful! Redirecting...');

                    // Check if this is a popup window
                    if (window.opener && !window.opener.closed) {
                        // Send message to parent window
                        window.opener.postMessage({
                            type: 'SOCIAL_LOGIN_SUCCESS',
                            data: response,
                        }, window.location.origin);

                        // Close popup after a short delay
                        setTimeout(() => {
                            window.close();
                        }, 500);
                    } else {
                        // Not a popup, store data and redirect directly
                        api.setToken(response.accessToken);
                        const customerData = {
                            _id: response.customer.id || response.customer._id,
                            ...response.customer,
                        };
                        localStorage.setItem('customer', JSON.stringify(customerData));

                        setTimeout(() => {
                            window.location.href = '/account';
                        }, 1000);
                    }
                } else {
                    throw new Error(response.message || 'Login failed');
                }
            } catch (error: any) {
                console.error('Google OAuth callback error:', error);
                setStatus('error');
                setMessage(error.message || 'Something went wrong. Please try again.');

                // Notify parent if in popup
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'SOCIAL_LOGIN_ERROR',
                        error: error.message,
                    }, window.location.origin);
                }
            }
        };

        handleCallback();
    }, [store?._id]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            padding: '2rem',
        }}>
            <div style={{
                background: 'white',
                padding: '3rem',
                borderRadius: '20px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%',
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '3px solid #e5e7eb',
                            borderTopColor: '#4285f4',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                            margin: '0 auto 1.5rem',
                        }} />
                        <style jsx>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </>
                )}

                {status === 'success' && (
                    <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </div>
                )}

                <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '0.5rem',
                }}>
                    {status === 'loading' ? 'Signing you in with Google' :
                        status === 'success' ? 'Welcome!' : 'Login Failed'}
                </h2>

                <p style={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                }}>
                    {message}
                </p>

                {status === 'error' && (
                    <button
                        onClick={() => window.close()}
                        style={{
                            marginTop: '1.5rem',
                            padding: '12px 24px',
                            background: '#111827',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
}
