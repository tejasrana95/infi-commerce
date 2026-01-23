import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token and store ID
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('pos_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add store ID header for all requests
        const storeId = localStorage.getItem('pos_store_id');
        if (storeId) {
            config.headers['x-store-id'] = storeId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear auth and redirect to login
            localStorage.removeItem('pos_auth_token');
            localStorage.removeItem('pos_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
