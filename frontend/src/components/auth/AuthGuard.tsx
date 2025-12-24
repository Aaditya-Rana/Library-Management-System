'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { user, isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // If not waiting for initial auth check from slice (if implemented)
        // we can check local storage or state

        // For now, assuming state is hydrated or we check persistence
        // In a real app, we might check token validity here

        // Simple check:
        const token = localStorage.getItem('token');

        if (!token && !isAuthenticated) {
            router.push('/login');
        } else {
            // If roles are specified, check role
            if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                router.push('/unauthorized'); // or dashboard
            }
        }
        if (isChecking) {
            // Use timeout to push it to end of event loop to simulate async or just avoiding sync update warning
            setTimeout(() => setIsChecking(false), 0);
        }
    }, [isAuthenticated, user, router, allowedRoles, isChecking]);

    if (isLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    // If authenticated (and authorized), render children
    // Note: This is a client-side check. API calls will fail if token is invalid.
    return <>{children}</>;
}
