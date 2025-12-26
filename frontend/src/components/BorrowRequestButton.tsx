'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createBorrowRequest } from '@/features/borrowRequests/borrowRequestsSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BookPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface BorrowRequestButtonProps {
    bookId: string;
    bookTitle: string;
    availableCopies: number;
}

export function BorrowRequestButton({ bookId, bookTitle, availableCopies }: BorrowRequestButtonProps) {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleButtonClick = () => {
        if (!isAuthenticated || !user) {
            toast.error('Please sign in to borrow books', {
                duration: 5000,
                icon: '🔒',
            });
            setTimeout(() => router.push('/login'), 1500);
            return;
        }
        setIsOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await dispatch(createBorrowRequest({ bookId, notes: notes || undefined })).unwrap();
            toast.success('Borrow request submitted successfully!', {
                icon: '📚',
            });
            setIsOpen(false);
            setNotes('');
        } catch (error: any) {
            toast.error(error || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (availableCopies === 0) {
        return null;
    }

    return (
        <>
            <Button onClick={handleButtonClick} className="w-full">
                <BookPlus className="w-4 h-4 mr-2" />
                Request to Borrow
            </Button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Request to Borrow</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Book
                                </label>
                                <p className="text-gray-900 font-medium">{bookTitle}</p>
                            </div>

                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="notes"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Any special requests or preferred pickup time..."
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    Your request will be reviewed by a librarian. You&apos;ll be notified once it&apos;s approved.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
