'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

    const openAuthModal = useCallback((view: AuthView = 'login') => {
        setAuthViewState(view);
        setIsAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
    }, []);

    const setAuthView = useCallback((view: AuthView) => {
        setAuthViewState(view);
    }, []);

    const value = useMemo(() => ({
        isAuthModalOpen,
        authView,
        openAuthModal,
        closeAuthModal,
        setAuthView,
    }), [isAuthModalOpen, authView, openAuthModal, closeAuthModal, setAuthView]);

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
}
