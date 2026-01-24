import { StoreProvider } from '@/contexts/StoreContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <StoreProvider>
            <UserProvider>
                <AuthProvider>
                    <CurrencyProvider>
                            {children}
                    </CurrencyProvider>
                </AuthProvider>
            </UserProvider>
        </StoreProvider>
    );
}
