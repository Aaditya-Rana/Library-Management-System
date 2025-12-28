import axios from 'axios';
import { logout } from '../features/auth/authSlice';

let store: any;

export const injectStore = (_store: any) => {
    store = _store;
};

// Create Axios custom instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', // Fallback to local
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token'); // Default to localStorage
        if (store) {
            const state = store.getState();
            if (state.auth.token) {
                token = state.auth.token;
            }
        }
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors (e.g., 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if strict 401 handling is needed, but avoid redirect loop if already on login or request was for login
            const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');

            if (!isLoginRequest) {
                if (store) {
                    store.dispatch(logout());
                }
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
