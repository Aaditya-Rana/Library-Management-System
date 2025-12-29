import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Define cache tag types
export const TAG_TYPES = {
    BOOKS: 'Books',
    BOOK_COPIES: 'BookCopies',
    USERS: 'Users',
    TRANSACTIONS: 'Transactions',
    BORROW_REQUESTS: 'BorrowRequests',
    PAYMENTS: 'Payments',
    NOTIFICATIONS: 'Notifications',
    STATS: 'Stats',
    SETTINGS: 'Settings',
} as const;

// Create the base API slice with RTK Query
export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers) => {
            // Get token from localStorage
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            headers.set('Content-Type', 'application/json');
            return headers;
        },
    }),
    tagTypes: Object.values(TAG_TYPES),
    // Keep cached data for 5 minutes
    keepUnusedDataFor: 300,
    endpoints: () => ({}),
});

// Export hooks for usage in functional components
export const { } = apiSlice;
