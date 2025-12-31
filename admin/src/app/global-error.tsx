'use client';

import React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{
                margin: 0,
                padding: 0,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{
                    backgroundColor: '#fff',
                    padding: '48px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    maxWidth: '480px',
                    width: '90%',
                    textAlign: 'center',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                        }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                    </div>

                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 16px 0', letterSpacing: '-0.025em' }}>
                        System Integrity Error
                    </h1>

                    <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', margin: '0 0 40px 0' }}>
                        The admin system failed to initialize properly. This might be due to a server-side failure or a configuration issue.
                    </p>

                    <button
                        onClick={() => reset()}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    >
                        Restart Admin Panel
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div style={{
                            marginTop: '40px',
                            padding: '24px',
                            backgroundColor: '#111827',
                            borderRadius: '12px',
                            textAlign: 'left',
                            overflow: 'hidden'
                        }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Development Details</p>
                            <p style={{ margin: 0, fontSize: '14px', fontFamily: 'monospace', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {error.message}
                            </p>
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
