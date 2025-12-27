'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import api from '@/services/api';
import { BookOpen, AlertCircle, RefreshCw, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface UserStats {
    totalBorrowed: number;
    currentlyBorrowed: number;
    overdueBooks: number;
    totalFinesPaid: number;
    unpaidFines: number; // Assuming API provides this
}

export default function DashboardPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // TODO: Implement proper user stats endpoint in backend
        // For now, set default stats to avoid 404 errors
        setStats({
            totalBorrowed: 0,
            currentlyBorrowed: 0,
            overdueBooks: 0,
            totalFinesPaid: 0,
            unpaidFines: 0,
        });
        setIsLoading(false);
    }, [user]);

    const StatCard = ({ title, value, icon: Icon, colorClass, link }: any) => (
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
            </div>

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
