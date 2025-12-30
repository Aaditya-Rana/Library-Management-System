import { apiSlice } from '@/services/apiSlice';
import { Setting, ApiResponse } from '@/types';

export const settingsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSettings: builder.query<ApiResponse<{ settings: Setting[] }>, { category?: string }>({
            query: (params) => ({
                url: '/settings',
                params,
            }),
            providesTags: ['Settings'],
        }),
        getSettingByKey: builder.query<ApiResponse<{ setting: Setting }>, string>({
            query: (key) => `/settings/${key}`,
            providesTags: (result, error, key) => [{ type: 'Settings', id: key }],
        }),
        updateSetting: builder.mutation<ApiResponse<{ setting: Setting }>, { key: string; value: string | number | boolean }>({
            query: ({ key, value }) => ({
                url: `/settings/${key}`,
                method: 'PATCH',
                body: { value },
            }),
            invalidatesTags: ['Settings'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetSettingsQuery,
    useGetSettingByKeyQuery,
    useUpdateSettingMutation,
} = settingsApi;
