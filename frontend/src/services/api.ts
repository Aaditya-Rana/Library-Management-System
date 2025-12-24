import axios from 'axios';
import { store } from '../store';
import { logout } from '../features/auth/authSlice';

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
        const state = store.getState();
        const token = state.auth.token || localStorage.getItem('token'); // Fallback to localStorage
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
                store.dispatch(logout());
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
