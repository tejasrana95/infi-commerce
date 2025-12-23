'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// ============================================
// Types
// ============================================

export interface CustomerAddress {
    _id?: string;
    type: 'billing' | 'shipping';
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    isDefault: boolean;
}

export interface CustomerPreferences {
    currency?: string;
    language?: string;
    newsletter?: boolean;
}

export interface Customer {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    emailVerified: boolean;
    avatar?: string;
    addresses: CustomerAddress[];
    wishlist: string[];
    preferences: CustomerPreferences;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

// ============================================
// Context Types
// ============================================

interface CustomerContextType {
    // Customer Data
    customer: Customer | null;
    token: string | null;

    // Auth State
    isAuthenticated: boolean;
    isLoading: boolean;

    // Computed/Derived Data
    fullName: string;
    initials: string;
    defaultShippingAddress: CustomerAddress | null;
    defaultBillingAddress: CustomerAddress | null;

    // Auth Actions
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean }>;
    logout: () => void;

    // Customer Update Actions
    updateCustomer: (data: Partial<Customer>) => void;
    updatePreferences: (prefs: Partial<CustomerPreferences>) => void;
    addAddress: (address: CustomerAddress) => void;
    updateAddress: (addressId: string, address: Partial<CustomerAddress>) => void;
    removeAddress: (addressId: string) => void;
    setDefaultAddress: (addressId: string, type: 'billing' | 'shipping') => void;

    // Refresh
    refreshCustomer: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const CustomerContext = createContext<CustomerContextType>({
    customer: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    fullName: '',
    initials: '',
    defaultShippingAddress: null,
    defaultBillingAddress: null,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    logout: () => { },
    updateCustomer: () => { },
    updatePreferences: () => { },
    addAddress: () => { },
    updateAddress: () => { },
    removeAddress: () => { },
    setDefaultAddress: () => { },
    refreshCustomer: async () => { },
});

// ============================================
// Hooks
// ============================================

// Main hook - returns everything
export function useCustomer() {
    return useContext(CustomerContext);
}

// Alias for auth-specific operations
export function useAuth() {
    const ctx = useContext(CustomerContext);
    return {
        customer: ctx.customer,
        isAuthenticated: ctx.isAuthenticated,
        isLoading: ctx.isLoading,
        login: ctx.login,
        register: ctx.register,
        logout: ctx.logout,
    };
}

// ============================================
// Provider
// ============================================

export function CustomerProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ============================================
    // Computed Values
    // ============================================
    const fullName = customer
        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
        : '';

