# Library Management System - API Documentation

## 📚 Overview

Base URL: `https://api.yourdomain.com/v1`

**Authentication:** JWT Bearer Token (except public endpoints)

**Content-Type:** `application/json`

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control

| Role | Access Level |
|------|-------------|
| **SUPER_ADMIN** | Full system access |
| **ADMIN** | Library management, user approval |
| **LIBRARIAN** | Day-to-day operations |
| **USER** | Personal account, book browsing |

---

## 📋 API Endpoints Summary

### Authentication (5 endpoints)
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/refresh` - Refresh access token
- POST `/auth/forgot-password` - Request password reset
- POST `/auth/reset-password` - Reset password

### Users (9 endpoints)
- GET `/users` - List all users
- GET `/users/:id` - Get user by ID
- GET `/users/me` - Get current user profile
- PATCH `/users/:id` - Update user
- PATCH `/users/me` - Update own profile
- DELETE `/users/:id` - Delete user
- POST `/users/:id/approve` - Approve user registration
- POST `/users/:id/suspend` - Suspend user
- POST `/users/:id/activate` - Activate user

### Addresses (4 endpoints)
- GET `/users/me/addresses` - Get user addresses
- POST `/users/me/addresses` - Add new address
- PATCH `/addresses/:id` - Update address
- DELETE `/addresses/:id` - Delete address

### Books (15 endpoints)
- GET `/books` - Search/list books
- GET `/books/:id` - Get book details
- POST `/books` - Add new book (counters initialize to 0)
- PATCH `/books/:id` - Update book
- DELETE `/books/:id` - Delete book
- POST `/books/:id/upload-cover` - Upload book cover
- GET `/books/:id/availability` - Check availability
- GET `/books/:id/stats` - Get book statistics
- POST `/books/bulk-import` - Bulk import books
- GET `/books/popular` - Get popular books
- POST `/books/:id/copies` - Add physical book copies
- GET `/books/:id/copies` - List all copies
- GET `/books/:bookId/copies/:copyId` - Get copy details
- PATCH `/books/:bookId/copies/:copyId` - Update copy metadata
- PATCH `/books/:bookId/copies/:copyId/status` - Update copy status
- DELETE `/books/:bookId/copies/:copyId` - Delete copy

### Transactions (8 endpoints)
- GET `/transactions` - List transactions
- GET `/transactions/:id` - Get transaction details
- POST `/transactions/issue` - Issue book (offline)
- POST `/transactions/return` - Return book
- POST `/transactions/:id/renew` - Renew book
- PATCH `/transactions/:id/fine` - Update fine
- GET `/transactions/overdue` - Get overdue transactions
- GET `/transactions/user/:userId` - Get user transactions

### Reservations (5 endpoints)
- GET `/reservations` - List reservations
- POST `/reservations` - Create reservation
- GET `/reservations/:id` - Get reservation details
- PATCH `/reservations/:id/cancel` - Cancel reservation
- GET `/reservations/user/:userId` - Get user reservations

### Deliveries (10 endpoints)
- GET `/deliveries` - List delivery requests
- GET `/deliveries/:id` - Get delivery details
- POST `/deliveries/request` - Create delivery request
- PATCH `/deliveries/:id/approve` - Approve delivery
- PATCH `/deliveries/:id/reject` - Reject delivery
- PATCH `/deliveries/:id/assign` - Assign to personnel
- PATCH `/deliveries/:id/status` - Update delivery status
- POST `/deliveries/:id/pickup` - Schedule pickup
- GET `/deliveries/user/:userId` - Get user deliveries
- GET `/deliveries/personnel/:personnelId` - Get personnel deliveries

### Payments (6 endpoints)
- POST `/payments/create-order` - Create Razorpay order
- POST `/payments/verify` - Verify payment
- GET `/payments/:id` - Get payment details
- GET `/payments/user/:userId` - Get user payments
- POST `/payments/:id/refund` - Process refund
- GET `/payments/transaction/:transactionId` - Get transaction payments

### Reviews (6 endpoints)
- GET `/reviews/book/:bookId` - Get book reviews
- POST `/reviews` - Create review
- PATCH `/reviews/:id` - Update review
- DELETE `/reviews/:id` - Delete review
- PATCH `/reviews/:id/moderate` - Moderate review
- POST `/reviews/:id/helpful` - Mark review as helpful

### Notifications (4 endpoints)
- GET `/notifications` - Get user notifications
- GET `/notifications/:id` - Get notification details
- PATCH `/notifications/:id/read` - Mark as read
- PATCH `/notifications/read-all` - Mark all as read

### Reports (7 endpoints)
- GET `/reports/dashboard` - Dashboard statistics
- GET `/reports/books/popular` - Most borrowed books
- GET `/reports/revenue` - Revenue report
- GET `/reports/overdue` - Overdue books report
- GET `/reports/users/activity` - User activity report
- GET `/reports/deliveries` - Delivery statistics
- POST `/reports/export` - Export report

### Settings (3 endpoints)
- GET `/settings` - Get all settings
- GET `/settings/:key` - Get setting by key
- PATCH `/settings/:key` - Update setting

### Delivery Personnel (5 endpoints)
- GET `/personnel` - List delivery personnel
- GET `/personnel/:id` - Get personnel details
- POST `/personnel` - Add personnel
- PATCH `/personnel/:id` - Update personnel
- DELETE `/personnel/:id` - Delete personnel

---

## 🔐 1. Authentication APIs

### 1.1 User Registration

**Endpoint:** `POST /auth/register`

**Access:** Public

**Use Case:** New user creates an account. Status will be `PENDING_APPROVAL` until admin approves.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "dateOfBirth": "1995-05-15",
  "membershipType": "FREE"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Awaiting admin approval.",
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "status": "PENDING_APPROVAL",
      "membershipType": "FREE",
      "createdAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Email already exists
{
  "success": false,
  "message": "Email already registered",
  "error": "BAD_REQUEST"
}

// 400 Bad Request - Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

### 1.2 User Login

**Endpoint:** `POST /auth/login`

**Access:** Public

**Use Case:** User logs in to access their account.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "status": "ACTIVE",
      "membershipType": "PREMIUM",
      "profileImageUrl": "https://res.cloudinary.com/..."
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 604800
    }
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid credentials
{
  "success": false,
  "message": "Invalid email or password",
  "error": "UNAUTHORIZED"
}

// 403 Forbidden - Account not approved
{
  "success": false,
  "message": "Your account is pending approval",
  "error": "FORBIDDEN"
}

// 403 Forbidden - Account suspended
{
  "success": false,
  "message": "Your account has been suspended",
  "error": "FORBIDDEN"
}
```

