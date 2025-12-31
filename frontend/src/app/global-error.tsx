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
            <body className="flex flex-col items-center justify-center min-h-screen font-sans bg-gray-50 text-gray-900">
                <div className="bg-white p-12 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <svg
                            className="w-10 h-10 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold mb-4 tracking-tight">Critical System Error</h1>
                    <p className="text-gray-500 mb-10 text-lg leading-relaxed">
                        The application encountered a terminal error and could not load the core system.
                        Please try resetting the application.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-200"
                    >
                        Restart Application
                    </button>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-10 p-6 bg-gray-50 rounded-2xl text-left border border-gray-200">
                            <p className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-widest">Technical details</p>
                            <pre className="text-sm text-red-500 font-mono whitespace-pre-wrap break-all">
                                {error.message}
                            </pre>
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
