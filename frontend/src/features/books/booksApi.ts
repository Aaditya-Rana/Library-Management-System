import { apiSlice } from '@/services/apiSlice';
import { Book, Pagination } from '@/types';

export const booksApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBooks: builder.query<{ data: Book[]; meta: Pagination }, { page?: number; limit?: number; search?: string; genre?: string; availability?: string }>({
            query: (params) => ({
                url: '/books',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Books' as const, id })),
                        { type: 'Books', id: 'LIST' },
                    ]
                    : [{ type: 'Books', id: 'LIST' }],
        }),
        getBook: builder.query<{ data: Book }, string>({
            query: (id) => `/books/${id}`,
            providesTags: (result, error, id) => [{ type: 'Books', id }],
        }),
        deleteBook: builder.mutation<void, string>({
            query: (id) => ({
                url: `/books/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Books', id }, { type: 'Books', id: 'LIST' }],
        }),
        // Add create/update later if needed, for now focusing on Delete/List as per page requirements
    }),
    overrideExisting: false,
});

export const {
    useGetBooksQuery,
    useGetBookQuery,
    useDeleteBookMutation,
} = booksApi;
