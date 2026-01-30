'use client';

import React from 'react';
import { useSyncStore } from '../store/syncStore';
import { syncService } from '../services/sync.service';

export function SyncStatus() {
    const { isSyncing, lastSyncTime, syncError, isSyncingProducts, isSyncingCategories } = useSyncStore();

    const handleManualSync = async () => {
        try {
            await syncService.syncAll();
        } catch (error) {
            // Error is handled in store
        }
    };

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 border border-gray-200 shadow-sm text-xs">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : syncError ? 'bg-red-500' : 'bg-green-500'}`} />

            <div className="flex flex-col">
                <span className="font-medium text-gray-700">
                    {isSyncing ? 'Syncing...' : syncError ? 'Sync Failed' : 'Synced'}
                </span>
                {!isSyncing && lastSyncTime && (
                    <span className="text-gray-500 text-[10px]">
                        {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`ml-1 p-1 rounded hover:bg-gray-100 disabled:opacity-50 ${isSyncing ? 'animate-spin' : ''}`}
                title="Force Sync"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>

            {syncError && (
                <div className="absolute top-10 right-0 bg-red-100 text-red-800 p-2 rounded text-xs z-50 shadow-md">
                    {syncError}
                </div>
            )}
        </div>
    );
}
