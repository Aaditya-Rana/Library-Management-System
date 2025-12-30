'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface PayFineModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
    onPayFine: (data: { amount: number; paymentMethod: string; transactionIdRef?: string }) => Promise<void>;
    isLoading?: boolean;
}

export default function PayFineModal({ isOpen, onClose, transaction, onPayFine, isLoading = false }: PayFineModalProps) {
    const [amount, setAmount] = useState(transaction?.fineAmount?.toString() || '0');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [transactionIdRef, setTransactionIdRef] = useState('');

    if (!isOpen || !transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (paymentAmount < (transaction.fineAmount || 0)) {
            alert(`Payment amount must be at least ₹${transaction.fineAmount}`);
            return;
        }
        await onPayFine({ amount: paymentAmount, paymentMethod, transactionIdRef: transactionIdRef || undefined });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Pay Fine</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">{transaction.book?.title}</h3>
                    <div className="space-y-1 text-sm text-red-800">
                        <p>Fine Amount: <span className="font-bold">₹{transaction.fineAmount || 0}</span></p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required>
                            <option value="CASH">Cash</option>
                            <option value="CARD">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="NET_BANKING">Net Banking</option>
                        </select>
                    </div>
                    <Input label="Amount" type="number" step="0.01" min={transaction.fineAmount || 0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    <Input label="Transaction ID (Optional)" type="text" value={transactionIdRef} onChange={(e) => setTransactionIdRef(e.target.value)} />
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" className="flex-1" isLoading={isLoading}>Pay ₹{amount}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
