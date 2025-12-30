'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAppSelector } from '@/store/hooks';

interface ApproveBorrowRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (dueDate: string) => void;
    requestId: string;
    bookTitle: string;
    userName: string;
}

export default function ApproveBorrowRequestModal({
    isOpen,
    onClose,
    onApprove,
    bookTitle,
    userName,
}: ApproveBorrowRequestModalProps) {
    const { settings } = useAppSelector((state) => state.settings);
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Get DEFAULT_LOAN_PERIOD from settings (default to 14 days)
            const loanPeriodSetting = settings.find((s) => s.key === 'DEFAULT_LOAN_PERIOD');
            const loanPeriodDays = loanPeriodSetting ? parseInt(loanPeriodSetting.value) : 14;

            // Calculate default due date
            const defaultDueDate = new Date();
            defaultDueDate.setDate(defaultDueDate.getDate() + loanPeriodDays);

            // Format as YYYY-MM-DD for input[type="date"]
            const formattedDate = defaultDueDate.toISOString().split('T')[0];
            setDueDate(formattedDate);
        }
    }, [isOpen, settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dueDate) return;

        setIsSubmitting(true);
        try {
            await onApprove(dueDate);
            onClose();
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            Approve Borrow Request
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Book:</span> {bookTitle}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">User:</span> {userName}
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="dueDate"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Due Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={minDate}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                disabled={isSubmitting}
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Default loan period has been applied. You can customize if needed.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!dueDate || isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? 'Approving...' : 'Approve Request'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
