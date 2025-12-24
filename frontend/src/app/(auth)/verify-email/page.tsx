'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid or missing verification token.');
                return;
            }

            try {
                // The endpoint is GET /auth/verify-email?token=...
                await api.get(`/auth/verify-email?token=${token}`);
                setStatus('success');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Email verification failed.');
            }
        };

        verifyEmail();
    }, [token]);

    if (status === 'loading') {
        return (
            <div className="text-center">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Verifying your email</h2>
                <p className="text-gray-600 mt-2">Please wait while we verify your email address...</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                <p className="text-gray-600 mt-2 mb-8">
                    Your email address has been successfully verified. You can now access all features.
                </p>
                <Link href="/login">
                    <Button className="w-full">Continue to Login</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600 mt-2 mb-8">{message}</p>
            <div className="flex flex-col gap-3">
                <Link href="/auth/resend-verification">
                    <Button variant="outline" className="w-full">Resend Verification Email</Button>
                </Link>
                <Link href="/login">
                    <Button variant="ghost" className="w-full">Back to Login</Button>
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <Suspense fallback={
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
                        <p>Loading...</p>
                    </div>
                }>
                    <VerifyEmailContent />
                </Suspense>
            </div>
        </div>
    );
}
