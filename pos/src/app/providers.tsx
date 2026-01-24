import { StoreProvider } from '@/contexts/StoreContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <StoreProvider>
            <UserProvider>
                <AuthProvider>
                    <CurrencyProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </CurrencyProvider>
                </AuthProvider>
            </UserProvider>
        </StoreProvider>
    );
}
