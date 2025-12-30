'use client';

import { useGetReportsStatsQuery, useGetPopularBooksQuery, useGetRevenueReportQuery } from '@/features/reports/reportsApi';
import { BookOpen, Users, TrendingUp, AlertCircle, DollarSign, Clock } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { PopularBook, RevenueData } from '@/types';

export default function ReportsPage() {
    // RTK Query hooks
    const { data: statsData, isLoading: isStatsLoading } = useGetReportsStatsQuery();
    const { data: popularBooksData, isLoading: isBooksLoading } = useGetPopularBooksQuery({ limit: 10 });
    const { data: revenueDataResult, isLoading: isRevenueLoading } = useGetRevenueReportQuery({ groupBy: 'month' });

    const dashboardStats = statsData?.data;
    const popularBooks = popularBooksData?.data?.books || [];
    const revenueData = revenueDataResult?.data?.revenue || [];

    const isLoading = isStatsLoading || isBooksLoading || isRevenueLoading;

    const stats = [
        {
            name: 'Total Books',
            value: dashboardStats?.overview?.totalBooks || 0,
            icon: BookOpen,
            color: 'bg-blue-500',
        },
        {
            name: 'Total Users',
            value: dashboardStats?.overview?.totalUsers || 0,
            icon: Users,
            color: 'bg-green-500',
        },
        {
            name: 'Active Loans',
            value: dashboardStats?.overview?.activeTransactions || 0,
            icon: TrendingUp,
            color: 'bg-purple-500',
        },
        {
            name: 'Overdue Books',
            value: dashboardStats?.overview?.overdueTransactions || 0,
            icon: AlertCircle,
            color: 'bg-red-500',
        },
        {
            name: 'Pending Fines',
            value: `₹${dashboardStats?.financial?.pendingFines?.toFixed(2) || 0}`,
            icon: DollarSign,
            color: 'bg-amber-500',
        },
        {
            name: 'Available Books',
            value: dashboardStats?.overview?.availableBooks || 0,
            icon: Clock,
            color: 'bg-orange-500',
        },
    ];

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600">Insights into library operations and performance</p>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Clock className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                        Loading statistics...
                    </div>
                ) : (
                    <>
                        {/* Dashboard Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stats.map((stat, index) => (
                                <div key={`stat-${index}-${stat.name}`} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                                        </div>
                                        <div className={`${stat.color} p-3 rounded-lg`}>
                                            <stat.icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Popular Books */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Books</h2>
                                {popularBooks.length > 0 ? (
                                    <div className="space-y-3">
                                        {popularBooks.map((book: PopularBook, index: number) => (
                                            <div key={`book-${book.bookId || index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{book.title}</p>
                                                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                                                </div>
                                                <div className="text-sm font-semibold text-gray-700">
                                                    {book.borrowCount} borrows
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No data available</p>
                                )}
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h2>
                                {revenueData.length > 0 ? (
                                    <div className="space-y-3">
                                        {revenueData.slice(0, 6).map((data: RevenueData, index: number) => (
                                            <div key={`revenue-${data.date || index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                                <span className="text-lg font-bold text-green-600">
                                                    ₹{data.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No revenue data available</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AuthGuard>
    );
}
