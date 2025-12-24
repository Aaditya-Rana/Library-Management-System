export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'LIBRARIAN';
    profileImageUrl?: string;
    phone?: string;
    membershipType?: string;
    status?: string;
    createdAt?: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    publisher?: string;
    category?: string;
    totalCopies: number;
    availableCopies: number;
    description?: string;
    coverImage?: string;
}

export interface Transaction {
    id: string;
    book: {
        title: string;
        author: string;
        isbn?: string;
        coverImage?: string;
    };
    user?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    issueDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'RENEWED';
    fineAmount?: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: Pagination;
}
