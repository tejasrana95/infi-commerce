'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/contexts/PWAContext';
import {
    setupInstallPrompt,
    showInstallPrompt,
    isPWAInstalled,
    isIOS,
    getInstallInstructions
} from '@/lib/pwa/pwa-utils';
import { X, Download, Share } from 'lucide-react';

interface InstallPromptProps {
    className?: string;
}

export default function InstallPrompt({ className }: InstallPromptProps) {
    const { settings } = usePWA();
    const [showPrompt, setShowPrompt] = useState(false);
    const [promptReady, setPromptReady] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const promptStyle = settings?.installPromptStyle || 'toast';

    useEffect(() => {
        // Don't show if already installed, disabled, or dismissed
        if (isPWAInstalled() || dismissed || !settings?.enabled || promptStyle === 'none') {
            return;
        }

        // Check if already dismissed in this session
        const sessionDismissed = sessionStorage.getItem('pwa-install-dismissed');
        if (sessionDismissed) {
            setDismissed(true);
            return;
        }

        // Setup install prompt listener
        setupInstallPrompt(() => {
            setPromptReady(true);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 2000);
        });

        // For iOS, show custom instructions after delay
        if (isIOS()) {
            setTimeout(() => setShowPrompt(true), 3000);
        }
    }, [settings, dismissed, promptStyle]);

    const handleInstall = async () => {
        const installed = await showInstallPrompt();
        if (installed) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        setDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt || !settings?.enabled) {
        return null;
    }

    // Toast style (bottom notification)
    if (promptStyle === 'toast') {
        return (
            <div className={`fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 ${className}`}>
                <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-4 animate-slide-up">
                    <div className="flex items-start gap-3">
                        {settings.icons?.icon192 && (
                            <img
                                src={settings.icons.icon192}
                                alt="App icon"
                                className="w-12 h-12 rounded-lg flex-shrink-0"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold text-sm">
                                Install {settings.appShortName || 'POS'}
                            </h3>
                            <p className="text-slate-400 text-xs mt-1">
                                {isIOS()
                                    ? getInstallInstructions()
                                    : 'Install for quick access and offline use'
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-500 hover:text-slate-300 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    {!isIOS() && promptReady && (
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-3 py-2 text-slate-400 text-sm hover:text-white transition-colors"
                            >
                                Not now
                            </button>
                            <button
                                onClick={handleInstall}
                                className="flex-1 px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Install
                            </button>
                        </div>
                    )}
                    {isIOS() && (
                        <div className="mt-3 flex items-center gap-2 text-violet-400 text-xs">
                            <Share className="w-4 h-4" />
                            <span>Tap Share, then &quot;Add to Home Screen&quot;</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Banner style (top bar)
    if (promptStyle === 'banner') {
        return (
            <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
                <div
                    className="py-3 px-4 flex items-center justify-between"
                    style={{
                        backgroundColor: settings.themeColor || '#1a1a2e'
                    }}
                >
                    <div className="flex items-center gap-3">
                        {settings.icons?.icon192 && (
                            <img
                                src={settings.icons.icon192}
                                alt="App icon"
                                className="w-8 h-8 rounded-lg"
                            />
                        )}
                        <span className="text-white text-sm">
                            {isIOS()
                                ? getInstallInstructions()
                                : `Install ${settings.appShortName || 'POS'} for quick access`
                            }
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isIOS() && promptReady && (
                            <button
                                onClick={handleInstall}
                                className="px-4 py-1.5 bg-white text-slate-900 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Install
                            </button>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="text-white/70 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
