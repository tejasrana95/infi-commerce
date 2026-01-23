import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineState {
    isOnline: boolean;
    pendingSync: number;
    lastSync: Date | null;
    queuedRequests: Array<{
        id: string;
        endpoint: string;
        method: string;
        data: any;
        timestamp: Date;
    }>;
    setOnlineStatus: (status: boolean) => void;
    addQueuedRequest: (endpoint: string, method: string, data: any) => void;
    removeQueuedRequest: (id: string) => void;
    clearQueue: () => void;
    updateLastSync: () => void;
}

export const useOfflineStore = create<OfflineState>()(
    persist(
        (set, get) => ({
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            pendingSync: 0,
            lastSync: null,
            queuedRequests: [],

            setOnlineStatus: (status) => set({ isOnline: status }),

            addQueuedRequest: (endpoint, method, data) => {
                const request = {
                    id: `req-${Date.now()}-${Math.random()}`,
                    endpoint,
                    method,
                    data,
                    timestamp: new Date(),
                };
                set((state) => ({
                    queuedRequests: [...state.queuedRequests, request],
                    pendingSync: state.pendingSync + 1,
                }));
            },

            removeQueuedRequest: (id) => {
                set((state) => ({
                    queuedRequests: state.queuedRequests.filter((req) => req.id !== id),
                    pendingSync: Math.max(0, state.pendingSync - 1),
                }));
            },

            clearQueue: () => set({ queuedRequests: [], pendingSync: 0 }),

            updateLastSync: () => set({ lastSync: new Date() }),
        }),
        {
            name: 'offline-storage',
        }
    )
);
