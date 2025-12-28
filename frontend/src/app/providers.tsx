'use client';

import { Provider } from 'react-redux';
import { store } from '../store';
import AuthProvider from '@/components/auth/AuthProvider';
import ToastProvider from '@/components/ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <AuthProvider>
                <ToastProvider />
                {children}
            </AuthProvider>
        </Provider>
    );
}
