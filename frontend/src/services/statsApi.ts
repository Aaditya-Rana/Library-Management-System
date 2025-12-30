import { apiSlice } from './apiSlice';

export interface UserStats {
    totalBorrowed: number;
    currentlyBorrowed: number;
    overdueBooks: number;
    totalFinesPaid: number;
    unpaidFines: number;
}

export const statsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserStats: builder.query<UserStats, string>({
            query: (userId) => `/users/${userId}/stats`,
            transformResponse: (response: { success: boolean; data: UserStats }) => response.data,
            providesTags: (result, error, userId) => [{ type: 'Stats', id: userId }],
        }),
    }),
});

export const { useGetUserStatsQuery } = statsApi;
