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
    finePaid?: boolean;
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

export interface BorrowRequest {
    id: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    book: {
        id: string;
        title: string;
        author: string;
        isbn?: string;
        coverImage?: string;
    };
    requestDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
    notes?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    dueDate?: string;
    transactionId?: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'EMAIL' | 'SMS' | 'IN_APP';
    category: 'BOOK_ISSUED' | 'BOOK_RETURNED' | 'DUE_REMINDER' | 'OVERDUE_NOTICE' |
    'RESERVATION_AVAILABLE' | 'DELIVERY_UPDATE' | 'PAYMENT_CONFIRMATION' |
    'FINE_NOTICE' | 'BORROW_REQUEST_CREATED' | 'BORROW_REQUEST_APPROVED' |
    'BORROW_REQUEST_REJECTED';
    title: string;
    message: string;
    read: boolean;
    sentAt?: string;
    createdAt: string;
}

export interface Payment {
    id: string;
    userId: string;
    transactionId?: string;
    deliveryRequestId?: string;
    amount: number;
    paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET';
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    deliveryFee?: number;
    securityDeposit?: number;
    lateFee?: number;
    damageCharge?: number;
    refundAmount?: number;
    refundDate?: string;
    refundReason?: string;
    paymentDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    transaction?: {
        id: string;
        issueDate: string;
        dueDate: string;
        returnDate?: string;
        book: {
            title: string;
            author: string;
        };
    };
}

export interface Setting {
    id: string;
    key: string;
    value: string | number | boolean;
    category: 'LIBRARY' | 'FINES' | 'MEMBERSHIP' | 'LOANS' | 'SYSTEM';
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
    description?: string;
    isEditable: boolean;
    defaultValue: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryRequest {
    id: string;
    userId: string;
    bookId: string;
    addressId: string;
    requestType: string;
    preferredDate: string;
    preferredSlot: string;
    scheduledDate?: string;
    scheduledSlot?: string;
    status: 'PENDING' | 'PAYMENT_CONFIRMED' | 'APPROVED' | 'READY_FOR_DELIVERY' |
    'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'PICKUP_SCHEDULED' |
    'PICKUP_IN_PROGRESS' | 'RETURNED' | 'FAILED' | 'CANCELLED';
    deliveredAt?: string;
    deliveryProofUrl?: string;
    deliveryFee: number;
    securityDeposit: number;
    specialInstructions?: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        firstName: string;
        lastName: string;
    };
    book?: {
        title: string;
        author: string;
    };
}

export interface DashboardStats {
    overview: {
        totalBooks: number;
        availableBooks: number;
        totalUsers: number;
        activeTransactions: number;
        overdueTransactions: number;
    };
    financial: {
        totalRevenue: number;
        pendingFines: number;
        collectedFines: number;
    };
    today: {
        newUsers: number;
        newTransactions: number;
        returned: number;
    };
}

export interface PopularBook {
    bookId: string;
    title: string;
    author: string;
    borrowCount: number;
    coverImage?: string;
}

export interface RevenueData {
    date: string;
    amount: number;
}
