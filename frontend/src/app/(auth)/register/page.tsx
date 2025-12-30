'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const registerSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema) as any,
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            dateOfBirth: '',
        },
    });

    const handleRegister = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await api.post('/auth/register', data);
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
                    <h2 className="text-2xl font-bold text-green-600 mb-4">Registration Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        Your account has been created successfully. Just wait for admin approval to log in.
                    </p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                    <Button onClick={() => router.push('/login')} variant="outline" className="mt-4">
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen py-12 flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Create your account</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(handleRegister)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                id="firstName"
                                label="First Name"
                                placeholder="John"
                                {...register('firstName')}
                                error={errors.firstName?.message}
                            />
                            <Input
                                id="lastName"
                                label="Last Name"
                                placeholder="Doe"
                                {...register('lastName')}
                                error={errors.lastName?.message}
                            />
                        </div>
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
                            id="phone"
                            type="tel"
                            label="Phone Number"
                            placeholder="+91..."
                            {...register('phone')}
                            error={errors.phone?.message}
                        />
                        <Input
                            id="dateOfBirth"
                            type="date"
                            label="Date of Birth"
                            {...register('dateOfBirth')}
                            error={errors.dateOfBirth?.message}
                        />
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            label="Password"
                            placeholder="••••••••"
                            {...register('password')}
                            error={errors.password?.message}
                        />
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
                        Create Account
                    </Button>
                </form>
            </div>
        </div>
    );
}
