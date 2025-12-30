'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertCircle } from 'lucide-react';

interface RejectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    isLoading?: boolean;
    title?: string;
}

export default function RejectionModal({ isOpen, onClose, onConfirm, isLoading = false, title = 'Reject Request' }: RejectionModalProps) {
    const [reason, setReason] = useState('');


    // Reuse animation effect from AlertModal
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;
        await onConfirm(reason);
        setReason('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="reason"
                            rows={4}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 border px-3 py-2 text-sm"
                            placeholder="Please provide a reason for rejection..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            This reason will be visible to the user.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            isLoading={isLoading}
                            disabled={!reason.trim() || isLoading}
                        >
                            Confirm Rejection
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
