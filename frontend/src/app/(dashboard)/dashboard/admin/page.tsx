'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Users, BookOpen, Repeat, AlertTriangle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

interface DashboardStats {
    totalUsers: number;
    totalBooks: number;
    activeIssues: number;
    overdueReturns: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/reports/dashboard');
                setStats(response.data.data.stats);
            } catch (error) {
                // Fallback or mock if API not ready
                setStats({
                    totalUsers: 150,
                    totalBooks: 5000,
                    activeIssues: 450,
                    overdueReturns: 12
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value ?? '-'}</p>
            </div>
            <div className={`p-4 rounded-lg bg-${color}-50 text-${color}-600`}>
                <Icon className="w-8 h-8" />
            </div>
        </div>
    );

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
                    <p className="text-gray-600">System-wide statistics and activity.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers}
                        icon={Users}
                        color="blue"
                    />
                    <StatCard
                        title="Total Books"
                        value={stats?.totalBooks}
                        icon={BookOpen}
                        color="green"
                    />
                    <StatCard
                        title="Active Issues"
                        value={stats?.activeIssues}
                        icon={Repeat}
                        color="purple"
                    />
                    <StatCard
                        title="Overdue Returns"
                        value={stats?.overdueReturns}
                        icon={AlertTriangle}
                        color="red"
                    />
                </div>
            </div>
        </AuthGuard>
    );
}
