# Books API Documentation

## Overview

The Books API provides comprehensive book management functionality including CRUD operations, search, filtering, inventory management, and cover image uploads via Cloudinary.

**Base URL:** `/books`

**Authentication:** All endpoints require JWT authentication via Bearer token

---

## Endpoints

### 1. Create Book

Create a new book in the system.

**Endpoint:** `POST /books`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "isbn": "9781234567890",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "publicationYear": 1925,
  "category": "Fiction",
  "genre": "Classic Literature",
  "language": "English",
  "price": 299.99,
  "bookValue": 500.00,
  "description": "A novel set in the Jazz Age..."
}
```

> **Note:** `totalCopies` and `availableCopies` are automatically initialized to 0. Use the `POST /books/:id/copies` endpoint to add physical book copies after creation.

**Optional File Upload:**
- Field name: `coverImage`
- Accepted formats: JPEG, PNG, WebP
- Max size: 5MB

**Response (201):**
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j1",
    "isbn": "9781234567890",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publisher": "Scribner",
    "publicationYear": 1925,
    "category": "Fiction",
    "genre": "Classic Literature",
    "language": "English",
    "totalCopies": 0,
    "availableCopies": 0,
    "price": 299.99,
    "bookValue": 500.00,
    "description": "A novel set in the Jazz Age...",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isbn": "9781234567890",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "category": "Fiction",
    "genre": "Classic Literature",
    "bookValue": 500
  }'
```

---

### 2. List Books

Get paginated list of books with optional filtering and search.

**Endpoint:** `GET /books`

**Authorization:** All authenticated users

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | number | Page number | 1 |
| limit | number | Items per page | 10 |
| category | string | Filter by category | - |
| genre | string | Filter by genre | - |
| language | string | Filter by language | - |
| status | string | Filter by status (ACTIVE/INACTIVE) | - |
| availability | string | Filter by availability (available/unavailable) | - |
| search | string | Search in title, author, ISBN | - |
| sortBy | string | Sort field (title, author, price, etc.) | createdAt |
| sortOrder | string | Sort order (asc/desc) | desc |
| minPrice | number | Minimum price filter | - |
| maxPrice | number | Maximum price filter | - |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "isbn": "9781234567890",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "category": "Fiction",
      "genre": "Classic Literature",
      "price": 299.99,
      "availableCopies": 3,
      "totalCopies": 5,
      ...
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

**cURL Examples:**
```bash
# Basic list
curl http://localhost:3000/books \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by title
curl "http://localhost:3000/books?search=Gatsby" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by category and sort
curl "http://localhost:3000/books?category=Fiction&sortBy=title&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Price range filter
curl "http://localhost:3000/books?minPrice=100&maxPrice=500" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Available books only
curl "http://localhost:3000/books?availability=available" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Book by ID

Retrieve detailed information about a specific book.

**Endpoint:** `GET /books/:id`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isbn": "9781234567890",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publisher": "Scribner",
    "publicationYear": 1925,
    "category": "Fiction",
    "genre": "Classic Literature",
    "language": "English",
    "totalCopies": 5,
    "availableCopies": 3,
    "price": 299.99,
    "bookValue": 500.00,
    "description": "A novel set in the Jazz Age...",
    "coverImageUrl": "https://cloudinary.com/...",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get Book by ISBN

Find a book using its ISBN number.

**Endpoint:** `GET /books/isbn/:isbn`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isbn": "9781234567890",
    "title": "The Great Gatsby",
    ...
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/books/isbn/9781234567890 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Update Book

Update book information.

**Endpoint:** `PATCH /books/:id`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Title",
  "price": 349.99,
  "description": "Updated description..."
}
```

**Optional File Upload:**
- Field name: `coverImage`
- Updates cover image

