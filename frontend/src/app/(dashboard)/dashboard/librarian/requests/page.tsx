'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAllBorrowRequests, approveBorrowRequest, rejectBorrowRequest } from '@/features/borrowRequests/borrowRequestsSlice';
import { fetchSettings } from '@/features/settings/settingsSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BookOpen, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import ApproveBorrowRequestModal from '@/components/modals/ApproveBorrowRequestModal';
import toast from 'react-hot-toast';

export default function BorrowRequestsManagementPage() {
    const dispatch = useAppDispatch();
    const { borrowRequests, isLoading, error } = useAppSelector((state) => state.borrowRequests);
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    useEffect(() => {
        dispatch(fetchAllBorrowRequests({ status: statusFilter, limit: 100 }));
        dispatch(fetchSettings()); // Fetch settings for default loan period
    }, [dispatch, statusFilter]);

    const handleApproveClick = (request: any) => {
        setSelectedRequest(request);
        setApproveModalOpen(true);
    };

    const handleApproveSubmit = async (dueDate: string) => {
        if (!selectedRequest) return;

        try {
            await dispatch(approveBorrowRequest({ id: selectedRequest.id, dueDate })).unwrap();
            toast.success('✅ Borrow request approved successfully!');
            setApproveModalOpen(false);
            setSelectedRequest(null);
            // Refetch the requests to update the list
            dispatch(fetchAllBorrowRequests({ status: statusFilter, limit: 100 }));
        } catch (error: any) {
            toast.error(error || 'Failed to approve request');
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                await dispatch(rejectBorrowRequest({ id, reason })).unwrap();
                toast.success('Request rejected successfully');
                // Refetch the requests to update the list
                dispatch(fetchAllBorrowRequests({ status: statusFilter, limit: 100 }));
            } catch (error: any) {
                toast.error(error || 'Failed to reject request');
            }
        }
    };

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
                        {error}
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
                        <div className="p-8 text-center text-gray-500">Loading requests...</div>
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
                                                            onClick={() => handleReject(request.id)}
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
        </AuthGuard>
    );
}
