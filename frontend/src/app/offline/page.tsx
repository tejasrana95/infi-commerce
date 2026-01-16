'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-gray-50/50">
            <div className="relative mb-12">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-blue-400 rounded-full blur-[80px] opacity-20 animate-pulse"></div>

                <div className="relative bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center justify-center">
                    <WifiOff size={80} className="text-blue-500" strokeWidth={1.5} />
                </div>
            </div>

            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Connection Lost
            </h1>
            <p className="text-xl text-gray-500 max-w-xl mb-12 leading-relaxed font-medium">
                You're currently offline. We've saved some parts of the store for you to browse while you wait for your connection to return.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 text-lg"
                >
                    Try Reconnect
                </button>
                <Link
                    href="/"
                    className="px-10 py-4 bg-white text-gray-900 font-bold rounded-2xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:-translate-y-1 transition-all active:scale-95 text-lg"
                >
                    Return Home
                </Link>
            </div>

            <div className="mt-20 flex flex-col items-center gap-4">
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-blue-200 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                    ))}
                </div>
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                    Waiting for signal
                </p>
            </div>
        </div>
    );
}