**Response (200):**
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated Title",
    ...
  }
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title", "price": 349.99}'
```

---

### 6. Delete Book

Soft delete a book (sets isActive to false).

**Endpoint:** `DELETE /books/:id`

**Authorization:** ADMIN only

**Response (200):**
```json
{
  "success": true,
  "message": "Book deleted successfully",
  "data": {
    "id": "uuid",
    "isActive": false,
    ...
  }
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/books/BOOK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. Upload Cover Image

Upload or update book cover image.

**Endpoint:** `POST /books/:id/cover`

**Authorization:** ADMIN, LIBRARIAN

**Request:** Multipart form data
- Field name: `coverImage`
- File types: JPEG, PNG, WebP
- Max size: 5MB

**Response (200):**
```json
{
  "success": true,
  "message": "Cover image uploaded successfully",
  "data": {
    "url": "https://cloudinary.com/library/books/image123.jpg",
    "publicId": "library/books/image123"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/books/BOOK_ID/cover \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "coverImage=@/path/to/cover.jpg"
```

---

### 8. Update Inventory

Update book inventory quantity.

**Endpoint:** `PATCH /books/:id/inventory`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "quantity": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Inventory updated successfully",
  "data": {
    "id": "uuid",
    "totalCopies": 10,
    "availableCopies": 8,
    ...
  }
}
```

**cURL Example:**
```bash
curl -X PATCH http://localhost:3000/books/BOOK_ID/inventory \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 10}'
```

---

### 9. Get Book Statistics

Get detailed statistics for a book.

**Endpoint:** `GET /books/:id/stats`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookId": "uuid",
    "title": "The Great Gatsby",
    "totalCopies": 5,
    "availableCopies": 3,
    "borrowedCopies": 2,
    "availabilityPercentage": 60,
    "isAvailable": true,
    "isActive": true
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/books/BOOK_ID/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 10. Check Availability

Check if a book is currently available for borrowing.

**Endpoint:** `GET /books/:id/availability`

**Authorization:** All authenticated users

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookId": "uuid",
    "isAvailable": true
  }
}
```

**cURL Example:**
```bash
curl http://localhost:3000/books/BOOK_ID/availability \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["ISBN must be either 10 or 13 digits"],
  "error": "Bad Request"
}
```

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
  "message": "Book with ID xxx not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Book with ISBN 9781234567890 already exists",
  "error": "Conflict"
}
```

---

## Role-Based Access Control

| Endpoint | USER | LIBRARIAN | ADMIN |
|----------|------|-----------|-------|
| POST /books | ❌ | ✅ | ✅ |
| GET /books | ✅ | ✅ | ✅ |
| GET /books/:id | ✅ | ✅ | ✅ |
| GET /books/isbn/:isbn | ✅ | ✅ | ✅ |
| PATCH /books/:id | ❌ | ✅ | ✅ |
| DELETE /books/:id | ❌ | ❌ | ✅ |
| POST /books/:id/cover | ❌ | ✅ | ✅ |
| PATCH /books/:id/inventory | ❌ | ✅ | ✅ |
| GET /books/:id/stats | ✅ | ✅ | ✅ |
| GET /books/:id/availability | ✅ | ✅ | ✅ |

---

## Validation Rules

### ISBN
- Must be exactly 10 or 13 digits
- Must be unique in the system

### Title
- Required
- Min length: 1
- Max length: 500

### Author
- Required
- Min length: 1
- Max length: 200

### Category & Genre
- Both required
- Max length: 100

### Book Value
- Required
- Must be >= 0
- Used for damage/loss calculations

### Publication Year
- Optional
- Min: 1000
- Max: Current year + 1

### Inventory
- totalCopies: Must be >= 1
- availableCopies: Must be >= 0 and <= totalCopies

### Cover Image
- Formats: JPEG, PNG, WebP
- Max size: 5MB
- Automatically optimized via Cloudinary

---

## Search & Filter Examples

### Search by Title
```
GET /books?search=gatsby
```

### Filter by Category
```
GET /books?category=Fiction
```

### Multiple Filters
```
GET /books?category=Fiction&genre=Mystery&language=English
```

### Price Range
```
GET /books?minPrice=200&maxPrice=500
```

### Available Books Only
```
GET /books?availability=available
```

### Pagination
```
GET /books?page=2&limit=20
```

### Sort by Title
```
GET /books?sortBy=title&sortOrder=asc
```

### Complex Query
```
GET /books?category=Fiction&availability=available&sortBy=price&sortOrder=asc&page=1&limit=10
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Deleted books are soft-deleted (isActive = false)
- Cover images are stored on Cloudinary with automatic optimization
- Search is case-insensitive
- Pagination starts at page 1
- Default sort order is by creation date (newest first)