---

### 1.3 Refresh Token

**Endpoint:** `POST /auth/refresh`

**Access:** Public (requires refresh token)

**Use Case:** Get new access token when current one expires.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

---

### 1.4 Forgot Password

**Endpoint:** `POST /auth/forgot-password`

**Access:** Public

**Use Case:** User requests password reset link.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

---

### 1.5 Reset Password

**Endpoint:** `POST /auth/reset-password`

**Access:** Public (requires reset token from email)

**Use Case:** User resets password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## 👥 2. Users APIs

### 2.1 List Users

**Endpoint:** `GET /users`

**Access:** ADMIN, LIBRARIAN

**Use Case:** Admin/Librarian views all users with filtering and pagination.

**Query Parameters:**
```
?page=1
&limit=20
&role=USER
&status=ACTIVE
&membershipType=PREMIUM
&search=john
&sortBy=createdAt
&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-123",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210",
        "role": "USER",
        "status": "ACTIVE",
        "membershipType": "PREMIUM",
        "membershipExpiry": "2026-12-21T00:00:00Z",
        "profileImageUrl": "https://res.cloudinary.com/...",
        "createdAt": "2025-01-15T10:00:00Z",
        "lastLoginAt": "2025-12-21T15:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 2.2 Get User by ID

**Endpoint:** `GET /users/:id`

**Access:** ADMIN, LIBRARIAN, USER (own profile only)

**Use Case:** View detailed user information.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "dateOfBirth": "1995-05-15",
      "role": "USER",
      "status": "ACTIVE",
      "membershipType": "PREMIUM",
      "membershipExpiry": "2026-12-21T00:00:00Z",
      "profileImageUrl": "https://res.cloudinary.com/...",
      "emailVerified": true,
      "twoFactorEnabled": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-12-20T14:20:00Z",
      "lastLoginAt": "2025-12-21T15:30:00Z",
      "stats": {
        "totalBorrowed": 45,
        "currentlyBorrowed": 2,
        "overdueBooks": 0,
        "totalFinesPaid": 150.00
      }
    }
  }
}
```

