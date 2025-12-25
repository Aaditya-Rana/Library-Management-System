import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { Notification } from '@/types';

export interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationsState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

// Fetch user notifications
export const fetchNotifications = createAsyncThunk(
    'notifications/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

// Mark notification as read
export const markAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
        }
    }
);

// Mark all as read
export const markAllAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.patch('/notifications/read-all');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
        }
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.read) {
                state.unreadCount += 1;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload.data || [];
                state.unreadCount = state.notifications.filter(n => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Mark as Read
            .addCase(markAsRead.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(n => n.id === action.payload.data.id);
                if (index !== -1) {
                    state.notifications[index].read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            // Mark All as Read
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    },
});

export const { clearError, addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
