'use client';

import React, { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error for admin debugging
        console.error('Admin Dashboard Error:', error);
    }, [error]);

    return (
        <div className="admin-error-container" style={{
            padding: '40px',
            margin: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: '1px solid #eee'
        }}>
            <div style={{ marginBottom: '24px' }}>
                <svg
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', marginBottom: '12px' }}>
                Dashboard Error
            </h2>

            <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                The admin panel encountered an issue while rendering this section.
                You can try resetting this view or refresh the page.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#111827',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                >
                    Try Again
                </button>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    Reload Page
                </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    border: '1px solid #e5e7eb',
                    overflowX: 'auto'
                }}>
                    <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
                        {error.name}: {error.message}
                    </div>
                    <pre style={{ margin: 0, color: '#4b5563' }}>
                        {error.stack}
                    </pre>
                </div>
            )}
        </div>
    );
}
