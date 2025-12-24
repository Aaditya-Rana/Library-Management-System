'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ReturnBookPage() {
    const router = useRouter();
    const [step, setStep] = useState<'search' | 'confirm'>('search');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [returnDetails, setReturnDetails] = useState<any>(null);

    useEffect(() => {
        // Fetch initial active transactions
        fetchTransactions('');
    }, []);

    const fetchTransactions = async (query: string) => {
        setIsLoading(true);
        try {
            const url = query
                ? `/transactions?search=${query}&status=ISSUED`
                : `/transactions?status=ISSUED&limit=20`; // Default to recent issued

            const response = await api.get(url);
            setSearchResults(response.data.data || []);
        } catch (error) {
            console.error('Fetch failed', error);
            // Don't alert on initial fetch fail, just log
            if (query) alert('Search failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchTransactions(searchQuery);
    };

    const handleSelect = (transaction: any) => {
        setSelectedTransaction(transaction);
        setStep('confirm');
    };

    const handleConfirmReturn = async () => {
        if (!selectedTransaction) return;
        setIsLoading(true);
        try {
            // POST /transactions/:id/return
            const res = await api.post(`/transactions/${selectedTransaction.id}/return`, {});
            setReturnDetails(res.data.data);
            setSuccess(true);
        } catch (error: any) {
            console.error('Return failed', error);
            alert(error.response?.data?.message || 'Return failed');
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep('search');
        setSuccess(false);
        setSearchResults([]);
        setSelectedTransaction(null);
        setReturnDetails(null);
        setSearchQuery('');
    };

    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Return Book</h1>
                </div>

                {success && returnDetails ? (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-green-100 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Return Successful!</h2>
                        <div className="bg-gray-50 p-4 rounded-lg text-left inline-block w-full">
                            <p className="flex justify-between"><span>Status:</span> <span className="font-medium">Returned</span></p>
                            <p className="flex justify-between"><span>Date:</span> <span className="font-medium">{new Date(returnDetails.returnDate).toLocaleDateString()}</span></p>
                            {returnDetails.fineAmount > 0 && (
                                <p className="flex justify-between text-red-600 font-bold border-t border-gray-200 mt-2 pt-2">
                                    <span>Fine Due:</span>
                                    <span>₹{returnDetails.fineAmount}</span>
                                </p>
                            )}
                        </div>
                        <Button onClick={reset} className="w-full">Process Another Return</Button>
                    </div>
                ) : step === 'search' ? (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <Input
                                placeholder="Search by User, Book Title, ISBN or Barcode..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1"
                                autoFocus
                            />
                            <Button type="submit" isLoading={isLoading}>Search</Button>
                        </form>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-700">
                                {searchQuery ? 'Search Results' : 'Recently Issued Books'}
                            </h3>
                            <div className="space-y-2">
                                {searchResults.map(t => (
                                    <div key={t.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900">{t.book?.title || 'Unknown Book'}</p>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <p>User: <span className="font-medium text-gray-700">{t.user?.firstName} {t.user?.lastName}</span></p>
                                                <p>ISBN: {t.book?.isbn}</p>
                                                <p className={new Date(t.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => handleSelect(t)}>Return Book</Button>
                                    </div>
                                ))}
                                {searchResults.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        No active issued transactions found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <h2 className="text-xl font-bold">Confirm Return</h2>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Transaction ID</p>
                            <p className="font-mono text-gray-900 mb-4">{selectedTransaction.id}</p>

                            <p className="text-sm text-gray-500">Book</p>
                            <p className="font-medium text-gray-900 mb-4">{selectedTransaction.book?.title}</p>

                            <p className="text-sm text-gray-500">User</p>
                            <p className="font-medium text-gray-900">{selectedTransaction.user?.firstName} {selectedTransaction.user?.lastName}</p>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setStep('search')} className="flex-1">Cancel</Button>
                            <Button onClick={handleConfirmReturn} isLoading={isLoading} className="flex-1">
                                Confirm Return
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}
