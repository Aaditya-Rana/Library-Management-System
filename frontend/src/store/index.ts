import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import booksReducer from '../features/books/booksSlice';
import borrowRequestsReducer from '../features/borrowRequests/borrowRequestsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import reportsReducer from '../features/reports/reportsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        transactions: transactionsReducer,
        books: booksReducer,
        borrowRequests: borrowRequestsReducer,
        notifications: notificationsReducer,
        payments: paymentsReducer,
        settings: settingsReducer,
        reports: reportsReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
});

// Inject store into api to avoid circular dependency
import { injectStore } from '../services/api';
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
