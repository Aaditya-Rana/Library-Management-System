# Transactions API Documentation

Complete API reference for the Library Management System Transactions Module.

## Base URL
```
/transactions
```

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Issue Book

Issue a book to a user.

**Endpoint:** `POST /transactions/issue`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Request Body
```json
{
  "bookId": "string (required)",
  "userId": "string (required)",
  "dueDate": "string (optional, ISO 8601)",
  "isHomeDelivery": "boolean (optional)",
  "notes": "string (optional)"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Book issued successfully",
  "data": {
    "id": "trans-123",
    "userId": "user-456",
    "bookId": "book-789",
    "bookCopyId": "copy-001",
    "issueDate": "2024-12-24T08:00:00.000Z",
    "dueDate": "2025-01-07T08:00:00.000Z",
    "status": "ISSUED",
    "renewalCount": 0,
    "fineAmount": 0,
    "finePaid": false,
    "isHomeDelivery": false,
    "book": { "title": "...", "author": "..." },
    "user": { "firstName": "...", "lastName": "..." }
  }
}
```

#### Errors
- `404` - User or book not found
- `403` - User not active or has pending fines
- `400` - No copies available

---

### 2. Return Book

Process a book return.

**Endpoint:** `POST /transactions/:id/return`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Request Body
```json
{
  "returnCondition": "object (optional)",
  "damageCharge": "number (optional, min: 0)",
  "notes": "string (optional)"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "id": "trans-123",
    "returnDate": "2024-12-24T10:00:00.000Z",
    "status": "RETURNED",
    "fineAmount": 50,
    "damageCharge": 0,
    "finePaid": false
  }
}
```

#### Errors
- `404` - Transaction not found
- `400` - Book already returned

---

### 3. Renew Transaction

Renew a book borrowing period.

**Endpoint:** `POST /transactions/:id/renew`  
**Auth Required:** Yes (Any authenticated user)

#### Request Body
```json
{
  "newDueDate": "string (optional, ISO 8601)"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Transaction renewed successfully",
  "data": {
    "id": "trans-123",
    "dueDate": "2025-01-21T08:00:00.000Z",
    "renewalCount": 1,
    "status": "RENEWED"
  }
}
```

#### Errors
- `404` - Transaction not found
- `403` - User doesn't own the transaction
- `400` - Renewal limit reached or transaction overdue

---

### 4. Get All Transactions

Retrieve paginated list of transactions with filtering.

**Endpoint:** `GET /transactions`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Query Parameters
```
page=1              (number, default: 1)
limit=10            (number, default: 10)
status=ISSUED       (ISSUED|RETURNED|OVERDUE|RENEWED|LOST)
userId=user-123     (string)
bookId=book-456     (string)
overdue=true        (boolean)
startDate=2024-01-01 (ISO 8601)
endDate=2024-12-31  (ISO 8601)
sortBy=issueDate    (issueDate|dueDate|returnDate|createdAt)
sortOrder=desc      (asc|desc)
```

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": "trans-123",
      "userId": "user-456",
      "bookId": "book-789",
      "status": "ISSUED",
      "issueDate": "2024-12-24T08:00:00.000Z",
      "dueDate": "2025-01-07T08:00:00.000Z",
      "book": { "title": "...", "author": "..." },
      "user": { "firstName": "...", "lastName": "..." }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 5. Get Transaction by ID

Retrieve a specific transaction.

**Endpoint:** `GET /transactions/:id`  
**Auth Required:** Yes (Owner or ADMIN/LIBRARIAN)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "trans-123",
    "userId": "user-456",
    "bookId": "book-789",
    "status": "ISSUED",
    "issueDate": "2024-12-24T08:00:00.000Z",
    "dueDate": "2025-01-07T08:00:00.000Z",
    "book": { /* full book details */ },
    "user": { /* user details */ },
    "bookCopy": { /* copy details */ }
  }
}
```

---

### 6. Get User Transactions

Retrieve all transactions for a specific user.

**Endpoint:** `GET /transactions/user/:userId`  
**Auth Required:** Yes (Owner or ADMIN/LIBRARIAN)

#### Query Parameters
Same as "Get All Transactions"

#### Response (200 OK)
Same structure as "Get All Transactions"

---

### 7. Get Book Transaction History

Retrieve all transactions for a specific book.

**Endpoint:** `GET /transactions/book/:bookId`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Query Parameters
Same as "Get All Transactions"

#### Response (200 OK)
Same structure as "Get All Transactions"

---

### 8. Get Overdue Transactions

Retrieve all overdue transactions.

**Endpoint:** `GET /transactions/overdue`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Response (200 OK)
```json
{
  "count": 5,
  "transactions": [
    {
      "id": "trans-123",
      "userId": "user-456",
      "bookId": "book-789",
      "dueDate": "2024-12-01T08:00:00.000Z",
      "daysOverdue": 23,
      "calculatedFine": 115,
      "book": { "title": "...", "finePerDay": 5 },
      "user": { "firstName": "...", "email": "..." }
    }
  ]
}
```

---

### 9. Calculate Fine

Calculate fine for a transaction.

**Endpoint:** `GET /transactions/:id/calculate-fine`  
**Auth Required:** Yes (Any authenticated user)

#### Response (200 OK)
```json
{
  "transactionId": "trans-123",
  "daysOverdue": 10,
  "finePerDay": 5,
  "fineAmount": 50,
  "finePaid": false
}
```

#### Response (Not Overdue)
```json
{
  "transactionId": "trans-123",
  "fineAmount": 0,
  "daysOverdue": 0,
  "message": "Book is not overdue"
}
```

---

### 10. Pay Fine

Process fine payment for a transaction.

**Endpoint:** `POST /transactions/:id/pay-fine`  
**Auth Required:** Yes (Any authenticated user)

#### Request Body
```json
{
  "amount": 50,
  "paymentMethod": "CASH|CARD|UPI|NET_BANKING|WALLET",
  "transactionId": "string (optional, payment reference)"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Fine paid successfully",
  "transaction": { /* updated transaction */ },
  "amountPaid": 50
}
```

#### Errors
- `400` - Fine already paid or no fine to pay
- `400` - Payment amount less than fine amount

---

### 11. Get Transaction Statistics

Retrieve transaction statistics.

**Endpoint:** `GET /transactions/stats`  
**Auth Required:** Yes (ADMIN, LIBRARIAN)

#### Query Parameters
```
userId=user-123  (optional, filter by user)
```

#### Response (200 OK)
```json
{
  "totalTransactions": 150,
  "activeTransactions": 45,
  "returnedTransactions": 100,
  "overdueTransactions": 5,
  "totalFines": 2500,
  "unpaidFines": 500
}
```

---

### 12. Cancel Transaction

Cancel a transaction (Admin only).

**Endpoint:** `DELETE /transactions/:id`  
**Auth Required:** Yes (ADMIN only)

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Transaction cancelled successfully"
}
```

#### Errors
- `400` - Cannot cancel returned transaction

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Transaction with ID xxx not found"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

---

## Business Rules

### Issue Book
- User must be ACTIVE
- User must not have pending fines
- Book must be active and available
- At least one physical copy must be available

### Return Book
- Automatically calculates overdue fines
- Updates book copy status to AVAILABLE
- Increments available copies count

### Renew Transaction
- Maximum renewals defined per book
- Cannot renew overdue transactions
- User must own the transaction
- Extends due date by loan period

### Fine Calculation
- Fine = days overdue × fine per day
- Automatically updates transaction status to OVERDUE
- Includes damage charges if applicable

### Pay Fine
- Payment amount must be >= fine amount
- Creates payment record
- Marks fine as paid
