'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { BookOpen, Calendar, CheckCircle, AlertOctagon } from 'lucide-react';

interface Transaction {
    id: string;
    book: {
        title: string;
        author: string;
    };
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    issueDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'RENEWED';
    fineAmount?: number;
}


export default function HistoryPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'ISSUED' | 'RENEWED' | 'RETURNED' | 'OVERDUE'>('ALL');

    const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'LIBRARIAN';

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                // If Admin/Librarian, fetch ALL transactions. If Student, fetch personal history.
                const endpoint = isAdminOrLibrarian
                    ? `/transactions?limit=100`
                    : `/transactions/user/${user.id}?limit=100`;

                const response = await api.get(endpoint);
                setTransactions(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch history', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user, isAdminOrLibrarian]);

    const filteredTransactions = transactions.filter(t =>
        filter === 'ALL' ? true : t.status === filter
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isAdminOrLibrarian ? 'System Transaction History' : 'My Transaction History'}
                    </h1>
                    <p className="text-gray-600">
                        {isAdminOrLibrarian ? 'View all library transactions.' : 'View your borrowing history.'}
                    </p>
                </div>
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    {['ALL', 'ISSUED', 'RENEWED', 'RETURNED', 'OVERDUE'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status as any)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === status
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading history...</div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                    {isAdminOrLibrarian && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                                    <BookOpen className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{t.book.title}</div>
                                                    <div className="text-sm text-gray-500">{t.book.author}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {isAdminOrLibrarian && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {t.user?.firstName} {t.user?.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500">{t.user?.email}</div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(t.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(t.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'RETURNED' ? 'bg-gray-100 text-gray-800' :
                                                t.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {t.status === 'RETURNED' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                {t.status === 'OVERDUE' && <AlertOctagon className="w-3 h-3 mr-1" />}
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {t.fineAmount && t.fineAmount > 0 ? (
                                                <span className="font-bold text-red-600">₹{t.fineAmount}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No transactions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
