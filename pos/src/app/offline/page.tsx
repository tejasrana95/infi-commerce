'use client';

import { usePWA } from '@/contexts/PWAContext';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
    const { settings } = usePWA();
    const offlineMessage = settings?.offlineSettings?.offlineMessage ||
        'You are currently offline. Some features may be limited.';

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                backgroundColor: settings?.backgroundColor || '#0f0f23'
            }}
        >
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700">
                    <WifiOff className="w-10 h-10 text-slate-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-3">
                    You&apos;re Offline
                </h1>

                {/* Message */}
                <p className="text-slate-400 mb-8">
                    {offlineMessage}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleRetry}
                        className="w-full px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>

                    <p className="text-slate-500 text-sm">
                        Check your internet connection and try again
                    </p>
                </div>

                {/* App info */}
                {settings?.icons?.icon192 && (
                    <div className="mt-12 flex items-center justify-center gap-3 text-slate-500 text-sm">
                        <img
                            src={settings.icons.icon192}
                            alt="App icon"
                            className="w-8 h-8 rounded-lg opacity-50"
                        />
                        <span>{settings.appName || 'POS System'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
