'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import { useGetUserTransactionsQuery, usePayFineMutation, useRenewBookMutation } from '@/features/transactions/transactionsApi';
import { Button } from '@/components/ui/Button';
import { BookOpen, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import PayFineModal from '@/components/PayFineModal';
import toast from 'react-hot-toast';
import Pagination from '@/components/Pagination';

export default function MyBooksPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [showPayFineModal, setShowPayFineModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const { data, isLoading } = useGetUserTransactionsQuery({
        userId: user?.id || '',
        page: currentPage,
        limit: itemsPerPage
    }, { skip: !user?.id });

    const [payFine] = usePayFineMutation();
    const [renewBook] = useRenewBookMutation();

    const rawData = data?.data;
    const transactions = Array.isArray(rawData) ? rawData : (rawData?.transactions || []);
    // @ts-expect-error - pagination might not exist on array response
    const pagination = Array.isArray(rawData) ? null : rawData?.pagination;

    // Filter active books or returned books with unpaid fines
    const currentBooks = Array.isArray(transactions) ? transactions.filter(t =>
        t.status !== 'RETURNED' || (t.fineAmount && t.fineAmount > 0)
    ) : [];

    const handlePayFine = async (data: { amount: number; paymentMethod: string; transactionIdRef?: string }) => {
        if (!selectedTransaction) return;
        try {
            await payFine({ transactionId: selectedTransaction.id, ...data }).unwrap();
            toast.success('Fine paid successfully!');
            setShowPayFineModal(false);
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to pay fine');
        }
    };

    const handleRenew = async (transactionId: string) => {
        try {
            await renewBook(transactionId).unwrap();
            toast.success('Book renewed successfully!');
        } catch (e: any) {
            toast.error(e?.data?.message || 'Failed to renew');
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (limit: number) => {
        setItemsPerPage(limit);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
                <Link href="/dashboard/history"><Button variant="outline">History</Button></Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                        <p>Loading your books...</p>
                    </div>
                ) : currentBooks.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {currentBooks.map((transaction) => {
                            const isOverdue = new Date(transaction.dueDate) < new Date() && transaction.status !== 'RETURNED';
                            const daysLeft = Math.ceil((new Date(transaction.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                            return (
                                <div key={transaction.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                            {transaction.book?.coverImage ? (
                                                <img src={transaction.book.coverImage} alt={transaction.book.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-gray-400" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{transaction.book?.title}</h3>
                                            <p className="text-sm text-gray-500">{transaction.book?.author}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {isOverdue ? 'Overdue' : transaction.status}
                                                </span>
                                                {transaction.fineAmount && transaction.fineAmount > 0 && (
                                                    <span className="text-xs font-bold text-red-600">Fine: ₹{transaction.fineAmount}</span>
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
                                            {transaction.fineAmount && transaction.fineAmount > 0 && !transaction.finePaid && (
                                                <Button size="sm" variant="outline" onClick={() => { setSelectedTransaction(transaction); setShowPayFineModal(true); }} className="text-red-600 border-red-600 hover:bg-red-50">
                                                    Pay Fine
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" onClick={() => handleRenew(transaction.id)}>Renew</Button>
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
                        <Link href="/books"><Button>Browse Library</Button></Link>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                />
            )}

            {showPayFineModal && selectedTransaction && (
                <PayFineModal isOpen={showPayFineModal} onClose={() => setShowPayFineModal(false)} transaction={selectedTransaction} onPayFine={handlePayFine} isLoading={isLoading} />
            )}
        </div>
    );
}