    const initials = customer
        ? `${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase()
        : '';

    const defaultShippingAddress = customer?.addresses?.find(
        addr => addr.type === 'shipping' && addr.isDefault
    ) || customer?.addresses?.find(addr => addr.type === 'shipping') || null;

    const defaultBillingAddress = customer?.addresses?.find(
        addr => addr.type === 'billing' && addr.isDefault
    ) || customer?.addresses?.find(addr => addr.type === 'billing') || null;

    // ============================================
    // Auth Check on Mount
    // ============================================
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedToken = api.getToken();
                if (storedToken) {
                    setToken(storedToken);
                    const storedCustomer = localStorage.getItem('customer');
                    if (storedCustomer) {
                        setCustomer(JSON.parse(storedCustomer));
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                api.clearAuth();
                localStorage.removeItem('customer');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // ============================================
    // Refresh Customer (fetch latest from API)
    // ============================================
    const refreshCustomer = useCallback(async () => {
        if (!token) return;

        try {
            const response = await api.get('auth/customer/me');
            if (response.customer) {
                const customerData: Customer = {
                    _id: response.customer.id || response.customer._id,
                    email: response.customer.email,
                    firstName: response.customer.firstName,
                    lastName: response.customer.lastName,
                    phone: response.customer.phone,
                    emailVerified: response.customer.emailVerified,
                    addresses: response.customer.addresses || [],
                    wishlist: response.customer.wishlist || [],
                    preferences: response.customer.preferences || {},
                };
                setCustomer(customerData);
                localStorage.setItem('customer', JSON.stringify(customerData));
            }
        } catch (error) {
            console.error('Failed to refresh customer:', error);
        }
    }, [token]);

    // ============================================
    // Login
    // ============================================
    const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            // Call actual backend API
            const response = await api.post('auth/customer/login', {
                email,
                password,
            });

            if (!response.accessToken || !response.customer) {
                setIsLoading(false);
                return { success: false, error: response.message || 'Login failed' };
            }

            // Transform response customer to our Customer type
            const customerData: Customer = {
                _id: response.customer.id || response.customer._id,
                email: response.customer.email,
                firstName: response.customer.firstName,
                lastName: response.customer.lastName,
                phone: response.customer.phone,
                emailVerified: response.customer.emailVerified,
                addresses: response.customer.addresses || [],
                wishlist: response.customer.wishlist || [],
                preferences: response.customer.preferences || {
                    currency: 'USD',
                    language: 'en',
                    newsletter: false,
                },
            };

            api.setToken(response.accessToken);
            localStorage.setItem('customer', JSON.stringify(customerData));
            setToken(response.accessToken);
            setCustomer(customerData);
            setIsLoading(false);

            router.push('/account');
            return { success: true };
        } catch (error: any) {
            setIsLoading(false);
            return { success: false, error: error.message || 'Invalid email or password' };
        }
    }, [router]);

    // ============================================
    // Register
    // ============================================
    const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string; requiresVerification?: boolean }> => {
        setIsLoading(true);
        try {
            // Call actual backend API
            const response = await api.post('auth/customer/register', {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                password: data.password,
            });

            // New flow: registration requires email verification
            if (response.requiresVerification) {
                setIsLoading(false);
                return {
                    success: true,
                    requiresVerification: true
                };
            }

            // Legacy flow (won't happen with new backend, but kept for safety)
            if (!response.accessToken || !response.customer) {
                setIsLoading(false);
                return { success: false, error: response.message || 'Registration failed' };
            }

            // Transform response customer to our Customer type
            const customerData: Customer = {
                _id: response.customer.id || response.customer._id,
                email: response.customer.email,
                firstName: response.customer.firstName,
                lastName: response.customer.lastName,
                phone: response.customer.phone,
                emailVerified: response.customer.emailVerified || false,
                addresses: response.customer.addresses || [],
                wishlist: response.customer.wishlist || [],
                preferences: response.customer.preferences || {
                    currency: 'USD',
                    language: 'en',
                    newsletter: false,
                },
            };

            api.setToken(response.accessToken);
            localStorage.setItem('customer', JSON.stringify(customerData));
            setToken(response.accessToken);
            setCustomer(customerData);
            setIsLoading(false);

            router.push('/account');
            return { success: true };
        } catch (error: any) {
            setIsLoading(false);
            return { success: false, error: error.message || 'Registration failed' };
        }
    }, [router]);

    // ============================================
    // Logout
    // ============================================
    const logout = useCallback(() => {
        api.clearAuth();
        localStorage.removeItem('customer');
        setToken(null);
        setCustomer(null);
        router.push('/');
    }, [router]);

    // ============================================
    // Update Customer
    // ============================================
    const updateCustomer = useCallback((data: Partial<Customer>) => {
        setCustomer(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...data };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // ============================================
    // Update Preferences
    // ============================================
    const updatePreferences = useCallback((prefs: Partial<CustomerPreferences>) => {
        setCustomer(prev => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                preferences: { ...prev.preferences, ...prefs }
            };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // ============================================
    // Address Management
    // ============================================
    const addAddress = useCallback((address: CustomerAddress) => {
        setCustomer(prev => {
            if (!prev) return prev;
            const newAddress = { ...address, _id: `addr_${Date.now()}` };
            const updated = {
                ...prev,
                addresses: [...prev.addresses, newAddress]
            };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const updateAddress = useCallback((addressId: string, address: Partial<CustomerAddress>) => {
        setCustomer(prev => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                addresses: prev.addresses.map(addr =>
                    addr._id === addressId ? { ...addr, ...address } : addr
                )
            };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeAddress = useCallback((addressId: string) => {
        setCustomer(prev => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                addresses: prev.addresses.filter(addr => addr._id !== addressId)
            };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const setDefaultAddress = useCallback((addressId: string, type: 'billing' | 'shipping') => {
        setCustomer(prev => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                addresses: prev.addresses.map(addr => ({
                    ...addr,
                    isDefault: addr._id === addressId && addr.type === type
                        ? true
                        : (addr.type === type ? false : addr.isDefault)
                }))
            };
            localStorage.setItem('customer', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // ============================================
    // Render
    // ============================================
    return (
        <CustomerContext.Provider value={{
            customer,
            token,
            isAuthenticated: !!customer,
            isLoading,
            fullName,
            initials,
            defaultShippingAddress,
            defaultBillingAddress,
            login,
            register,
            logout,
            updateCustomer,
            updatePreferences,
            addAddress,
            updateAddress,
            removeAddress,
            setDefaultAddress,
            refreshCustomer,
        }}>
            {children}
        </CustomerContext.Provider>
    );
}

// Also export AuthProvider as an alias for backward compatibility
export { CustomerProvider as AuthProvider };
