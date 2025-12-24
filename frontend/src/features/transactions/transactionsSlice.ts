import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { Transaction, Pagination } from '@/types';

export interface TransactionsState {
    transactions: Transaction[];
    currentTransaction: Transaction | null;
    isLoading: boolean;
    error: string | null;
    pagination: Pagination | null;
}

const initialState: TransactionsState = {
    transactions: [],
    currentTransaction: null,
    isLoading: false,
    error: null,
    pagination: null,
};

// Async Thunks

export const fetchAllTransactions = createAsyncThunk(
    'transactions/fetchAll',
    async (params: { page?: number; limit?: number; search?: string; status?: string; userId?: string } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);

            // If userId is provided, usage depends on whether it's the specific user endpoint or filter
            // But based on previous code, we might use the endpoint /transactions/user/:id for generic user history
            // or /transactions for admin view.

            // Let's stick to the /transactions endpoint for generic fetch, and handle user specific in a separate thunk if strictly needed,
            // OR make this thunk smart.

            const url = '/transactions';
            if (params.userId) {
                // Note: The previous code used /transactions/user/:id for personal history.
                // Ideally we should unify, but let's support the generic filter approach first if backend supports it.
                // Backend supports 'userId' in query param for /transactions?userId=...
                queryParams.append('userId', params.userId);
            }

            const response = await api.get(`${url}?${queryParams.toString()}`);
            return response.data; // Expecting { data: [], meta: {} }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }
);

export const fetchUserHistory = createAsyncThunk(
    'transactions/fetchUserHistory',
    async ({ userId, limit = 100 }: { userId: string; limit?: number }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/transactions/user/${userId}?limit=${limit}`);
            return response.data; // Expecting { data: [] } (based on previous fixes, check this)
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch history');
        }
    }
);

export const issueBook = createAsyncThunk(
    'transactions/issue',
    async (data: { bookId: string; userId: string; dueDate?: string; isHomeDelivery?: boolean; notes?: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/transactions/issue', data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to issue book');
        }
    }
);

export const returnBook = createAsyncThunk(
    'transactions/return',
    async (transactionId: string, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transactions/${transactionId}/return`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to return book');
        }
    }
);

const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetTransactions: (state) => {
            state.transactions = [];
            state.pagination = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchAllTransactions.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllTransactions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.transactions = action.payload.data || [];
                state.pagination = action.payload.meta || null;
            })
            .addCase(fetchAllTransactions.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch User History
            .addCase(fetchUserHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                // Note: fetchUserHistory response might differ slightly structurally if not standardized
                // Earlier fix used res.data.data
                state.transactions = action.payload.data || [];
            })
            .addCase(fetchUserHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Issue Book
            .addCase(issueBook.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(issueBook.fulfilled, (state) => {
                state.isLoading = false;
                // Optionally add to list, or just let component re-fetch
                // state.transactions.unshift(action.payload.data);
            })
            .addCase(issueBook.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Return Book
            .addCase(returnBook.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(returnBook.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update local state to reflect return
                const index = state.transactions.findIndex(t => t.id === action.payload.data.id);
                if (index !== -1) {
                    state.transactions[index] = action.payload.data;
                }
            })
            .addCase(returnBook.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetTransactions } = transactionsSlice.actions;
export default transactionsSlice.reducer;
