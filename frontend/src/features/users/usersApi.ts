import { apiSlice } from '@/services/apiSlice';
import { User, ApiResponse } from '@/types';

export const usersApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMe: builder.query<ApiResponse<{ user: User }>, void>({
            query: () => '/users/me',
            providesTags: ['Users'],
        }),
        updateMe: builder.mutation<ApiResponse<{ user: User }>, Partial<User>>({
            query: (data) => ({
                url: '/users/me',
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: ['Users'],
        }),
        getUsers: builder.query<ApiResponse<{ users: User[], meta: any }>, { search?: string; role?: string; status?: string }>({
            query: (params) => ({
                url: '/users',
                params,
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.users.map(({ id }) => ({ type: 'Users' as const, id })),
                        { type: 'Users', id: 'LIST' },
                    ]
                    : [{ type: 'Users', id: 'LIST' }],
        }),
        manageUserStatus: builder.mutation<void, { userId: string; action: 'approve' | 'suspend' | 'activate' }>({
            query: ({ userId, action }) => ({
                url: `/users/${userId}/${action}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: 'Users', id: userId }, { type: 'Users', id: 'LIST' }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetMeQuery,
    useUpdateMeMutation,
    useGetUsersQuery,
    useManageUserStatusMutation,
} = usersApi;
