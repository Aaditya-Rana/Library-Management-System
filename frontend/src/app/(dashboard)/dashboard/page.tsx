'use client';

import { useAppSelector } from '@/store/hooks';
import { useGetUserStatsQuery } from '@/services/statsApi';
import { BookOpen, AlertCircle, RefreshCw, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value ?? '-'}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace('700', '50').replace('600', '50')}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAppSelector((state) => state.auth);

    // Use RTK Query hook for automatic caching (5 minutes)
    const { data: stats, isLoading, error } = useGetUserStatsQuery(user?.id || '', {
        skip: !user?.id, // Don't query if no user ID
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    Failed to load dashboard stats. Please try again later.
                </div>
            )}

            {/* Loading state */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Currently Borrowed"
                        value={stats?.currentlyBorrowed}
                        icon={BookOpen}
                        colorClass="text-primary-600"
                    />
                    <StatCard
                        title="Overdue Books"
                        value={stats?.overdueBooks}
                        icon={AlertCircle}
                        colorClass="text-red-600"
                    />
                    <StatCard
                        title="Total Borrowed"
                        value={stats?.totalBorrowed}
                        icon={RefreshCw}
                        colorClass="text-green-600"
                    />
                    <StatCard
                        title="Fines Paid"
                        value={`₹${stats?.totalFinesPaid || 0}`}
                        icon={IndianRupee}
                        colorClass="text-amber-600"
                    />
                </div>
            )}

            {/* Recent Activity or Quick Actions could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <Link href="/books">
                            <Button variant="outline">Browse Books</Button>
                        </Link>
                        <Link href="/dashboard/books">
                            <Button>View My Books</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
