import { apiSlice } from '@/services/apiSlice';
import { BorrowRequest, Pagination, ApiResponse } from '@/types';

export const borrowRequestsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMyBorrowRequests: builder.query<ApiResponse<{ borrowRequests: BorrowRequest[]; pagination: Pagination }>, { page?: number; limit?: number }>({
            query: (params) => ({
                url: '/transactions/requests/my',
                params,
            }),
            providesTags: ['BorrowRequests'],
        }),
        createBorrowRequest: builder.mutation<ApiResponse<BorrowRequest>, { bookId: string; notes?: string }>({
            query: (data) => ({
                url: '/transactions/request',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BorrowRequests'],
        }),
        cancelBorrowRequest: builder.mutation<void, string>({
            query: (id) => ({
                url: `/transactions/requests/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['BorrowRequests'],
        }),
        // For Admin/Librarian
        getAllBorrowRequests: builder.query<ApiResponse<{ borrowRequests: BorrowRequest[]; pagination: Pagination }>, { page?: number; limit?: number; status?: string }>({
            query: (params) => ({
                url: '/transactions/requests',
                params,
            }),
            providesTags: ['BorrowRequests'],
        }),
        approveBorrowRequest: builder.mutation<ApiResponse<BorrowRequest>, { id: string; dueDate?: string }>({
            query: ({ id, dueDate }) => ({
                url: `/transactions/requests/${id}/approve`,
                method: 'POST',
                body: { dueDate },
            }),
            invalidatesTags: ['BorrowRequests', 'Transactions', 'Books'],
        }),
        rejectBorrowRequest: builder.mutation<ApiResponse<BorrowRequest>, { id: string; reason?: string }>({
            query: ({ id, reason }) => ({
                url: `/transactions/requests/${id}/reject`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: ['BorrowRequests'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetMyBorrowRequestsQuery,
    useCreateBorrowRequestMutation,
    useCancelBorrowRequestMutation,
    useGetAllBorrowRequestsQuery,
    useApproveBorrowRequestMutation,
    useRejectBorrowRequestMutation,
} = borrowRequestsApi;
