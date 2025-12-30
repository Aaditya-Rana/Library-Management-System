import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import booksReducer from '../features/books/booksSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import borrowRequestsReducer from '../features/borrowRequests/borrowRequestsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import settingsReducer from '../features/settings/settingsSlice';
import reportsReducer from '../features/reports/reportsSlice';
import { apiSlice } from '../services/apiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        books: booksReducer,
        transactions: transactionsReducer,
        borrowRequests: borrowRequestsReducer,
        notifications: notificationsReducer,
        settings: settingsReducer,
        reports: reportsReducer,
        [apiSlice.reducerPath]: apiSlice.reducer, // Add RTK Query reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware), // Add RTK Query middleware
});

// Export types first to avoid circular dependency issues
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Inject store into api to avoid circular dependency - do this last
import { injectStore } from '../services/api';
injectStore(store);
