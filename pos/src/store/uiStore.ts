import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    isMobileCartOpen: boolean;
    isCheckoutOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
    toggleMobileCart: () => void;
    closeMobileCart: () => void;
    openCheckout: () => void;
    closeCheckout: () => void;
    isHoldOrderOpen: boolean;
    openHoldOrder: () => void;
    closeHoldOrder: () => void;
    isCustomerModalOpen: boolean;
    openCustomerModal: () => void;
    closeCustomerModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: false,
    isMobileCartOpen: false,
    isCheckoutOpen: false,
    isHoldOrderOpen: false,
    isCustomerModalOpen: false,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false }),
    toggleMobileCart: () => set((state) => ({ isMobileCartOpen: !state.isMobileCartOpen })),
    closeMobileCart: () => set({ isMobileCartOpen: false }),
    openCheckout: () => set({ isCheckoutOpen: true }),
    closeCheckout: () => set({ isCheckoutOpen: false }),
    openHoldOrder: () => set({ isHoldOrderOpen: true }),
    closeHoldOrder: () => set({ isHoldOrderOpen: false }),
    openCustomerModal: () => set({ isCustomerModalOpen: true }),
    closeCustomerModal: () => set({ isCustomerModalOpen: false }),
}));
