import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const getInitialState = (): AuthState => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        console.log('Rehydrating auth state', { hasToken: !!token, hasUser: !!userStr }); // Debug loading
        if (token && userStr) {
            try {
                return {
                    user: JSON.parse(userStr),
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null
                };
            } catch (e) {
                console.error('Failed to parse user from local storage');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }
    return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
    };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.error = null;
            // Persist
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
            // Clear persist
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setCredentials, logout, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;
