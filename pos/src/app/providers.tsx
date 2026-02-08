'use client';

import { StoreProvider } from '@/contexts/StoreContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { PWAProvider } from '@/contexts/PWAContext';
import PWARegistration from '@/components/pwa/PWARegistration';
import InstallPrompt from '@/components/pwa/InstallPrompt';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PWAProvider>
            <StoreProvider>
                <UserProvider>
                    <AuthProvider>
                        <CurrencyProvider>
                            <ToastProvider>
                                <PWARegistration />
                                <InstallPrompt />
                                {children}
                            </ToastProvider>
                        </CurrencyProvider>
                    </AuthProvider>
                </UserProvider>
            </StoreProvider>
        </PWAProvider>
    );
}
