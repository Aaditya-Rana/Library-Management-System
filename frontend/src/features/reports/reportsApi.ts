import { apiSlice } from '@/services/apiSlice';
import { ApiResponse, DashboardStats, PopularBook, RevenueData } from '@/types';

export const reportsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getReportsStats: builder.query<ApiResponse<DashboardStats>, void>({
            query: () => '/reports/dashboard',
            providesTags: ['Stats'],
            keepUnusedDataFor: 300,
        }),
        getPopularBooks: builder.query<ApiResponse<{ books: PopularBook[] }>, { limit?: number; startDate?: string; endDate?: string }>({
            query: (params) => ({
                url: '/reports/books/popular',
                params,
            }),
            providesTags: ['Stats'],
            keepUnusedDataFor: 300,
        }),
        getRevenueReport: builder.query<ApiResponse<{ revenue: RevenueData[] }>, { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }>({
            query: (params) => ({
                url: '/reports/revenue',
                params,
            }),
            providesTags: ['Stats'],
            keepUnusedDataFor: 300,
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetReportsStatsQuery,
    useGetPopularBooksQuery,
    useGetRevenueReportQuery,
} = reportsApi;
