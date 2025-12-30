import { apiSlice } from '@/services/apiSlice';
import { Payment, ApiResponse } from '@/types';

export const paymentsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllPayments: builder.query<ApiResponse<{ payments: Payment[] } | Payment[]>, { page?: number; limit?: number; search?: string }>({
            query: (params) => ({
                url: '/payments',
                params,
            }),
            providesTags: ['Payments'],
        }),
        getUserPayments: builder.query<ApiResponse<{ payments: Payment[] } | Payment[]>, string>({
            query: (userId) => `/payments/user/${userId}`,
            providesTags: ['Payments'],
        }),
        recordPayment: builder.mutation<ApiResponse<Payment>, any>({
            query: (data) => ({
                url: '/payments/record',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payments'],
        }),
        getPaymentDetails: builder.query<ApiResponse<Payment>, string>({
            query: (id) => `/payments/${id}`,
            providesTags: (result, error, id) => [{ type: 'Payments', id }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAllPaymentsQuery,
    useGetUserPaymentsQuery,
    useRecordPaymentMutation,
    useGetPaymentDetailsQuery,
} = paymentsApi;
