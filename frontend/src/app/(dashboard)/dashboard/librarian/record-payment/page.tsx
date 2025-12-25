'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { recordPayment } from '@/features/payments/paymentsSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DollarSign, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function RecordPaymentPage() {
    const dispatch = useAppDispatch();
    const [formData, setFormData] = useState({
        transactionId: '',
        amount: '',
        paymentMethod: 'CASH',
        lateFee: '',
        damageCharge: '',
        securityDeposit: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await dispatch(recordPayment({
                transactionId: formData.transactionId,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                lateFee: formData.lateFee ? parseFloat(formData.lateFee) : undefined,
                damageCharge: formData.damageCharge ? parseFloat(formData.damageCharge) : undefined,
                securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
                notes: formData.notes || undefined,
            })).unwrap();

            alert('Payment recorded successfully!');
            setFormData({
                transactionId: '',
                amount: '',
                paymentMethod: 'CASH',
                lateFee: '',
                damageCharge: '',
                securityDeposit: '',
                notes: '',
            });
        } catch (error: any) {
            alert(error || 'Failed to record payment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAmount = (
        (parseFloat(formData.lateFee) || 0) +
        (parseFloat(formData.damageCharge) || 0) +
        (parseFloat(formData.securityDeposit) || 0)
    ).toFixed(2);

    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                    <p className="text-gray-600">Record offline payment received at the counter</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                    <div>
                        <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction ID *
                        </label>
                        <div className="relative">
                            <Input
                                id="transactionId"
                                type="text"
                                required
                                value={formData.transactionId}
                                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                placeholder="Enter transaction ID"
                                className="pl-9"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700 mb-2">
                                Late Fee (₹)
                            </label>
                            <Input
                                id="lateFee"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.lateFee}
                                onChange={(e) => setFormData({ ...formData, lateFee: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="damageCharge" className="block text-sm font-medium text-gray-700 mb-2">
                                Damage Charge (₹)
                            </label>
                            <Input
                                id="damageCharge"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.damageCharge}
                                onChange={(e) => setFormData({ ...formData, damageCharge: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="securityDeposit" className="block text-sm font-medium text-gray-700 mb-2">
                                Security Deposit (₹)
                            </label>
                            <Input
                                id="securityDeposit"
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.securityDeposit}
                                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method *
                            </label>
                            <select
                                id="paymentMethod"
                                required
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                                <option value="UPI">UPI</option>
                                <option value="NET_BANKING">Net Banking</option>
                                <option value="WALLET">Wallet</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Amount:</span>
                            <span className="text-primary-600">₹{totalAmount}</span>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                            Amount Received (₹) *
                        </label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="Enter amount received"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            This should match the total amount (₹{totalAmount})
                        </p>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            placeholder="Additional notes about the payment..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            <DollarSign className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthGuard>
    );
}
