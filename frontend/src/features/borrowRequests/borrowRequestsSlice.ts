import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { BorrowRequest, Pagination } from '@/types';

export interface BorrowRequestsState {
    borrowRequests: BorrowRequest[];
    currentRequest: BorrowRequest | null;
    isLoading: boolean;
    error: string | null;
    pagination: Pagination | null;
}

const initialState: BorrowRequestsState = {
    borrowRequests: [],
    currentRequest: null,
    isLoading: false,
    error: null,
    pagination: null,
};

// Create borrow request (USER)
export const createBorrowRequest = createAsyncThunk(
    'borrowRequests/create',
    async (data: { bookId: string; notes?: string }, { rejectWithValue }) => {
        try {
            const response = await api.post('/transactions/request', data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create borrow request');
        }
    }
);

// Get user's borrow requests
export const fetchMyBorrowRequests = createAsyncThunk(
    'borrowRequests/fetchMy',
    async (params: { userId: string; page?: number; limit?: number } = { userId: '' }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await api.get(`/transactions/requests/my?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch borrow requests');
        }
    }
);

// Get all borrow requests (LIBRARIAN/ADMIN)
export const fetchAllBorrowRequests = createAsyncThunk(
    'borrowRequests/fetchAll',
    async (params: { page?: number; limit?: number; status?: string } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.status) queryParams.append('status', params.status);

            const response = await api.get(`/transactions/requests?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
        }
    }
);

// Approve borrow request (LIBRARIAN/ADMIN)
export const approveBorrowRequest = createAsyncThunk(
    'borrowRequests/approve',
    async ({ id, dueDate, bookCopyId }: { id: string; dueDate?: string; bookCopyId?: string }, { rejectWithValue }) => {
        try {
            // If bookCopyId not provided, fetch available copies for this request
            let copyId = bookCopyId;

            if (!copyId) {
                // Get the borrow request to find the book
                const requestResponse = await api.get(`/transactions/requests/${id}`);
                const request = requestResponse.data.data;

                // Get available copies for this book
                const copiesResponse = await api.get(`/books/${request.bookId}/copies`);
                const availableCopy = copiesResponse.data.data.copies.find((copy: any) => copy.status === 'AVAILABLE');

                if (!availableCopy) {
                    throw new Error('No available copies for this book');
                }

                copyId = availableCopy.id;
            }

            const response = await api.patch(`/transactions/requests/${id}/approve`, {
                bookCopyId: copyId,
                dueDate
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to approve request');
        }
    }
);

// Reject borrow request (LIBRARIAN/ADMIN)
export const rejectBorrowRequest = createAsyncThunk(
    'borrowRequests/reject',
    async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
        try {
            const response = await api.post(`/transactions/requests/${id}/reject`, { reason });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to reject request');
        }
    }
);

// Cancel borrow request (USER)
export const cancelBorrowRequest = createAsyncThunk(
    'borrowRequests/cancel',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/transactions/requests/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to cancel request');
        }
    }
);

const borrowRequestsSlice = createSlice({
    name: 'borrowRequests',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetRequests: (state) => {
            state.borrowRequests = [];
            state.pagination = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Request
            .addCase(createBorrowRequest.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createBorrowRequest.fulfilled, (state, action) => {
                state.isLoading = false;
                state.borrowRequests.unshift(action.payload.data);
            })
            .addCase(createBorrowRequest.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch My Requests
            .addCase(fetchMyBorrowRequests.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMyBorrowRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                // API returns { success: true, data: { borrowRequests: [...] } }
                const requests = action.payload.data?.borrowRequests || action.payload.data || [];
                state.borrowRequests = Array.isArray(requests) ? requests : [];
            })
            .addCase(fetchMyBorrowRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch All Borrow Requests (Librarian/Admin)
            .addCase(fetchAllBorrowRequests.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllBorrowRequests.fulfilled, (state, action) => {
                state.isLoading = false;
                // API returns { success: true, data: { borrowRequests: [...] } }
                const requests = action.payload.data?.borrowRequests || action.payload.data || [];
                state.borrowRequests = Array.isArray(requests) ? requests : [];
                state.pagination = action.payload.data?.pagination || null;
            })
            .addCase(fetchAllBorrowRequests.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Approve Request
            .addCase(approveBorrowRequest.fulfilled, (state, action) => {
                const index = state.borrowRequests.findIndex(r => r.id === action.payload.data.id);
                if (index !== -1) {
                    state.borrowRequests[index] = action.payload.data;
                }
            })
            // Reject Request
            .addCase(rejectBorrowRequest.fulfilled, (state, action) => {
                const index = state.borrowRequests.findIndex(r => r.id === action.payload.data.id);
                if (index !== -1) {
                    state.borrowRequests[index] = action.payload.data;
                }
            })
            // Cancel Request
            .addCase(cancelBorrowRequest.fulfilled, (state, action) => {
                state.borrowRequests = state.borrowRequests.filter(r => r.id !== action.payload);
            });
    },
});

export const { clearError, resetRequests } = borrowRequestsSlice.actions;
export default borrowRequestsSlice.reducer;
