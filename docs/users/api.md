# Users API Documentation

## Overview
Complete user management API with role-based access control (RBAC).

## Base URL
```
http://localhost:3000/users
```

## Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer <your_access_token>
```

---

## Endpoints

### 1. Create User (Admin Only)
**POST** `/users`

**Access:** ADMIN only

**Description:** Admin creates a new user account. User is created with ACTIVE status and email pre-verified.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "dateOfBirth": "1995-05-15",
  "role": "USER",
  "membershipType": "FREE"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "newuser@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "status": "ACTIVE",
      "membershipType": "FREE",
      "createdAt": "2025-12-23T10:00:00Z"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Error Responses:**
```json
// 409 Conflict - Email already exists
{
  "success": false,
  "message": "Email already registered"
}

// 403 Forbidden - Not admin
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

---

### 2. List Users (Admin/Librarian)
**GET** `/users`

**Access:** ADMIN, LIBRARIAN

**Description:** Get paginated list of users with filtering and search.

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
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210",
        "role": "USER",
        "status": "ACTIVE",
        "membershipType": "PREMIUM",
        "membershipExpiry": "2026-12-23T00:00:00Z",
        "profileImageUrl": "https://cloudinary.com/...",
        "emailVerified": true,
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-12-20T14:20:00Z",
        "lastLoginAt": "2025-12-23T09:30:00Z"
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

**Test with cURL:**
```bash
# List all users
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Filter by role
curl -X GET "http://localhost:3000/users?role=USER&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Search by name
curl -X GET "http://localhost:3000/users?search=john" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Pagination
curl -X GET "http://localhost:3000/users?page=2&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 3. Get Current User Profile
**GET** `/users/me`

**Access:** Authenticated users

**Description:** Get current logged-in user's profile with statistics.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "dateOfBirth": "1995-05-15",
      "role": "USER",
      "status": "ACTIVE",
      "membershipType": "PREMIUM",
      "membershipExpiry": "2026-12-23T00:00:00Z",
      "profileImageUrl": "https://cloudinary.com/...",
      "emailVerified": true,
      "twoFactorEnabled": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-12-20T14:20:00Z",
      "lastLoginAt": "2025-12-23T09:30:00Z",
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

**Test with cURL:**
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4. Get User by ID
**GET** `/users/:id`

**Access:** ADMIN, LIBRARIAN (any user), USER (own profile only)

**Description:** Get detailed user information by ID.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "dateOfBirth": "1995-05-15",
      "role": "USER",
      "status": "ACTIVE",
      "membershipType": "PREMIUM",
      "membershipExpiry": "2026-12-23T00:00:00Z",
      "profileImageUrl": "https://cloudinary.com/...",
      "emailVerified": true,
      "twoFactorEnabled": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-12-20T14:20:00Z",
      "lastLoginAt": "2025-12-23T09:30:00Z",
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

**Test with cURL:**
```bash
curl -X GET http://localhost:3000/users/uuid-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note:** Regular users trying to access other users' profiles will receive their own profile instead.

---

### 5. Update Own Profile
**PATCH** `/users/me`

**Access:** Authenticated users

**Description:** Update current user's own profile.

**Request Body:**
```json
{
  "firstName": "UpdatedFirst",
  "lastName": "UpdatedLast",
  "phone": "+919999999999",
  "dateOfBirth": "1995-05-15",
  "profileImageUrl": "https://cloudinary.com/new-image.jpg"
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
      "email": "user@example.com",
      "firstName": "UpdatedFirst",
      "lastName": "UpdatedLast",
      "phone": "+919999999999",
      "dateOfBirth": "1995-05-15",
      "profileImageUrl": "https://cloudinary.com/new-image.jpg",
      "membershipType": "PREMIUM",
      "updatedAt": "2025-12-23T10:30:00Z"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "phone": "+919999999999"
  }'
```

---

### 6. Update User (Admin or Own Profile)
**PATCH** `/users/:id`

**Access:** ADMIN (any user), USER (own profile only)

