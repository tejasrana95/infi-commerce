'use client';

import React, { createContext, useContext, useState } from 'react';

type AuthView = 'login' | 'register';

interface UIContextType {
    isAuthModalOpen: boolean;
    authView: AuthView;
    openAuthModal: (view?: AuthView) => void;
    closeAuthModal: () => void;
    setAuthView: (view: AuthView) => void;
}

const UIContext = createContext<UIContextType>({
    isAuthModalOpen: false,
    authView: 'login',
    openAuthModal: () => { },
    closeAuthModal: () => { },
    setAuthView: () => { },
});

export function useUI() {
    return useContext(UIContext);
}

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authView, setAuthViewState] = useState<AuthView>('login');

    const openAuthModal = (view: AuthView = 'login') => {
        setAuthViewState(view);
        setIsAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const setAuthView = (view: AuthView) => {
        setAuthViewState(view);
    };

    return (
        <UIContext.Provider value={{
            isAuthModalOpen,
            authView,
            openAuthModal,
            closeAuthModal,
            setAuthView
        }}>
            {children}
        </UIContext.Provider>
    );
}
