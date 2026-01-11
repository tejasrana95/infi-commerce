// Base API Library for Frontend
// Handles authentication, sessions, headers, and provides HTTP methods
// Components call their own endpoints using this library

import { Store } from '@/types';
import { getRevalidateTime } from '@/lib/revalidation';

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
    private refreshToken: string | null = null;
    private storeId: string | null = null;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (token: string) => void;
        reject: (err: any) => void;
    }> = [];

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;

        // Try to get session/token from localStorage on client
        if (typeof window !== 'undefined') {
            this.sessionId = localStorage.getItem('sessionId');
            this.token = localStorage.getItem('authToken');
            this.refreshToken = localStorage.getItem('refreshToken');
            this.storeId = localStorage.getItem('storeId');
        }
    }

    // Set session ID
    setSessionId(sessionId: string) {
        this.sessionId = sessionId || null;
        if (typeof window !== 'undefined') {
            if (sessionId) {
                localStorage.setItem('sessionId', sessionId);
            } else {
                localStorage.removeItem('sessionId');
            }
        }
    }

    // Set auth token
    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', token);
        }
    }

    // Set refresh token
    setRefreshToken(token: string) {
        this.refreshToken = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('refreshToken', token);
        }
    }

    // Set store ID (for multi-tenant context)
    setStoreId(storeId: string) {
        this.storeId = storeId;
        if (typeof window !== 'undefined') {
            localStorage.setItem('storeId', storeId);
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

    // Get current store ID
    getStoreId(): string | null {
        return this.storeId;
    }

    // Clear auth
    clearAuth() {
        this.sessionId = null;
        this.token = null;
        this.refreshToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionId');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
        }
    }

    // Build headers
    private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        // Add store ID header for multi-tenant context
        if (this.storeId) {
            headers['X-Store-ID'] = this.storeId;
        }

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
        } catch (error: any) {
            // Check if error is 401 and we haven't already retried
            if (error.message.includes('401') || (error.response && error.response.status === 401)) {

                // If this WAS a refresh attempt that failed, don't retry, just logout
                if (endpoint === 'auth/customer/refresh') {
                    this.clearAuth();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw error;
                }

                if (!this.refreshToken) {
                    // No refresh token available, logout
                    this.clearAuth();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw error;
                }

                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        // Retry original request with new token
                        config = { ...config, token: token as string }; // Use new token override
                        // Update options header as well just in case
                        const newHeaders = {
                            ...options.headers,
                            'Authorization': `Bearer ${token}`
                        };
                        return this.request<T>(endpoint, { ...options, headers: newHeaders }, config);
                    }).catch(err => {
                        throw err;
                    });
                }

                this.isRefreshing = true;

                try {
                    const refreshResponse = await this.post<{ accessToken: string; refreshToken: string }>(
                        'auth/customer/refresh',
                        { refreshToken: this.refreshToken }
                    );

                    const { accessToken, refreshToken } = refreshResponse;

                    this.setToken(accessToken);
                    if (refreshToken) this.setRefreshToken(refreshToken);

                    this.processQueue(null, accessToken);

                    // Retry original request
                    const newHeaders = {
                        ...options.headers,
                        'Authorization': `Bearer ${accessToken}`
                    };
                    return this.request<T>(endpoint, { ...options, headers: newHeaders }, config);
                } catch (refreshError) {
                    this.processQueue(refreshError, null);
                    this.clearAuth();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                    throw refreshError;
                } finally {
                    this.isRefreshing = false;
                }
            }

            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token!);
            }
        });
        this.failedQueue = [];
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

    // Get Blob (for file downloads)
    async getBlob(endpoint: string, config?: ApiConfig): Promise<Blob> {
        const url = `${this.baseUrl}/${endpoint}`;
        const headers = this.buildHeaders(config?.headers);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    ...headers,
                    ...config?.headers,
                },
            });

            if (!response.ok) {
                const error = await response.json().catch(() => response.text());
                throw new Error(error?.message || `HTTP ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Upload file (multipart/form-data)
    async upload<T = any>(
        endpoint: string,
        formData: FormData,
        config?: ApiConfig
    ): Promise<T> {
        const url = `${this.baseUrl}/${endpoint}`;

        // Don't set Content-Type for FormData - let browser set it with boundary
        const headers: Record<string, string> = {};

        // Add store ID header for multi-tenant context
        if (this.storeId) {
            headers['X-Store-ID'] = this.storeId;
        }

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

export async function fetchStoreByDomain(domain: string, nocache: boolean = false): Promise<Store | null> {
    try {
        const cacheOptions = nocache ? { cache: 'no-store' as RequestCache } : { next: { revalidate: getRevalidateTime('store') } };
        const res = await fetch(`${API_BASE_URL}/stores/domain/${encodeURIComponent(domain)}`, {
            ...cacheOptions,
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

export async function fetchStoreById(storeId: string, nocache: boolean = false): Promise<Store | null> {
    try {
        const cacheOptions = nocache ? { cache: 'no-store' as RequestCache } : { next: { revalidate: getRevalidateTime('store') } };
        const res = await fetch(`${API_BASE_URL}/stores/${storeId}`, {
            ...cacheOptions,
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

export async function getStore(domain: string, nocache: boolean = false): Promise<Store | null> {
    // First try to get store by domain
    let store = await fetchStoreByDomain(domain, nocache);

    // Fallback for localhost development
    if (!store && domain.includes('localhost')) {
        store = await fetchStoreById(FALLBACK_STORE_ID, nocache);
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

// ============================================
// Server-Side Blog & Page Fetch Functions (SSR)
// ============================================

export async function fetchBlogPosts(storeId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    tag?: string;
    search?: string;
}) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', (params?.page || 1).toString());
        queryParams.append('limit', (params?.limit || 12).toString());
        queryParams.append('status', params?.status || 'published');

        if (params?.category) queryParams.append('category', params.category);
        if (params?.tag) queryParams.append('tag', params.tag);
        if (params?.search) queryParams.append('search', params.search);

        const res = await fetch(`${API_BASE_URL}/blog/posts?${queryParams.toString()}`, {
            next: { revalidate: 600 }, // Cache for 10 minutes
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return { data: [], pagination: { page: 1, pages: 1, total: 0, limit: 12 } };
        return await res.json();
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return { data: [], pagination: { page: 1, pages: 1, total: 0, limit: 12 } };
    }
}

export async function fetchBlogPostBySlug(storeId: string, slug: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/blog/posts/slug/${slug}`, {
            next: { revalidate: 300 },
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return null;
    }
}

export async function fetchBlogCategories(storeId: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/blog/categories`, {
            next: { revalidate: 3600 }, // Cache for 1 hour
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching blog categories:', error);
        return [];
    }
}

export async function fetchBlogTags(storeId: string, limit: number = 20) {
    try {
        const res = await fetch(`${API_BASE_URL}/blog/posts/tags?limit=${limit}`, {
            next: { revalidate: 3600 },
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching blog tags:', error);
        return [];
    }
}

export async function fetchPageBySlug(storeId: string, slug: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/pages/slug/${slug}`, {
            next: { revalidate: 300 },
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching page:', error);
        return null;
    }
}

export async function fetchHeroSlider(storeId: string, id: string) {
    try {
        const res = await fetch(`${API_BASE_URL}/hero-sliders/${id}`, {
            next: { revalidate: 300 },
            headers: {
                'Content-Type': 'application/json',
                'X-Store-ID': storeId,
            },
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error('Error fetching hero slider:', error);
        return null;
    }
}
