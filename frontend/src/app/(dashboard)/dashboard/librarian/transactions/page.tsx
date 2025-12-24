'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, BookOpen, User } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

interface Transaction {
    id: string;
    book: { title: string };
    user: { firstName: string; lastName: string; email: string };
    issueDate: string;
    dueDate: string;
    returnDate?: string;
    status: string;
}

export default function LibrarianTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            // Assuming endpoint allows searching transactions by user or book
            const response = await api.get(`/transactions?search=${search}`);
            setTransactions(response.data.data.transactions);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchTransactions, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transaction Logs</h1>
                    <p className="text-gray-600">View and manage all circulation records.</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Search by user or book title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading logs...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">{t.user.firstName} {t.user.lastName}</div>
                                                    <div className="text-xs text-gray-500">{t.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">{t.book.title}</span>
                                            </div>
                                        </td>
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
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
