'use client';

import { useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOfflineStore } from '@/store/offlineStore';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
    const { isOnline, pendingSync, setOnlineStatus } = useOfflineStore();

    useEffect(() => {
        const handleOnline = () => setOnlineStatus(true);
        const handleOffline = () => setOnlineStatus(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setOnlineStatus(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setOnlineStatus]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 right-4 z-50 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                    <WifiOff className="w-5 h-5" />
                    <div>
                        <p className="font-semibold text-sm">Offline Mode</p>
                        {pendingSync > 0 && (
                            <p className="text-xs opacity-90">{pendingSync} pending {pendingSync === 1 ? 'action' : 'actions'}</p>
                        )}
                    </div>
                </motion.div>
            )}
            {isOnline && pendingSync > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <div>
                        <p className="font-semibold text-sm">Syncing...</p>
                        <p className="text-xs opacity-90">{pendingSync} {pendingSync === 1 ? 'item' : 'items'} remaining</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
