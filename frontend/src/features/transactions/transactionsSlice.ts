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

            const url = '/transactions';
            if (params.userId) {
                queryParams.append('userId', params.userId);
            }

            const response = await api.get(`${url}?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }
);

export const fetchUserHistory = createAsyncThunk(
    'transactions/fetchUserHistory',
    async (params: { userId: string; page?: number; limit?: number }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await api.get(`/transactions/user/${params.userId}?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user transactions');
        }
    }
);

export const issueBook = createAsyncThunk(
    'transactions/issue',
    async (issueDto: { userId: string; bookId: string; dueDate: string; bookCopyId: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/transactions/issue', issueDto);
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

// Calculate Fine
export const calculateFine = createAsyncThunk(
    'transactions/calculateFine',
    async (transactionId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/transactions/${transactionId}/calculate-fine`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to calculate fine');
        }
    }
);

// Pay Fine
export const payFine = createAsyncThunk(
    'transactions/payFine',
    async ({ transactionId, amount, paymentMethod, transactionIdRef }: {
        transactionId: string;
        amount: number;
        paymentMethod: string;
        transactionIdRef?: string;
    }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transactions/${transactionId}/pay-fine`, {
                amount,
                paymentMethod,
                transactionId: transactionIdRef,
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to pay fine');
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
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch All Transactions
            .addCase(fetchAllTransactions.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllTransactions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.transactions = action.payload.data || action.payload;
                state.pagination = action.payload.meta || action.payload.pagination || null;
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
                state.transactions = action.payload.data || action.payload;
                state.pagination = action.payload.meta || action.payload.pagination || null;
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
            .addCase(returnBook.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(returnBook.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Calculate Fine
            .addCase(calculateFine.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(calculateFine.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update transaction with calculated fine
                const transactionId = action.payload.transactionId;
                const index = state.transactions.findIndex(t => t.id === transactionId);
                if (index !== -1 && action.payload.fineAmount !== undefined) {
                    state.transactions[index].fineAmount = action.payload.fineAmount;
                }
            })
            .addCase(calculateFine.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Pay Fine
            .addCase(payFine.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(payFine.fulfilled, (state, action) => {
                state.isLoading = false;
                // Update transaction after payment
                const transaction = action.payload.transaction;
                if (transaction) {
                    const index = state.transactions.findIndex(t => t.id === transaction.id);
                    if (index !== -1) {
                        state.transactions[index] = transaction;
                    }
                }
            })
            .addCase(payFine.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetTransactions } = transactionsSlice.actions;
export default transactionsSlice.reducer;
