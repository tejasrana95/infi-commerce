import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
    sessionStartTime: Date | null;
    isAuthenticated: boolean;
    storeName: string;
    userName: string;
    activeSession: any | null;
    startSession: (storeName?: string, userName?: string) => void;
    endSession: () => void;
    setAuth: (isAuthenticated: boolean, storeName?: string, userName?: string) => void;
    setActiveSession: (session: any) => void;
    logout: () => void;
    getSessionDuration: () => number;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set, get) => ({
            sessionStartTime: null,
            isAuthenticated: false,
            storeName: '',
            userName: '',
            activeSession: null,

            startSession: (storeName, userName) => set((state) => ({
                sessionStartTime: new Date(),
                isAuthenticated: true,
                storeName: storeName || state.storeName,
                userName: userName || state.userName
            })),

            endSession: () => set({ sessionStartTime: null, activeSession: null }),

            setAuth: (isAuthenticated, storeName, userName) => set({
                isAuthenticated,
                storeName: storeName || '',
                userName: userName || ''
            }),

            setActiveSession: (session) => set({ activeSession: session }),

            logout: () => set({ sessionStartTime: null, isAuthenticated: false, storeName: '', userName: '', activeSession: null }),

            getSessionDuration: () => {
                const { sessionStartTime } = get();
                if (!sessionStartTime) return 0;
                const startTime = typeof sessionStartTime === 'string'
                    ? new Date(sessionStartTime)
                    : sessionStartTime;
                return Math.floor((Date.now() - startTime.getTime()) / 1000);
            },
        }),
        {
            name: 'session-storage',
            partialize: (state) => ({
                sessionStartTime: state.sessionStartTime,
                isAuthenticated: state.isAuthenticated,
                storeName: state.storeName,
                userName: state.userName,
                activeSession: state.activeSession
            }),
        }
    )
);
