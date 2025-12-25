'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyBorrowRequests, cancelBorrowRequest } from '@/features/borrowRequests/borrowRequestsSlice';
import { Button } from '@/components/ui/Button';
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MyRequestsPage() {
    const dispatch = useAppDispatch();
    const { borrowRequests, isLoading, error } = useAppSelector((state) => state.borrowRequests);
    const { user } = useAppSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchMyBorrowRequests());
    }, [dispatch]);

    const handleCancel = async (id: string) => {
        if (confirm('Are you sure you want to cancel this request?')) {
            await dispatch(cancelBorrowRequest(id));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED':
                return 'bg-green-100 text-green-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            case 'FULFILLED':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'APPROVED':
                return <CheckCircle className="w-4 h-4" />;
            case 'REJECTED':
                return <XCircle className="w-4 h-4" />;
            case 'FULFILLED':
                return <CheckCircle className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Borrow Requests</h1>
                    <p className="text-gray-600">Track the status of your book requests</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading your requests...</div>
                ) : borrowRequests.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {borrowRequests.map((request) => (
                            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-24 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                                            {request.book?.coverImage ? (
                                                <img
                                                    src={request.book.coverImage}
                                                    alt={request.book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">{request.book?.title || 'Unknown Book'}</h3>
                                            <p className="text-sm text-gray-500 mb-2">{request.book?.author || 'Unknown Author'}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                                    {getStatusIcon(request.status)}
                                                    {request.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Requested: {new Date(request.requestDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {request.notes && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <span className="font-medium">Note:</span> {request.notes}
                                                </p>
                                            )}
                                            {request.status === 'REJECTED' && request.rejectionReason && (
                                                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                                                    <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {request.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCancel(request.id)}
                                            >
                                                Cancel Request
                                            </Button>
                                        )}
                                        {request.status === 'APPROVED' && request.dueDate && (
                                            <div className="text-sm text-gray-600">
                                                Due: {new Date(request.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No requests yet</p>
                        <p className="mb-6">You haven&apos;t requested any books.</p>
                        <Link href="/books">
                            <Button>Browse Library</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
