import { apiSlice } from '@/services/apiSlice';
import { Transaction, ApiResponse } from '@/types';

export const transactionsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllTransactions: builder.query<ApiResponse<{ transactions: Transaction[] } | Transaction[]>, { page?: number; limit?: number; search?: string; status?: string; userId?: string }>({
            query: (params) => ({
                url: '/transactions',
                params,
            }),
            providesTags: ['Transactions'],
        }),
        getUserTransactions: builder.query<ApiResponse<{ transactions: Transaction[] } | Transaction[]>, { userId: string; page?: number; limit?: number }>({
            query: ({ userId, ...params }) => ({
                url: `/transactions/user/${userId}`,
                params,
            }),
            providesTags: ['Transactions'],
        }),
        issueBook: builder.mutation<ApiResponse<Transaction>, { userId: string; bookId: string; dueDate: string; bookCopyId?: string }>({
            query: (data) => ({
                url: '/transactions/issue',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transactions', 'Books', 'BookCopies'],
        }),
        returnBook: builder.mutation<ApiResponse<Transaction>, string>({
            query: (transactionId) => ({
                url: `/transactions/${transactionId}/return`,
                method: 'POST',
            }),
            invalidatesTags: ['Transactions', 'Books', 'BookCopies'],
        }),
        renewBook: builder.mutation<ApiResponse<Transaction>, string>({
            query: (transactionId) => ({
                url: `/transactions/${transactionId}/renew`,
                method: 'POST',
            }),
            invalidatesTags: ['Transactions'],
        }),
        calculateFine: builder.query<ApiResponse<{ fineAmount: number; overdueDays: number }>, string>({
            query: (transactionId) => `/transactions/${transactionId}/calculate-fine`,
        }),
        payFine: builder.mutation<ApiResponse<Transaction>, { transactionId: string; amount: number; paymentMethod: string }>({
            query: ({ transactionId, ...data }) => ({
                url: `/transactions/${transactionId}/pay-fine`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transactions'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAllTransactionsQuery,
    useGetUserTransactionsQuery,
    useIssueBookMutation,
    useReturnBookMutation,
    useRenewBookMutation,
    useCalculateFineQuery, // Use lazy query in component if needed
    usePayFineMutation,
} = transactionsApi;
