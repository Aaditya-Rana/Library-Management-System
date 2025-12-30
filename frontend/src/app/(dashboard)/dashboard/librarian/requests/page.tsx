'use client';

import { useEffect, useState } from 'react';
import { useGetAllBorrowRequestsQuery, useApproveBorrowRequestMutation, useRejectBorrowRequestMutation } from '@/features/borrowRequests/borrowRequestsApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import ApproveBorrowRequestModal from '@/components/modals/ApproveBorrowRequestModal';
import RejectionModal from '@/components/modals/RejectionModal';
import toast from 'react-hot-toast';
import { BorrowRequest } from '@/types';

export default function BorrowRequestsManagementPage() {
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);

    // RTK Query hooks
    const { data, isLoading, error } = useGetAllBorrowRequestsQuery({
        status: statusFilter,
        limit: 100
    });

    const [approveBorrowRequest] = useApproveBorrowRequestMutation();
    const [rejectBorrowRequest, { isLoading: isRejecting }] = useRejectBorrowRequestMutation();

    const borrowRequests = data?.data?.borrowRequests || [];

    const handleApproveClick = (request: BorrowRequest) => {
        setSelectedRequest(request);
        setApproveModalOpen(true);
    };

    const handleRejectClick = (request: BorrowRequest) => {
        setSelectedRequest(request);
        setRejectModalOpen(true);
    };

    const handleApproveSubmit = async (dueDate: string) => {
        if (!selectedRequest) return;

        try {
            await approveBorrowRequest({ id: selectedRequest.id, dueDate }).unwrap();
            toast.success('✅ Borrow request approved successfully!');
            setApproveModalOpen(false);
            setSelectedRequest(null);
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Failed to approve request';
            toast.error(errorMessage);
        }
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!selectedRequest) return;

        try {
            await rejectBorrowRequest({ id: selectedRequest.id, reason }).unwrap();
            toast.success('Request rejected successfully');
            setRejectModalOpen(false);
            setSelectedRequest(null);
        } catch (error: any) {
            const errorMessage = error?.data?.message || 'Failed to reject request';
            toast.error(errorMessage);
        }
    };

    // Filter locally for search
    const filteredRequests = borrowRequests.filter(request =>
        request.book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusTabs = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED'];

    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Borrow Requests</h1>
                    <p className="text-gray-600">Manage students&apos; book borrowing requests</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                        Error loading requests.
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Search by book title or user name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {statusTabs.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${statusFilter === status
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <Clock className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                            Loading requests...
                        </div>
                    ) : filteredRequests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {request.user.firstName} {request.user.lastName}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{request.user.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{request.book.title}</div>
                                                <div className="text-sm text-gray-500">{request.book.author}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(request.requestDate).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                    request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium">
                                                {request.status === 'PENDING' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApproveClick(request)}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRejectClick(request)}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500">
                            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900">No {statusFilter.toLowerCase()} requests</p>
                        </div>
                    )}
                </div>

                {/* Approve Modal */}
                {selectedRequest && (
                    <ApproveBorrowRequestModal
                        isOpen={approveModalOpen}
                        onClose={() => { setApproveModalOpen(false); setSelectedRequest(null); }}
                        onApprove={handleApproveSubmit}
                        requestId={selectedRequest.id}
                        bookTitle={selectedRequest.book?.title || 'Unknown Book'}
                        userName={`${selectedRequest.user?.firstName || ''} ${selectedRequest.user?.lastName || ''}`.trim()}
                    />
                )}

                {/* Reject Modal */}
                <RejectionModal
                    isOpen={rejectModalOpen}
                    onClose={() => { setRejectModalOpen(false); setSelectedRequest(null); }}
                    onConfirm={handleRejectSubmit}
                    isLoading={isRejecting}
                    title="Reject Borrow Request"
                />
            </div>
        </AuthGuard>
    );
}