## BookCopy Management

### 11. Add Book Copies

Add physical copies for a book.

**Endpoint:** `POST /books/:id/copies`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "numberOfCopies": 5,
  "shelfLocation": "A-12",
  "section": "Fiction"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "5 copies added successfully",
  "data": {
    "bookId": "uuid",
    "bookTitle": "The Great Gatsby",
    "copiesAdded": 5,
    "totalCopies": 5,
    "availableCopies": 5,
    "copies": [
      {
        "id": "copy-uuid",
        "copyNumber": "001",
        "barcode": "BC-bookid-001",
        "status": "AVAILABLE",
        "shelfLocation": "A-12"
      }
    ]
  }
}
```

---

### 12. List Book Copies

Get all physical copies of a book.

**Endpoint:** `GET /books/:id/copies`

**Authorization:** ADMIN, LIBRARIAN

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookId": "uuid",
    "bookTitle": "The Great Gatsby",
    "totalCopies": 5,
    "copies": [
      {
        "id": "copy-uuid",
        "copyNumber": "001",
        "barcode": "BC-bookid-001",
        "status": "AVAILABLE",
        "condition": "GOOD",
        "shelfLocation": "A-12",
        "section": "Fiction",
        "currentTransaction": null
      }
    ]
  }
}
```

---

### 13. Get Copy Details

Get detailed information about a specific copy.

**Endpoint:** `GET /books/:bookId/copies/:copyId`

**Authorization:** ADMIN, LIBRARIAN

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "copy-uuid",
    "copyNumber": "001",
    "barcode": "BC-bookid-001",
    "status": "AVAILABLE",
    "condition": "GOOD",
    "shelfLocation": "A-12",
    "transactionHistory": [
      {
        "id": "trans-uuid",
        "issueDate": "2024-01-01",
        "returnDate": "2024-01-15",
        "status": "RETURNED",
        "user": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

---

### 14. Update Copy

Update copy details (location, condition, notes).

**Endpoint:** `PATCH /books/:bookId/copies/:copyId`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "shelfLocation": "B-15",
  "section": "Fiction",
  "condition": "FAIR",
  "conditionNotes": "Minor wear on cover"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Book copy updated successfully",
  "data": {
    "id": "copy-uuid",
    "shelfLocation": "B-15",
    "condition": "FAIR",
    ...
  }
}
```

---

### 15. Update Copy Status

Change copy status (AVAILABLE, DAMAGED, LOST, etc.).

**Endpoint:** `PATCH /books/:bookId/copies/:copyId/status`

**Authorization:** ADMIN, LIBRARIAN

**Request Body:**
```json
{
  "status": "DAMAGED",
  "reason": "Water damage",
  "notes": "Needs repair or replacement"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Copy status updated to DAMAGED",
  "data": {
    "id": "copy-uuid",
    "status": "DAMAGED",
    ...
  }
}
```

**Note:** Automatically updates `availableCopies` counter.

---

### 16. Delete Copy

Remove a physical copy from inventory.

**Endpoint:** `DELETE /books/:bookId/copies/:copyId`

**Authorization:** ADMIN only

**Response (200):**
```json
{
  "success": true,
  "message": "Book copy deleted successfully"
}
```

**Note:** Cannot delete copies that are currently issued.

---

## BookCopy Role-Based Access

| Endpoint | USER | LIBRARIAN | ADMIN |
|----------|------|-----------|-------|
| POST /books/:id/copies | ❌ | ✅ | ✅ |
| GET /books/:id/copies | ❌ | ✅ | ✅ |
| GET /books/:bookId/copies/:copyId | ❌ | ✅ | ✅ |
| PATCH /books/:bookId/copies/:copyId | ❌ | ✅ | ✅ |
| PATCH /books/:bookId/copies/:copyId/status | ❌ | ✅ | ✅ |
| DELETE /books/:bookId/copies/:copyId | ❌ | ❌ | ✅ |

