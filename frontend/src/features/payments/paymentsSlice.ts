import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { Payment, Pagination } from '@/types';

export interface PaymentsState {
    payments: Payment[];
    currentPayment: Payment | null;
    isLoading: boolean;
    error: string | null;
    pagination: Pagination | null;
}

const initialState: PaymentsState = {
    payments: [],
    currentPayment: null,
    isLoading: false,
    error: null,
    pagination: null,
};

// Record offline payment (LIBRARIAN/ADMIN)
export const recordPayment = createAsyncThunk(
    'payments/record',
    async (data: {
        transactionId?: string;
        deliveryRequestId?: string;
        amount: number;
        paymentMethod: string;
        lateFee?: number;
        damageCharge?: number;
        securityDeposit?: number;
        notes?: string;
    }, { rejectWithValue }) => {
        try {
            const response = await api.post('/payments/record', data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to record payment');
        }
    }
);

// Fetch user payments
export const fetchUserPayments = createAsyncThunk(
    'payments/fetchUserPayments',
    async (userId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/payments/user/${userId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
        }
    }
);

// Fetch all payments (LIBRARIAN/ADMIN)
export const fetchAllPayments = createAsyncThunk(
    'payments/fetchAll',
    async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());

            const response = await api.get(`/payments?${queryParams.toString()}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch payments');
        }
    }
);

// Get payment details
export const fetchPaymentDetails = createAsyncThunk(
    'payments/fetchDetails',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/payments/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment details');
        }
    }
);

const paymentsSlice = createSlice({
    name: 'payments',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetPayments: (state) => {
            state.payments = [];
            state.pagination = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Record Payment
            .addCase(recordPayment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(recordPayment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.payments.unshift(action.payload.data);
            })
            .addCase(recordPayment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch User Payments
            .addCase(fetchUserPayments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchUserPayments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.payments = action.payload.data || [];
            })
            .addCase(fetchUserPayments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch All Payments
            .addCase(fetchAllPayments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchAllPayments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.payments = action.payload.data || [];
                state.pagination = action.payload.meta || null;
            })
            .addCase(fetchAllPayments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Fetch Payment Details
            .addCase(fetchPaymentDetails.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentPayment = action.payload.data;
            })
            .addCase(fetchPaymentDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError, resetPayments } = paymentsSlice.actions;
export default paymentsSlice.reducer;
