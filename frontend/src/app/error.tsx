'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Frontend runtime error:', error);
    }, [error]);

    const isNetworkError = error.message.includes('fetch failed') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('500') ||
        error.digest?.includes('ECONNREFUSED');

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="bg-red-50 p-8 rounded-2xl max-w-md border border-red-100 shadow-sm">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-8 h-8 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {isNetworkError ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        )}
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isNetworkError ? 'Server Unreachable' : 'Something went wrong!'}
                </h2>
                <p className="text-gray-600 mb-8">
                    {isNetworkError
                        ? 'We are unable to connect to our servers at the moment. Please check your internet connection or try again later.'
                        : 'We apologize for the inconvenience. An unexpected error has occurred while processing your request.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="px-6 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        Go back home
                    </Link>
                </div>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded text-left max-w-2xl overflow-auto">
                    <p className="text-xs font-mono text-gray-500 mb-2 uppercase">Debug Information</p>
                    <pre className="text-sm text-red-600 font-mono whitespace-pre-wrap">
                        {error.message}
                        {error.stack && `\n\n${error.stack}`}
                    </pre>
                </div>
            )}
        </div>
    );
}
