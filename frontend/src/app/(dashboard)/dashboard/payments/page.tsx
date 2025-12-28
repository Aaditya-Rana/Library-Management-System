'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserPayments } from '@/features/payments/paymentsSlice';
import { Button } from '@/components/ui/Button';
import { DollarSign, Receipt } from 'lucide-react';
import Link from 'next/link';

export default function MyPaymentsPage() {
    const dispatch = useAppDispatch();
    const { payments, isLoading, error } = useAppSelector((state) => state.payments);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            dispatch(fetchUserPayments(user.id));
        }
    }, [dispatch, user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            case 'REFUNDED':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            CASH: 'Cash',
            CARD: 'Card',
            UPI: 'UPI',
            NET_BANKING: 'Net Banking',
            WALLET: 'Wallet',
        };
        return labels[method] || method;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
                    <p className="text-gray-600">View your payment history and receipts</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading payments...</div>
                ) : payments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breakdown</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {payment.paymentDate
                                                ? new Date(payment.paymentDate).toLocaleDateString()
                                                : new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.transaction ? (
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {payment.transaction.book.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.transaction.book.author}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {getPaymentMethodLabel(payment.paymentMethod)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs space-y-1">
                                                {payment.lateFee && payment.lateFee > 0 && (
                                                    <div className="text-gray-600">
                                                        Late Fee: ₹{payment.lateFee.toFixed(2)}
                                                    </div>
                                                )}
                                                {payment.damageCharge && payment.damageCharge > 0 && (
                                                    <div className="text-gray-600">
                                                        Damage: ₹{payment.damageCharge.toFixed(2)}
                                                    </div>
                                                )}
                                                {payment.deliveryFee && payment.deliveryFee > 0 && (
                                                    <div className="text-gray-600">
                                                        Delivery: ₹{payment.deliveryFee.toFixed(2)}
                                                    </div>
                                                )}
                                                {payment.securityDeposit && payment.securityDeposit > 0 && (
                                                    <div className="text-gray-600">
                                                        Deposit: ₹{payment.securityDeposit.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                            ₹{payment.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                    payment.paymentStatus
                                                )}`}
                                            >
                                                {payment.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No payments yet</p>
                        <p className="mb-6">You don&apos;t have any payment records.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
