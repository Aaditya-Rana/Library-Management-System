import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { Book, Pagination } from '@/types';

export interface BooksState {
    books: Book[];
    currentBook: Book | null;
    isLoading: boolean;
    error: string | null;
    pagination: Pagination | null;
}

const initialState: BooksState = {
    books: [],
    currentBook: null,
    isLoading: false,
    error: null,
    pagination: null,
};

export const fetchBooks = createAsyncThunk(
    'books/fetchAll',
    async (params: {
        page?: number;
        limit?: number;
        search?: string;
        genre?: string;
        availability?: string;
    } = {}, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.search) queryParams.append('search', params.search);
            if (params.genre) queryParams.append('genre', params.genre);
            if (params.availability) queryParams.append('availability', params.availability);

            const response = await api.get(`/books?${queryParams.toString()}`);
            return response.data; // Expect { data: [], meta: {} }
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch books');
        }
    }
);

export const getBook = createAsyncThunk(
    'books/getOne',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/books/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch book details');
        }
    }
);

export const deleteBook = createAsyncThunk(
    'books/delete',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/books/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete book');
        }
    }
);

const booksSlice = createSlice({
    name: 'books',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        searchResults: (state, action) => {
            // Optional helper to manually set books if needed
            state.books = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Books
            .addCase(fetchBooks.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBooks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.books = action.payload.data || [];
                state.pagination = action.payload.meta || null;
            })
            .addCase(fetchBooks.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Get Book
            .addCase(getBook.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getBook.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentBook = action.payload.data;
            })
            .addCase(getBook.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Delete Book
            .addCase(deleteBook.fulfilled, (state, action) => {
                state.books = state.books.filter((b) => b.id !== action.payload);
            });
    },
});

export const { clearError, searchResults } = booksSlice.actions;
export default booksSlice.reducer;