**Description:** Update user profile. Admin can update any user, regular users can only update themselves.

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "+919876543210",
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
      "email": "user@example.com",
      "firstName": "Updated",
      "lastName": "Name",
      "phone": "+919876543210",
      "dateOfBirth": "1995-05-15",
      "profileImageUrl": null,
      "membershipType": "PREMIUM",
      "updatedAt": "2025-12-23T10:30:00Z"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X PATCH http://localhost:3000/users/uuid-123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "membershipType": "PREMIUM"
  }'
```

**Error Responses:**
```json
// 403 Forbidden - Regular user trying to update other user
{
  "success": false,
  "message": "Cannot update other users"
}

// 404 Not Found
{
  "success": false,
  "message": "User not found"
}
```

---

### 7. Delete User (Admin Only)
**DELETE** `/users/:id`

**Access:** ADMIN only

**Description:** Soft delete user (sets status to INACTIVE). Admin cannot delete their own account.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Test with cURL:**
```bash
curl -X DELETE http://localhost:3000/users/uuid-123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Error Responses:**
```json
// 403 Forbidden - Trying to delete own account
{
  "success": false,
  "message": "Cannot delete your own account"
}

// 404 Not Found
{
  "success": false,
  "message": "User not found"
}
```

---

### 8. Approve User (Admin Only)
**POST** `/users/:id/approve`

**Access:** ADMIN only

**Description:** Approve pending user registration (change status from PENDING_APPROVAL to ACTIVE).

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User approved successfully",
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/users/uuid-123/approve \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Error Responses:**
```json
// 400 Bad Request - User not pending approval
{
  "success": false,
  "message": "User is not pending approval"
}
```

---

### 9. Suspend User (Admin Only)
**POST** `/users/:id/suspend`

**Access:** ADMIN only

**Description:** Suspend user account (change status to SUSPENDED).

**Request Body:**
```json
{
  "reason": "Violation of terms and conditions"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/users/uuid-123/suspend \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Multiple overdue books"
  }'
```

**Error Responses:**
```json
// 400 Bad Request - User already suspended
{
  "success": false,
  "message": "User is already suspended"
}
```

---

### 10. Activate User (Admin Only)
**POST** `/users/:id/activate`

**Access:** ADMIN only

**Description:** Activate suspended or inactive user (change status to ACTIVE).

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "ACTIVE"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/users/uuid-123/activate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Error Responses:**
```json
// 400 Bad Request - User already active
{
  "success": false,
  "message": "User is already active"
}
```

---

## Common Error Responses

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
  "success": false,
  "message": "User not found"
}
```

### 400 Bad Request - Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

---

## User Roles

| Role | Access Level |
|------|-------------|
| **SUPER_ADMIN** | Full system access |
| **ADMIN** | User management, approvals, suspensions |
| **LIBRARIAN** | View users, limited management |
| **USER** | Own profile only |

---

## User Status

| Status | Description |
|--------|-------------|
| **ACTIVE** | User can access the system |
| **PENDING_APPROVAL** | Awaiting admin approval |
| **SUSPENDED** | Account suspended by admin |
| **INACTIVE** | Account deleted (soft delete) |

---

## Membership Types

| Type | Description |
|------|-------------|
| **FREE** | Basic membership |
| **PREMIUM** | Premium features |
| **STUDENT** | Student discount |
| **CORPORATE** | Corporate account |

---

## Testing

### Run Tests
```bash
cd backend

# Unit tests
npm run test -- users

# E2E tests
npm run test:e2e -- users

# All tests
npm run test:cov
```

### Start Development Server
```bash
cd backend
npm run start:dev
```

Server runs on: `http://localhost:3000`

---

## Security Features
- ✅ JWT authentication on all endpoints
- ✅ Role-based authorization (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Input validation with class-validator
- ✅ Soft delete (preserves data)
- ✅ Resource ownership checks
- ✅ Admin cannot delete own account

---

## Notes

- All dates are in ISO 8601 format
- Passwords are never returned in responses
- User statistics are calculated in real-time
- Pagination defaults: page=1, limit=20
- Search is case-insensitive
- Soft delete preserves user data
