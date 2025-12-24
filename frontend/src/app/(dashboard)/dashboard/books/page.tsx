'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { BookOpen, Clock, AlertTriangle } from 'lucide-react';

interface Transaction {
    id: string;
    book: {
        id: string;
        title: string;
        author: string;
        coverImageUrl?: string;
    };
    dueDate: string;
    status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
    fine?: number;
}

export default function MyBooksPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;
            try {
                const response = await api.get(`/transactions/user/${user.id}`);
                // Filter for active transactions (ISSUED or OVERDUE)
                // Adjust based on actual API response structure
                const allTransactions = response.data.data || [];
                const active = allTransactions.filter((t: any) => t.status === 'ISSUED' || t.status === 'OVERDUE');
                setTransactions(active);
            } catch (error) {
                console.error('Failed to fetch transactions', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
                <Button variant="outline">History</Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading your books...</div>
                ) : transactions.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {transactions.map((transaction) => {
                            const isOverdue = new Date(transaction.dueDate) < new Date() && transaction.status !== 'RETURNED';
                            const daysLeft = Math.ceil((new Date(transaction.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));

                            return (
                                <div key={transaction.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                            {transaction.book.coverImageUrl ? (
                                                <img src={transaction.book.coverImageUrl} alt={transaction.book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{transaction.book.title}</h3>
                                            <p className="text-sm text-gray-500">{transaction.book.author}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {isOverdue ? 'Overdue' : 'Active'}
                                                </span>
                                                {transaction.fine && transaction.fine > 0 && (
                                                    <span className="text-xs font-bold text-red-600">
                                                        Fine: ₹{transaction.fine}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="w-4 h-4 mr-1" />
                                            Due: {new Date(transaction.dueDate).toLocaleDateString()}
                                        </div>
                                        {isOverdue && (
                                            <div className="flex items-center text-sm text-red-600 font-medium">
                                                <AlertTriangle className="w-4 h-4 mr-1" />
                                                {Math.abs(daysLeft)} days overdue
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await api.post(`/transactions/${transaction.id}/renew`);
                                                        alert('Book renewed successfully!');
                                                        // Ideally re-fetch or update local state
                                                        window.location.reload(); // Quick refresh for now
                                                    } catch (e: any) {
                                                        alert(e.response?.data?.message || 'Failed to renew');
                                                    }
                                                }}
                                            >
                                                Renew
                                            </Button>
                                            <Button size="sm" variant="outline">Details</Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No active books</p>
                        <p className="mb-6">You have not borrowed any books currently.</p>
                        <Link href="/books">
                            <Button>Browse Library</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