---

### 2.3 Get Current User Profile

**Endpoint:** `GET /users/me`

**Access:** Authenticated users

**Use Case:** User views their own profile.

**Response:** Same as 2.2

---

### 2.4 Update User

**Endpoint:** `PATCH /users/:id`

**Access:** ADMIN (any user), USER (own profile only)

**Use Case:** Admin updates user details or user updates own profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+919876543210",
  "dateOfBirth": "1995-05-15",
  "membershipType": "PREMIUM"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "uuid-123",
      "firstName": "John",
      "lastName": "Smith",
      "updatedAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

---

### 2.5 Approve User

**Endpoint:** `POST /users/:id/approve`

**Access:** ADMIN

**Use Case:** Admin approves pending user registration.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "user": {
      "id": "uuid-123",
      "status": "ACTIVE"
    }
  }
}
```

---

### 2.6 Suspend User

**Endpoint:** `POST /users/:id/suspend`

**Access:** ADMIN

**Use Case:** Admin suspends user account due to violations.

**Request Body:**
```json
{
  "reason": "Multiple overdue books and unpaid fines"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

---

## 📚 3. Books APIs

### 3.1 Search/List Books

**Endpoint:** `GET /books`

**Access:** Public (authenticated for full details)

**Use Case:** Users browse and search for books.

**Query Parameters:**
```
?page=1
&limit=20
&search=gatsby
&author=fitzgerald
&genre=fiction
&category=classic
&language=English
&availability=AVAILABLE
&sortBy=title
&sortOrder=asc
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "books": [
      {
        "id": "book-uuid-1",
        "isbn": "978-0-7432-7356-5",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "publisher": "Scribner",
        "edition": "Revised Edition",
        "publicationYear": 2004,
        "language": "English",
        "genre": "Fiction",
        "category": "Classic Literature",
        "pages": 180,
        "format": "Paperback",
        "description": "A novel set in the Jazz Age...",
        "coverImageUrl": "https://res.cloudinary.com/...",
        "totalCopies": 5,
        "availableCopies": 3,
        "bookValue": 500.00,
        "securityDeposit": 200.00,
        "loanPeriodDays": 14,
        "finePerDay": 5.00,
        "isDeliveryEligible": true,
        "averageRating": 4.5,
        "totalReviews": 120,
        "createdAt": "2025-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5000,
      "totalPages": 250
    },
    "filters": {
      "genres": ["Fiction", "Non-Fiction", "Science", "History"],
      "categories": ["Classic Literature", "Modern Fiction", "Biography"],
      "languages": ["English", "Hindi", "Spanish"]
    }
  }
}
```

---

### 3.2 Get Book Details

**Endpoint:** `GET /books/:id`

**Access:** Public

**Use Case:** View detailed information about a specific book.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "book": {
      "id": "book-uuid-1",
      "isbn": "978-0-7432-7356-5",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "publisher": "Scribner",
      "edition": "Revised Edition",
      "publicationYear": 2004,
      "language": "English",
      "genre": "Fiction",
      "category": "Classic Literature",
      "subCategory": "American Literature",
      "pages": 180,
      "format": "Paperback",
      "description": "A novel set in the Jazz Age that explores themes of decadence, idealism, resistance to change, social upheaval, and excess.",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "totalCopies": 5,
      "availableCopies": 3,
      "bookValue": 500.00,
      "securityDeposit": 200.00,
      "loanPeriodDays": 14,
      "finePerDay": 5.00,
      "maxRenewals": 2,
      "isDeliveryEligible": true,
      "isActive": true,
      "averageRating": 4.5,
      "totalReviews": 120,
      "stats": {
        "totalBorrowed": 450,
        "currentlyIssued": 2,
        "reservationQueue": 1
      },
      "copies": [
        {
          "id": "copy-uuid-1",
          "copyNumber": "001",
          "barcode": "LIB-GG-001",
          "status": "AVAILABLE",
          "condition": "GOOD",
          "shelfLocation": "A-12-3",
          "section": "Fiction"
        }
      ],
      "createdAt": "2025-01-10T10:00:00Z",
      "updatedAt": "2025-12-20T15:00:00Z"
    }
  }
}
```

---

### 3.3 Add New Book

**Endpoint:** `POST /books`

**Access:** ADMIN

**Use Case:** Admin adds a new book to the library catalog.

**Request Body:**
```json
{
  "isbn": "978-0-7432-7356-5",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "edition": "Revised Edition",
  "publicationYear": 2004,
  "language": "English",
  "genre": "Fiction",
  "category": "Classic Literature",
  "subCategory": "American Literature",
  "pages": 180,
  "format": "Paperback",
  "description": "A novel set in the Jazz Age...",
  "totalCopies": 5,
  "bookValue": 500.00,
  "securityDeposit": 200.00,
  "loanPeriodDays": 14,
  "finePerDay": 5.00,
  "maxRenewals": 2,
  "isDeliveryEligible": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Book added successfully",
  "data": {
    "book": {
      "id": "book-uuid-1",
      "isbn": "978-0-7432-7356-5",
      "title": "The Great Gatsby",
      "createdAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

---

### 3.4 Upload Book Cover

**Endpoint:** `POST /books/:id/upload-cover`

**Access:** ADMIN

**Use Case:** Admin uploads book cover image to Cloudinary.

**Request:** `multipart/form-data`
```
file: <image file>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Cover image uploaded successfully",
  "data": {
    "coverImageUrl": "https://res.cloudinary.com/library/image/upload/v1234567890/books/book-uuid-1.jpg"
  }
}
```

---

### 3.5 Check Book Availability

**Endpoint:** `GET /books/:id/availability`

**Access:** Public

**Use Case:** Check if book is available for borrowing or delivery.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "bookId": "book-uuid-1",
    "title": "The Great Gatsby",
    "totalCopies": 5,
    "availableCopies": 3,
    "issuedCopies": 2,
    "isAvailable": true,
    "isDeliveryAvailable": true,
    "estimatedAvailability": null,
    "reservationQueue": 0,
    "nextAvailableDate": null
  }
}
```

---

## 📖 4. Transactions APIs (Offline Borrowing)

### 4.1 Issue Book (Offline)

**Endpoint:** `POST /transactions/issue`

**Access:** LIBRARIAN

**Use Case:** Librarian issues a book to a user at the library counter.

**Request Body:**
```json
{
  "userId": "user-uuid-123",
  "bookId": "book-uuid-1",
  "bookCopyId": "copy-uuid-1",
  "dueDate": "2026-01-04T23:59:59Z",
  "notes": "User requested extended loan period"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Book issued successfully",
  "data": {
    "transaction": {
      "id": "txn-uuid-1",
      "userId": "user-uuid-123",
      "userName": "John Doe",
      "bookId": "book-uuid-1",
      "bookTitle": "The Great Gatsby",
      "bookCopyId": "copy-uuid-1",
      "copyNumber": "001",
      "barcode": "LIB-GG-001",
      "librarianId": "librarian-uuid-1",
      "issueDate": "2025-12-21T18:00:00Z",
      "dueDate": "2026-01-04T23:59:59Z",
      "status": "ISSUED",
      "renewalCount": 0,
      "fineAmount": 0,
      "isHomeDelivery": false,
      "createdAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - User has overdue books
{
  "success": false,
  "message": "User has overdue books. Cannot issue new book.",
  "error": "BAD_REQUEST"
}

// 400 Bad Request - User reached borrowing limit
{
  "success": false,
  "message": "User has reached maximum borrowing limit (3 books)",
  "error": "BAD_REQUEST"
}

// 400 Bad Request - Book not available
{
  "success": false,
  "message": "Book copy is not available",
  "error": "BAD_REQUEST"
}
```

---

### 4.2 Return Book

**Endpoint:** `POST /transactions/return`

**Access:** LIBRARIAN

**Use Case:** Librarian processes book return at the library counter.

**Request Body:**
```json
{
  "transactionId": "txn-uuid-1",
  "returnCondition": "GOOD",
  "damageNotes": null,
  "damageCharge": 0
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "transaction": {
      "id": "txn-uuid-1",
      "status": "RETURNED",
      "returnDate": "2025-12-30T14:30:00Z",
      "dueDate": "2026-01-04T23:59:59Z",
      "daysOverdue": 0,
      "fineAmount": 0,
      "damageCharge": 0,
      "totalCharge": 0
    },
    "refund": null
  }
}
```

**With Late Fee:**
```json
{
  "success": true,
  "message": "Book returned. Late fee applicable.",
  "data": {
    "transaction": {
      "id": "txn-uuid-1",
      "status": "RETURNED",
      "returnDate": "2026-01-10T14:30:00Z",
      "dueDate": "2026-01-04T23:59:59Z",
      "daysOverdue": 6,
      "fineAmount": 30.00,
      "damageCharge": 0,
      "totalCharge": 30.00
    }
  }
}
```

---

### 4.3 Renew Book

**Endpoint:** `POST /transactions/:id/renew`

**Access:** USER, LIBRARIAN

**Use Case:** User or librarian renews a borrowed book.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Book renewed successfully",
  "data": {
    "transaction": {
      "id": "txn-uuid-1",
      "renewalCount": 1,
      "oldDueDate": "2026-01-04T23:59:59Z",
      "newDueDate": "2026-01-18T23:59:59Z"
    }
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Max renewals reached
{
  "success": false,
  "message": "Maximum renewal limit (2) reached",
  "error": "BAD_REQUEST"
}

// 400 Bad Request - Book reserved by another user
{
  "success": false,
  "message": "Cannot renew. Book is reserved by another user.",
  "error": "BAD_REQUEST"
}
```

---

### 4.4 Get Overdue Transactions

**Endpoint:** `GET /transactions/overdue`

**Access:** LIBRARIAN, ADMIN

**Use Case:** Librarian views all overdue books.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-uuid-1",
        "user": {
          "id": "user-uuid-123",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+919876543210"
        },
        "book": {
          "id": "book-uuid-1",
          "title": "The Great Gatsby",
          "isbn": "978-0-7432-7356-5"
        },
        "issueDate": "2025-11-20T10:00:00Z",
        "dueDate": "2025-12-04T23:59:59Z",
        "daysOverdue": 17,
        "fineAmount": 85.00,
        "status": "OVERDUE"
      }
    ],
    "summary": {
      "totalOverdue": 25,
      "totalFineAmount": 1250.00
    }
  }
}
```

---

## 🚚 5. Deliveries APIs (Online Borrowing)

### 5.1 Create Delivery Request

**Endpoint:** `POST /deliveries/request`

**Access:** USER

**Use Case:** User requests home delivery of a book.

**Request Body:**
```json
{
  "bookId": "book-uuid-1",
  "addressId": "address-uuid-1",
  "preferredDate": "2025-12-23",
  "preferredSlot": "morning",
  "specialInstructions": "Please call before arriving"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Delivery request created. Please complete payment.",
  "data": {
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "userId": "user-uuid-123",
      "bookId": "book-uuid-1",
      "bookTitle": "The Great Gatsby",
      "addressId": "address-uuid-1",
      "address": {
        "addressLine1": "123 Main Street",
        "city": "Mumbai",
        "pincode": "400001"
      },
      "preferredDate": "2025-12-23",
      "preferredSlot": "morning",
      "status": "PENDING",
      "deliveryFee": 50.00,
      "securityDeposit": 200.00,
      "totalAmount": 250.00,
      "createdAt": "2025-12-21T18:00:00Z"
    },
    "payment": {
      "orderId": "order_razorpay_123",
      "amount": 250.00,
      "currency": "INR"
    }
  }
}
```

---

### 5.2 Approve Delivery Request

**Endpoint:** `PATCH /deliveries/:id/approve`

**Access:** LIBRARIAN

**Use Case:** Librarian approves delivery request after payment verification.

**Request Body:**
```json
{
  "scheduledDate": "2025-12-23",
  "scheduledSlot": "morning",
  "notes": "Book prepared and ready for delivery"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Delivery request approved",
  "data": {
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "status": "APPROVED",
      "scheduledDate": "2025-12-23",
      "scheduledSlot": "morning"
    }
  }
}
```

---

### 5.3 Assign Delivery Personnel

**Endpoint:** `PATCH /deliveries/:id/assign`

**Access:** LIBRARIAN

**Use Case:** Librarian assigns delivery to a delivery person.

**Request Body:**
```json
{
  "personnelId": "personnel-uuid-1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Delivery assigned successfully",
  "data": {
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "status": "ASSIGNED",
      "assignedTo": {
        "id": "personnel-uuid-1",
        "name": "Ramesh Kumar",
        "phone": "+919876543210"
      },
      "assignedAt": "2025-12-22T10:00:00Z"
    }
  }
}
```

---

### 5.4 Update Delivery Status

**Endpoint:** `PATCH /deliveries/:id/status`

**Access:** LIBRARIAN, DELIVERY_PERSONNEL

**Use Case:** Update delivery status as it progresses.

**Request Body:**
```json
{
  "status": "DELIVERED",
  "deliveryProofUrl": "https://res.cloudinary.com/...",
  "deliverySignatureUrl": "https://res.cloudinary.com/...",
  "deliveryNotes": "Delivered successfully to user",
  "conditionOnDelivery": {
    "photos": [
      "https://res.cloudinary.com/photo1.jpg",
      "https://res.cloudinary.com/photo2.jpg"
    ],
    "notes": "Book in excellent condition"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Delivery status updated",
  "data": {
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "status": "DELIVERED",
      "deliveredAt": "2025-12-23T11:30:00Z"
    }
  }
}
```

---

### 5.5 Schedule Return Pickup

**Endpoint:** `POST /deliveries/:id/pickup`

**Access:** USER

**Use Case:** User schedules pickup for book return.

**Request Body:**
```json
{
  "pickupDate": "2026-01-03",
  "pickupSlot": "afternoon"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Pickup scheduled successfully",
  "data": {
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "status": "PICKUP_SCHEDULED",
      "pickupDate": "2026-01-03",
      "pickupSlot": "afternoon"
    }
  }
}
```

---

## 💳 6. Payments APIs

### 6.1 Create Razorpay Order

**Endpoint:** `POST /payments/create-order`

**Access:** USER

**Use Case:** Create Razorpay order for delivery payment.

**Request Body:**
```json
{
  "deliveryRequestId": "delivery-uuid-1",
  "amount": 250.00
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order_razorpay_123",
      "amount": 25000,
      "currency": "INR",
      "receipt": "receipt_delivery_uuid_1"
    },
    "payment": {
      "id": "payment-uuid-1",
      "deliveryRequestId": "delivery-uuid-1",
      "amount": 250.00,
      "paymentStatus": "PENDING"
    },
    "razorpayKey": "rzp_test_xxxxx"
  }
}
```

---

### 6.2 Verify Payment

**Endpoint:** `POST /payments/verify`

**Access:** USER

**Use Case:** Verify Razorpay payment after user completes payment.

**Request Body:**
```json
{
  "paymentId": "payment-uuid-1",
  "razorpayOrderId": "order_razorpay_123",
  "razorpayPaymentId": "pay_razorpay_456",
  "razorpaySignature": "signature_hash_789"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "payment": {
      "id": "payment-uuid-1",
      "paymentStatus": "COMPLETED",
      "paymentDate": "2025-12-21T18:30:00Z"
    },
    "deliveryRequest": {
      "id": "delivery-uuid-1",
      "status": "PAYMENT_CONFIRMED"
    }
  }
}
```

---

### 6.3 Process Refund

**Endpoint:** `POST /payments/:id/refund`

**Access:** LIBRARIAN

**Use Case:** Process security deposit refund after book return.

**Request Body:**
```json
{
  "refundAmount": 200.00,
  "reason": "Book returned in good condition"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "payment": {
      "id": "payment-uuid-1",
      "paymentStatus": "PARTIALLY_REFUNDED",
      "refundAmount": 200.00,
      "refundDate": "2026-01-04T15:00:00Z"
    },
    "refundDetails": {
      "razorpayRefundId": "rfnd_razorpay_123",
      "status": "processed"
    }
  }
}
```

---

## ⭐ 7. Reviews APIs

### 7.1 Get Book Reviews

**Endpoint:** `GET /reviews/book/:bookId`

**Access:** Public

**Use Case:** View all reviews for a specific book.

**Query Parameters:**
```
?page=1
&limit=10
&sortBy=createdAt
&sortOrder=desc
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "review-uuid-1",
        "user": {
          "id": "user-uuid-123",
          "firstName": "John",
          "lastName": "D.",
          "profileImageUrl": "https://res.cloudinary.com/..."
        },
        "rating": 5,
        "reviewText": "Absolutely loved this book! A masterpiece of American literature.",
        "helpfulCount": 24,
        "status": "approved",
        "createdAt": "2025-12-15T10:00:00Z"
      }
    ],
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 120,
      "ratingDistribution": {
        "5": 80,
        "4": 25,
        "3": 10,
        "2": 3,
        "1": 2
      }
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "totalPages": 12
    }
  }
}
```

---

### 7.2 Create Review

**Endpoint:** `POST /reviews`

**Access:** USER (must have borrowed the book)

**Use Case:** User writes a review for a book they've read.

**Request Body:**
```json
{
  "bookId": "book-uuid-1",
  "rating": 5,
  "reviewText": "Absolutely loved this book! A masterpiece of American literature."
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Review submitted successfully. Awaiting moderation.",
  "data": {
    "review": {
      "id": "review-uuid-1",
      "bookId": "book-uuid-1",
      "userId": "user-uuid-123",
      "rating": 5,
      "reviewText": "Absolutely loved this book!...",
      "status": "pending",
      "createdAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

---

## 📊 8. Reports APIs

### 8.1 Dashboard Statistics

**Endpoint:** `GET /reports/dashboard`

**Access:** ADMIN, SUPER_ADMIN

**Use Case:** View overall library statistics on admin dashboard.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1500,
      "activeUsers": 1200,
      "totalBooks": 5000,
      "totalCopies": 8000,
      "availableCopies": 6500
    },
    "transactions": {
      "totalIssued": 450,
      "totalReturned": 380,
      "currentlyBorrowed": 70,
      "overdueBooks": 12
    },
    "deliveries": {
      "pendingRequests": 15,
      "outForDelivery": 8,
      "deliveredToday": 23,
      "pickupsScheduled": 18
    },
    "revenue": {
      "today": 2500.00,
      "thisWeek": 15000.00,
      "thisMonth": 50000.00,
      "finesCollected": 5000.00,
      "deliveryFees": 25000.00,
      "memberships": 20000.00
    },
    "popularBooks": [
      {
        "bookId": "book-uuid-1",
        "title": "The Great Gatsby",
        "borrowCount": 45
      }
    ]
  }
}
```

---

### 8.2 Revenue Report

**Endpoint:** `GET /reports/revenue`

**Access:** ADMIN, SUPER_ADMIN

**Use Case:** Generate detailed revenue report.

**Query Parameters:**
```
?startDate=2025-12-01
&endDate=2025-12-31
&groupBy=day
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 150000.00,
      "deliveryFees": 75000.00,
      "lateFees": 25000.00,
      "damageCharges": 10000.00,
      "memberships": 40000.00
    },
    "breakdown": [
      {
        "date": "2025-12-01",
        "deliveryFees": 2500.00,
        "lateFees": 850.00,
        "memberships": 1500.00,
        "total": 4850.00
      }
    ]
  }
}
```

---

## ⚙️ 9. Settings APIs

### 9.1 Get All Settings

**Endpoint:** `GET /settings`

**Access:** ADMIN, SUPER_ADMIN

**Use Case:** View all system configuration settings.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "settings": {
      "fineRates": {
        "standardBooks": 5.00,
        "premiumBooks": 10.00,
        "referenceBooks": 20.00,
        "maxFineCap": 500.00
      },
      "deliveryCharges": {
        "flatRate": 50.00,
        "returnPickup": 50.00,
        "roundTripBundle": 80.00
      },
      "securityDeposits": {
        "standardBooks": 200.00,
        "premiumBooks": 500.00,
        "referenceBooks": 1000.00
      },
      "loanPeriods": {
        "standardBooks": 14,
        "premiumBooks": 14,
        "referenceBooks": 7,
        "maxRenewals": 2
      }
    }
  }
}
```

---

### 9.2 Update Setting

**Endpoint:** `PATCH /settings/:key`

**Access:** SUPER_ADMIN

**Use Case:** Super admin updates system configuration.

**Request Body:**
```json
{
  "value": "7.00"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Setting updated successfully",
  "data": {
    "setting": {
      "key": "fineRates.standardBooks",
      "value": "7.00",
      "updatedBy": "super-admin-uuid",
      "updatedAt": "2025-12-21T18:00:00Z"
    }
  }
}
```

---

## 📝 Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": { ... }
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🔒 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `VALIDATION_ERROR` | 400 | Input validation failed |

---

## 📌 Rate Limiting

- **Authenticated users:** 1000 requests per hour
- **Public endpoints:** 100 requests per hour
- **Admin users:** 5000 requests per hour

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640098800
```

---

**Total Endpoints:** 87  
**API Version:** v1  
**Last Updated:** 2025-12-21
