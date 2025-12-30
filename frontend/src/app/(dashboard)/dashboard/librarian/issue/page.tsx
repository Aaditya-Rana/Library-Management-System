'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks'; // REDUX
import { issueBook } from '@/features/transactions/transactionsSlice'; // REDUX
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft, CheckCircle, Search, User as UserIcon, Book as BookIcon, Calendar } from 'lucide-react';

import AlertModal from '@/components/ui/AlertModal';

export default function IssueBookPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector(state => state.transactions);

    const [success, setSuccess] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning'
    });

    const [issueDetails, setIssueDetails] = useState({
        dueDate: '',
        isHomeDelivery: false,
        notes: ''
    });

    // Search states
    const [userSearch, setUserSearch] = useState('');
    const [bookSearch, setBookSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);
    const [foundBooks, setFoundBooks] = useState<any[]>([]);

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedBook, setSelectedBook] = useState<any>(null);

    const searchUsers = useCallback(async (query: string) => {
        try {
            const res = await api.get(`/users?search=${query}&limit=10`);
            setFoundUsers(res.data.data.users || []);
        } catch (e) {
            console.error(e);
            setFoundUsers([]);
        }
    }, []);

    const searchBooks = useCallback(async (query: string) => {
        try {
            const res = await api.get(`/books?search=${query}&limit=10`);
            setFoundBooks(res.data.data.data || res.data.data || []);
        } catch (e) {
            console.error(e);
            setFoundBooks([]);
        }
    }, []);

    useEffect(() => {
        // Fetch initial data

        // eslint-disable-next-line react-hooks/set-state-in-effect
        searchUsers('');

        searchBooks('');
    }, []);

    const handleSubmit = async () => {
        if (!selectedUser || !selectedBook) return;

        setSuccess(false);

        const payload: any = {
            userId: selectedUser.id,
            bookId: selectedBook.id,
            isHomeDelivery: issueDetails.isHomeDelivery,
            notes: issueDetails.notes
        };
        if (issueDetails.dueDate) {
            payload.dueDate = new Date(issueDetails.dueDate).toISOString();
        }

        try {
            const resultAction = await dispatch(issueBook(payload));
            if (issueBook.fulfilled.match(resultAction)) {
                setSuccess(true);
                // Reset form
                setSelectedUser(null);
                setSelectedBook(null);
                // Refresh lists
                searchUsers('');
                searchBooks('');
                setUserSearch('');
                setBookSearch('');
                setIssueDetails({
                    dueDate: '',
                    isHomeDelivery: false,
                    notes: ''
                });
            } else {
                const errorMessage = resultAction.payload as string || 'Failed to issue book.';
                if (errorMessage.toLowerCase().includes('pending fines')) {
                    setAlertConfig({
                        isOpen: true,
                        title: 'Pending Fines Detected',
                        message: 'This user has unpaid fines. They must clear all pending dues before borrowing new books.',
                        type: 'warning'
                    });
                } else {
                    setAlertConfig({
                        isOpen: true,
                        title: 'Issue Failed',
                        message: errorMessage,
                        type: 'error'
                    });
                }
            }
        } catch (error: any) {
            console.error('Failed to issue book', error);
            setAlertConfig({
                isOpen: true,
                title: 'System Error',
                message: 'An unexpected error occurred while processing the request.',
                type: 'error'
            });
        }
    };

    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Issue Book</h1>
                </div>

                {success && (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center shadow-sm border border-green-100">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Book issued successfully!
                    </div>
                )}

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Section */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserIcon className="w-5 h-5 text-primary-500" />
                                Select User
                            </h2>
                            {!selectedUser ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="Search by name or email..."
                                            value={userSearch}
                                            onChange={(e) => {
                                                setUserSearch(e.target.value);
                                                searchUsers(e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {foundUsers.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 cursor-pointer transition-colors"
                                            >
                                                <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        ))}
                                        {foundUsers.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 relative">
                                    <h3 className="font-bold text-primary-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <p className="text-sm text-primary-700">{selectedUser.email}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100"
                                        onClick={() => setSelectedUser(null)}
                                    >
                                        Change
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Section */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BookIcon className="w-5 h-5 text-primary-500" />
                                Select Book
                            </h2>
                            {!selectedBook ? (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Input
                                            placeholder="Search by title or ISBN..."
                                            value={bookSearch}
                                            onChange={(e) => {
                                                setBookSearch(e.target.value);
                                                searchBooks(e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {foundBooks.map(book => (
                                            <div
                                                key={book.id}
                                                onClick={() => setSelectedBook(book)}
                                                className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 cursor-pointer transition-colors"
                                            >
                                                <div className="font-medium text-gray-900 line-clamp-1">{book.title}</div>
                                                <div className="text-sm text-gray-500">{book.author}</div>
                                                <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                                    <span>ISBN: {book.isbn}</span>
                                                    <span className={book.availableCopies > 0 ? 'text-green-600' : 'text-red-500'}>
                                                        {book.availableCopies} available
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {foundBooks.length === 0 && (
                                            <p className="text-sm text-gray-400 text-center py-4">No books found</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 relative">
                                    <h3 className="font-bold text-primary-900 line-clamp-1">{selectedBook.title}</h3>
                                    <p className="text-sm text-primary-700">{selectedBook.author}</p>
                                    <p className="text-xs text-primary-600 mt-1">ID: {selectedBook.id}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100"
                                        onClick={() => setSelectedBook(null)}
                                    >
                                        Change
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        Issue Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Due Date (Optional)"
                            type="date"
                            value={issueDetails.dueDate}
                            onChange={(e) => setIssueDetails({ ...issueDetails, dueDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <div className="flex items-center pt-8">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                    checked={issueDetails.isHomeDelivery}
                                    onChange={(e) => setIssueDetails({ ...issueDetails, isHomeDelivery: e.target.checked })}
                                />
                                <span className="text-sm font-medium text-gray-700">Home Delivery</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                        <textarea
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm"
                            rows={3}
                            placeholder="Add any notes regarding this issue..."
                            value={issueDetails.notes}
                            onChange={(e) => setIssueDetails({ ...issueDetails, notes: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!selectedUser || !selectedBook || isLoading}
                        isLoading={isLoading}
                        className="w-full md:w-auto px-8"
                    >
                        Confirm Issue
                    </Button>
                </div>
            </div>
        </AuthGuard>
    );
}
