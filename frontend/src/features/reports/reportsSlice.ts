import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { DashboardStats, PopularBook, RevenueData } from '@/types';

export interface ReportsState {
    dashboardStats: DashboardStats | null;
    popularBooks: PopularBook[];
    revenueData: RevenueData[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ReportsState = {
    dashboardStats: null,
    popularBooks: [],
    revenueData: [],
    isLoading: false,
    error: null,
};

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
    'reports/dashboard',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/reports/dashboard');
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
        }
    }
);

// Fetch popular books report
export const fetchPopularBooks = createAsyncThunk(
    'reports/popularBooks',
    async (params: { limit?: number; startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await api.get(`/reports/books/popular?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch popular books');
        }
    }
);

// Fetch revenue report
export const fetchRevenueReport = createAsyncThunk(
    'reports/revenue',
    async (params: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.groupBy) queryParams.append('groupBy', params.groupBy);

            const response = await api.get(`/reports/revenue?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue report');
        }
    }
);

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Dashboard Stats
            .addCase(fetchDashboardStats.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.isLoading = false;
                state.dashboardStats = action.payload.data;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Popular Books
            .addCase(fetchPopularBooks.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPopularBooks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.popularBooks = action.payload.data || [];
            })
            .addCase(fetchPopularBooks.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Revenue Report
            .addCase(fetchRevenueReport.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchRevenueReport.fulfilled, (state, action) => {
                state.isLoading = false;
                state.revenueData = action.payload.data || [];
            })
            .addCase(fetchRevenueReport.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = reportsSlice.actions;
export default reportsSlice.reducer;
