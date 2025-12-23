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

### 3. Refresh Token
**POST** `/auth/refresh`

**Description:** Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 604800
  }
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

### 4. Forgot Password
**POST** `/auth/forgot-password`

**Description:** Request password reset token (sent via email in production).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset link sent to your email",
  "data": {
    "resetToken": "eyJhbGci..."
  }
}
```

**Note:** In production, the reset token is sent via email. Currently returns token in response for testing.

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

### 5. Reset Password
**POST** `/auth/reset-password`

**Description:** Reset password using token from forgot-password endpoint.

**Request Body:**
```json
{
  "token": "eyJhbGci...",
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

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_FORGOT_PASSWORD",
    "newPassword": "newpassword123"
  }'
```

---

### 6. Verify Email
**GET** `/auth/verify-email`

**Description:** Verify email address using token from verification email.

**Query Parameters:**
- `token` (string, required) - Verification token from email

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Test with cURL:**
```bash
curl -X GET "http://localhost:3000/auth/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

**Notes:**
- Token expires after 24 hours
- Token is one-time use only
- Welcome email sent after successful verification

---

### 7. Resend Verification Email
**POST** `/auth/resend-verification`

**Description:** Resend verification email to unverified user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Test with cURL:**
```bash
curl -X POST http://localhost:3000/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Notes:**
- Returns success even if email doesn't exist (security)
- Fails if email is already verified
- Generates new token with 24-hour expiry

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
