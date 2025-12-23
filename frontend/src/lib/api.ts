// Base API Library for Frontend
// Handles authentication, sessions, headers, and provides HTTP methods
// Components call their own endpoints using this library

import { Store } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiConfig {
    headers?: Record<string, string>;
    sessionId?: string;
    token?: string;
}

class ApiClient {
    private baseUrl: string;
    private sessionId: string | null = null;
    private token: string | null = null;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;

        // Try to get session/token from localStorage on client
        if (typeof window !== 'undefined') {
            this.sessionId = localStorage.getItem('sessionId');
            this.token = localStorage.getItem('authToken');
        }
    }

    // Set session ID
    setSessionId(sessionId: string) {
        this.sessionId = sessionId;
        if (typeof window !== 'undefined') {
            localStorage.setItem('sessionId', sessionId);
        }
    }

    // Set auth token
    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    }

    // Get current session ID
    getSessionId(): string | null {
        return this.sessionId;
    }

    // Get current token
    getToken(): string | null {
        return this.token;
    }

    // Clear auth
    clearAuth() {
        this.sessionId = null;
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('authToken');
        }
    }

    // Build headers
    private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        // Add session ID if available
        if (this.sessionId) {
            headers['X-Session-ID'] = this.sessionId;
        }

        // Add bearer token if available
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {},
        config?: ApiConfig
    ): Promise<T> {
        const url = `${this.baseUrl}/${endpoint}`;

        const headers = this.buildHeaders(config?.headers);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...headers,
                    ...options.headers,
                },
            });

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            const isJson = contentType?.includes('application/json');

            if (!response.ok) {
                const error = isJson ? await response.json() : await response.text();

                // Extract error message from different formats
                let errorMessage = `HTTP ${response.status}`;

                if (isJson && error?.message) {
                    // JSON error response
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    // HTML error page - try to extract the AppError message
                    const match = error.match(/AppError:\s*([^<\n]+)/);
                    if (match) {
                        errorMessage = match[1].trim();
                    } else if (error.includes('Error:')) {
                        // Try to extract any Error: message
                        const errorMatch = error.match(/Error:\s*([^<\n]+)/);
                        if (errorMatch) {
                            errorMessage = errorMatch[1].trim();
                        }
                    }
                }

                throw new Error(errorMessage);
            }

            return isJson ? await response.json() : (await response.text()) as T;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request
    async get<T = any>(endpoint: string, config?: ApiConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' }, config);
    }

    // POST request
    async post<T = any>(
        endpoint: string,
        data?: any,
        config?: ApiConfig
    ): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined,
            },
            config
        );
    }

    // PUT request
    async put<T = any>(
        endpoint: string,
        data?: any,
        config?: ApiConfig
    ): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'PUT',
                body: data ? JSON.stringify(data) : undefined,
            },
            config
        );
    }

    // PATCH request
    async patch<T = any>(
        endpoint: string,
        data?: any,
        config?: ApiConfig
    ): Promise<T> {
        return this.request<T>(
            endpoint,
            {
                method: 'PATCH',
                body: data ? JSON.stringify(data) : undefined,
            },
            config
        );
    }

    // DELETE request
    async delete<T = any>(endpoint: string, config?: ApiConfig): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' }, config);
    }

    // Upload file (multipart/form-data)
    async upload<T = any>(
        endpoint: string,
        formData: FormData,
        config?: ApiConfig
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        // Don't set Content-Type for FormData - let browser set it with boundary
        const headers: Record<string, string> = {};

        if (this.sessionId) {
            headers['X-Session-ID'] = this.sessionId;
        }

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    ...headers,
                    ...config?.headers,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => response.text());
                throw new Error(error?.message || error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Upload Error [${endpoint}]:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const api = new ApiClient();

export default api;
export { ApiClient };

// ============================================
// Server-Side Store Fetch Functions (SSR)
// ============================================

export async function fetchStoreByDomain(domain: string): Promise<Store | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/stores/domain/${encodeURIComponent(domain)}`, {
            next: { revalidate: 60 }, // Cache for 60 seconds
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            console.warn(`Store not found for domain: ${domain}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Error fetching store by domain:', error);
        return null;
    }
}

export async function fetchStoreById(storeId: string): Promise<Store | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
            next: { revalidate: 60 },
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            console.warn(`Store not found for ID: ${storeId}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('Error fetching store by ID:', error);
        return null;
    }
}

const FALLBACK_STORE_ID = process.env.FALLBACK_STORE_ID || '675bd1d5334c9f136d8849b2';

export async function getStore(domain: string): Promise<Store | null> {
    // First try to get store by domain
    let store = await fetchStoreByDomain(domain);

    // Fallback for localhost development
    if (!store && domain.includes('localhost')) {
        console.log(`Using fallback store for localhost. Domain was: ${domain}`);
        store = await fetchStoreById(FALLBACK_STORE_ID);
    }

    return store;
}

export async function fetchCurrencies(storeId: string): Promise<import('@/types').Currency[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/currencies?storeId=${storeId}&isActive=true`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.currencies || [];
    } catch (error) {
        console.error('Error fetching currencies:', error);
        return [];
    }
}

