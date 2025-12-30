'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGetUsersQuery, useManageUserStatusMutation } from '@/features/users/usersApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, MoreVertical, UserX, UserCheck, Shield } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useGetUsersQuery({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
    });

    const [manageUserStatus] = useManageUserStatusMutation();

    const users = data?.data?.users || [];

    const handleAction = async (userId: string, action: 'approve' | 'suspend' | 'activate') => {
        try {
            await manageUserStatus({ userId, action }).unwrap();
            toast.success(`User ${action}d successfully`);
        } catch (error: any) {
            toast.error(error?.data?.message || 'Action failed');
        }
    };

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600">Manage user access and roles.</p>
                    </div>
                    <Link href="/dashboard/admin/users/add">
                        <Button>Add User</Button>
                    </Link>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    <select
                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="USER">User</option>
                        <option value="LIBRARIAN">Librarian</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                    <select
                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING_APPROVAL">Pending</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                                        {user.firstName[0]}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                    user.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {user.status === 'PENDING_APPROVAL' && (
                                                    <button onClick={() => handleAction(user.id, 'approve')} className="text-green-600 hover:text-green-900 mr-3" title="Approve">
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {user.status === 'ACTIVE' && (
                                                    <button onClick={() => handleAction(user.id, 'suspend')} className="text-red-600 hover:text-red-900 mr-3" title="Suspend">
                                                        <UserX className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {user.status === 'SUSPENDED' && (
                                                    <button onClick={() => handleAction(user.id, 'activate')} className="text-green-600 hover:text-green-900 mr-3" title="Activate">
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <Link href={`/dashboard/admin/users/edit/${user.id}`} className="text-gray-400 hover:text-gray-600 ml-3">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
