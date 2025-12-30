import { apiSlice } from '@/services/apiSlice';
import { Notification } from '@/types';

export const notificationsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getNotifications: builder.query<{ success: boolean; data: { notifications: Notification[] } }, void>({
            query: () => '/notifications',
            providesTags: (result) =>
                result
                    ? [
                        ...result.data.notifications.map(({ id }) => ({ type: 'Notifications' as const, id })),
                        { type: 'Notifications', id: 'LIST' },
                    ]
                    : [{ type: 'Notifications', id: 'LIST' }],
        }),
        markNotificationRead: builder.mutation<{ success: boolean; data: Notification }, string>({
            query: (id) => ({
                url: `/notifications/${id}/read`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Notifications', id }, { type: 'Notifications', id: 'LIST' }],
        }),
        markAllNotificationsRead: builder.mutation<{ success: boolean; message: string }, void>({
            query: () => ({
                url: '/notifications/read-all',
                method: 'PATCH',
            }),
            invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
        deleteNotification: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'Notifications', id }, { type: 'Notifications', id: 'LIST' }],
        }),
        deleteAllNotifications: builder.mutation<{ success: boolean; message: string }, void>({
            query: () => ({
                url: '/notifications',
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation,
} = notificationsApi;
