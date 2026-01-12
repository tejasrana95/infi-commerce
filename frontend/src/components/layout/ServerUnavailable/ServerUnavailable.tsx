'use client';

import Image from 'next/image';
import React from 'react';

export default function ServerUnavailable() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center bg-gray-50">
            <div className="bg-white p-10 rounded-2xl max-w-lg shadow-sm border border-gray-100">
                <div className="w-30 h-30  bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Image src="/logo.webp" alt="Infi Commerce" width={100} height={52} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Service Temporarily Unavailable
                </h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    We are unable to connect to our servers at the moment. Please try again later.
                </p>
                <button
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>


            </div>
            <div className="mt-8 text-xs text-gray-400">
                Powered by &copy; {new Date().getFullYear()} <a href="https://www.infitechnology.com" target="_blank" rel="noopener noreferrer">Infi Commerce by Infi Technology</a>
            </div>
        </div>
    );
}
