'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        membershipType: '',
        status: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get(`/users/${params.id}`);
                const user = response.data.data.user;
                setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    phone: user.phone || '',
                    role: user.role || 'USER',
                    membershipType: user.membershipType || 'FREE',
                    status: user.status || 'ACTIVE'
                });
            } catch (error) {
                console.error('Failed to fetch user', error);
                alert('Failed to load user');
                router.push('/dashboard/admin/users');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchUser();
        }
    }, [params.id, router]);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.patch(`/users/${params.id}`, formData);
            router.push('/dashboard/admin/users');
        } catch (error: any) {
            console.error('Failed to update user', error);
            alert(error.response?.data?.message || 'Failed to update user');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="First Name"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                        <Input
                            label="Last Name"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                        />

                        {/* Email is often read-only, but admins might need to change it. Keeping it disabled for safety unless explicitly needed. */}
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            disabled
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <Input
                            label="Phone"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                name="role"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm"
                                value={formData.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="USER">User</option>
                                <option value="LIBRARIAN">Librarian</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Membership</label>
                            <select
                                name="membershipType"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm"
                                value={formData.membershipType}
                                onChange={handleChange}
                                required
                            >
                                <option value="FREE">Free</option>
                                <option value="PREMIUM">Premium</option>
                                <option value="STUDENT">Student</option>
                                <option value="CORPORATE">Corporate</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" isLoading={isSaving}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </AuthGuard>
    );
}
