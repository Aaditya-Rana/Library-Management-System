# Postman API Testing

Complete Postman collection for testing the Library Management System APIs.

## 📦 Files

- **`auth-collection.json`** - Authentication API collection with automated tests
- **`users-collection.json`** - Users Management API collection with automated tests
- **`environment-local.json`** - Local development environment variables

## 🚀 Quick Start

### 1. Import Collection

**Option A: Import in Postman Desktop/Web**
1. Open Postman
2. Click **Import** button
3. Select `auth-collection.json`
4. Select `environment-local.json`

**Option B: Import via URL (if hosted)**
```
Collection URL: https://raw.githubusercontent.com/YOUR_USERNAME/Library-Management-System/main/docs/postman/auth-collection.json
```

### 2. Set Environment
1. Click environment dropdown (top right)
2. Select **"Library Management - Local"**
3. Verify variables:
   - `base_url`: `http://localhost:3000`
   - `test_email`: `test@example.com`
   - `test_password`: `password123`

### 3. Start Backend Server
```bash
cd backend
npm run start:dev
```

### 4. Run Tests

**Manual Testing:**
1. Expand **Authentication** folder
2. Click any request
3. Click **Send**
4. View response and test results

**Automated Testing (Collection Runner):**
1. Click **Collections** → **Authentication**
2. Click **Run** button
3. Select environment: **Library Management - Local**
4. Click **Run Library Management System - Auth API**
5. View test results

## 📋 Available Endpoints

### Authentication (5 endpoints)

| Endpoint | Method | Description | Auto Tests |
|----------|--------|-------------|------------|
| `/auth/register` | POST | Register new user | 4 tests |
| `/auth/login` | POST | Login user | 5 tests |
| `/auth/refresh` | POST | Refresh access token | 3 tests |
| `/auth/forgot-password` | POST | Request password reset | 4 tests |
| `/auth/reset-password` | POST | Reset password | 3 tests |

**Total: 19 automated tests**

### Users Management (9 endpoints)

| Endpoint | Method | Description | Auto Tests |
|----------|--------|-------------|------------|
| `/users` | POST | Create user (Admin/Super Admin) | 5 tests |
| `/users` | GET | List all users (paginated) | 3 tests |
| `/users/me` | GET | Get current user profile | 2 tests |
| `/users/:id` | GET | Get user by ID | 2 tests |
| `/users/me` | PATCH | Update own profile | 2 tests |
| `/users/:id` | PATCH | Update user (Admin) | 2 tests |
| `/users/:id/approve` | POST | Approve pending user | 2 tests |
| `/users/:id/suspend` | POST | Suspend user account | 2 tests |
| `/users/:id/activate` | POST | Activate user account | 2 tests |
| `/users/:id` | DELETE | Delete user (soft delete) | 2 tests |

**Total: 24 automated tests**

**Grand Total: 43 automated tests across both collections**

## 🧪 Automated Tests

Each request includes automated tests that verify:

### Register User
- ✅ Status code is 201
- ✅ Response has success field
- ✅ User data is returned
- ✅ Response time < 2000ms

### Login User
- ✅ Status code is 200
- ✅ Tokens are returned (access + refresh)
- ✅ User data is returned
- ✅ Tokens saved to environment
- ✅ Response time < 2000ms

### Refresh Token
- ✅ Status code is 200
- ✅ New access token returned
- ✅ Token updated in environment
- ✅ Response time < 1000ms

### Forgot Password
- ✅ Status code is 200
- ✅ Success message returned
- ✅ Reset token saved (for testing)
- ✅ Response time < 1000ms

### Reset Password
- ✅ Status code is 200
- ✅ Success message returned
- ✅ Response time < 2000ms

## 🔐 Environment Variables

### Automatically Set (by tests)
- `access_token` - JWT access token (from login)
- `refresh_token` - JWT refresh token (from login)
- `reset_token` - Password reset token (from forgot-password)
- `user_id` - Current user ID (from login)

### Manually Configure
- `base_url` - API base URL (default: `http://localhost:3000`)
- `test_email` - Test user email
- `test_password` - Test user password

## 📊 Test Workflow

### Complete Flow Test:
1. **Register User** → Creates new account
2. **Login User** → Gets tokens (auto-saved)
3. **Refresh Token** → Gets new access token
4. **Forgot Password** → Gets reset token
5. **Reset Password** → Changes password

### Quick Test:
1. **Login User** → Gets tokens
2. Use tokens for protected endpoints

## 🛠️ Customization

### Change Test Data
Edit environment variables:
```json
{
  "test_email": "your-email@example.com",
  "test_password": "your-secure-password"
}
```

### Add New Requests
1. Right-click **Authentication** folder
2. Click **Add Request**
3. Configure request
4. Add tests in **Tests** tab

### Modify Tests
Click request → **Tests** tab → Edit JavaScript:
```javascript
pm.test('Your test name', function () {
    // Your test code
});
```

## 📖 Test Scripts Examples

### Check Status Code
```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});
```

### Verify Response Data
```javascript
pm.test('Response has user data', function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('user');
});
```

### Save to Environment
```javascript
var jsonData = pm.response.json();
pm.environment.set('access_token', jsonData.data.tokens.accessToken);
```

### Check Response Time
```javascript
pm.test('Response time < 2000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

## 🔄 CI/CD Integration

### Run with Newman (Postman CLI)
```bash
# Install Newman
npm install -g newman

# Run collection
newman run docs/postman/auth-collection.json \
  -e docs/postman/environment-local.json \
  --reporters cli,json

# Run with HTML report
newman run docs/postman/auth-collection.json \
  -e docs/postman/environment-local.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export reports/auth-tests.html
```

### GitHub Actions Example
```yaml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run docs/postman/auth-collection.json \
      -e docs/postman/environment-local.json
```

## 📝 Notes

- **Auto-save tokens**: Login automatically saves tokens to environment
- **Token refresh**: Refresh endpoint updates access token automatically
- **Reset token**: Forgot password saves reset token for testing
- **Response validation**: All endpoints have comprehensive test coverage

## 🐛 Troubleshooting

### Tests Failing?
1. Ensure backend server is running (`npm run start:dev`)
2. Check `base_url` in environment
3. Verify test credentials exist in database
4. Check console for detailed error messages

### Tokens Not Saving?
1. Ensure environment is selected (top right dropdown)
2. Check **Tests** tab for save scripts
3. View **Console** (bottom) for debug logs

### Connection Refused?
1. Verify backend is running on port 3000
2. Check `base_url` matches your server
3. Ensure no firewall blocking localhost

---

**Happy Testing! 🚀**
