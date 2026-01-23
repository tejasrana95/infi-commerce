import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StoreSettings } from '@/types';
import { mockSettings } from '@/mock/settings';

interface SettingsState extends StoreSettings {
    updateSettings: (settings: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...mockSettings,
            updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
        }),
        {
            name: 'settings-storage',
        }
    )
);
