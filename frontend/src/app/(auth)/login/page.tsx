'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema) as any,
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    const handleLogin = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', { email: data.email, password: data.password });
            const { user, tokens } = response.data.data;

            dispatch(setCredentials({ user, token: tokens.accessToken }));

            // Handle persistence based on "Remember Me" (conceptually, backend handles generic token lifespan but we can store locally)
            // For now, abiding by previous logic of always storing tokens.
            localStorage.setItem('token', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
                router.push('/dashboard/admin');
            } else if (user.role === 'LIBRARIAN') {
                router.push('/dashboard/librarian');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // If user is already logged in, show message
    if (isAuthenticated && user) {
        const dashboardPath = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
            ? '/dashboard/admin'
            : user.role === 'LIBRARIAN'
                ? '/dashboard/librarian'
                : '/dashboard';

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900">Already Logged In</h2>
                        <p className="mt-4 text-gray-600">
                            You&apos;re currently signed in as <span className="font-semibold">{user.email}</span>
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push(dashboardPath)}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/')}
                            className="w-full"
                        >
                            Go to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign up
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleLogin)}>
                    <div className="space-y-4">
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            label="Email address"
                            placeholder="you@example.com"
                            {...register('email')}
                            error={errors.email?.message}
                        />
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            label="Password"
                            placeholder="••••••••"
                            {...register('password')}
                            error={errors.password?.message}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                {...register('rememberMe')}
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        Sign in
                    </Button>
                </form>
            </div>
        </div>
    );
}
