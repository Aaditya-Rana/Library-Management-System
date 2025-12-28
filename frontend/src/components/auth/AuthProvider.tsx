'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/features/auth/authSlice';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    dispatch(setCredentials({ user, token }));
                } catch (error) {
                    console.error('Failed to parse user from localStorage', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('refreshToken');
                }
            }
            setIsChecking(false);
        };

        initializeAuth();
    }, [dispatch]);

    if (isChecking) {
        return null; // Or a loading spinner
    }

    return <>{children}</>;
}
