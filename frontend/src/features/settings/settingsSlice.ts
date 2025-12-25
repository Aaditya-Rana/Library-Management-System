import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { Setting } from '@/types';

export interface SettingsState {
    settings: Setting[];
    isLoading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    settings: [],
    isLoading: false,
    error: null,
};

// Fetch all settings
export const fetchSettings = createAsyncThunk(
    'settings/fetchAll',
    async (params: { category?: string } = {}, { rejectWithValue }) => {
        try {
            const url = params.category ? `/settings?category=${params.category}` : '/settings';
            const response = await api.get(url);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
        }
    }
);

// Get setting by key
export const fetchSettingByKey = createAsyncThunk(
    'settings/fetchByKey',
    async (key: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/settings/${key}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch setting');
        }
    }
);

// Update setting (ADMIN)
export const updateSetting = createAsyncThunk(
    'settings/update',
    async ({ key, value }: { key: string; value: string }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/settings/${key}`, { value });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update setting');
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Settings
            .addCase(fetchSettings.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.settings = action.payload.data || [];
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Setting by Key
            .addCase(fetchSettingByKey.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSettingByKey.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.settings.findIndex(s => s.key === action.payload.data.key);
                if (index !== -1) {
                    state.settings[index] = action.payload.data;
                } else {
                    state.settings.push(action.payload.data);
                }
            })
            .addCase(fetchSettingByKey.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Setting
            .addCase(updateSetting.fulfilled, (state, action) => {
                const index = state.settings.findIndex(s => s.key === action.payload.data.key);
                if (index !== -1) {
                    state.settings[index] = action.payload.data;
                }
            });
    },
});

export const { clearError } = settingsSlice.actions;
export default settingsSlice.reducer;
