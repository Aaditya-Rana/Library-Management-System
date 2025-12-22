# Authentication API

## Overview
JWT-based authentication with role-based access control (RBAC).

## Base URL
```
http://localhost:3000/auth
```

---

## Endpoints

### 1. Register User
**POST** `/auth/register`

**Description:** Create a new user account (requires admin approval).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Awaiting admin approval.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "status": "PENDING_APPROVAL"
    }
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

### 2. Login
**POST** `/auth/login`

**Description:** Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "USER",
      "status": "ACTIVE"
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "expiresIn": 604800
    }
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Authentication

All protected endpoints require the JWT token in the Authorization header:

```bash
curl -X GET http://localhost:3000/protected-route \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Error Responses

### 400 Bad Request
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

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Your account is pending approval"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

## Testing

### Run Tests
```bash
cd backend
npm run test -- auth
```

### Start Development Server
```bash
cd backend
npm run start:dev
```

Server runs on: `http://localhost:3000`

---

## Security Features
- ✅ Password hashing with bcrypt
- ✅ JWT tokens (7-day access, 30-day refresh)
- ✅ Role-based access control
- ✅ User status validation
- ✅ Input validation with class-validator
