import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import booksReducer from '../features/books/booksSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        transactions: transactionsReducer,
        books: booksReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
});

// Inject store into api to avoid circular dependency
import { injectStore } from '../services/api';
injectStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
