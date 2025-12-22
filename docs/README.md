# Documentation

Organized documentation for the Library Management System.

## 📁 Structure

```
docs/
├── README.md                    # This file
├── API_DOCUMENTATION.md         # Complete API reference (87 endpoints)
├── IMPLEMENTATION_PLAN.md       # Development roadmap
├── auth/
│   └── api.md                   # Authentication API endpoints
├── books/
│   └── api.md                   # Books API endpoints (coming soon)
├── users/
│   └── api.md                   # Users API endpoints (coming soon)
├── transactions/
│   └── api.md                   # Transactions API endpoints (coming soon)
├── deliveries/
│   └── api.md                   # Deliveries API endpoints (coming soon)
└── payments/
    └── api.md                   # Payments API endpoints (coming soon)
```

## 🚀 Quick Start

### Run Backend
```bash
cd backend
npm run start:dev
```

Server runs on: `http://localhost:3000`

### Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📚 Feature Documentation

### Authentication
- [Auth API](./auth/api.md) - 5 endpoints (register, login, refresh, forgot/reset password)

### Coming Soon
- Users API - User management and profiles
- Books API - Book catalog and management
- Transactions API - Book borrowing and returns
- Deliveries API - Home delivery system
- Payments API - Payment processing

## 📖 References

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with all 87 endpoints
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - 15-week development roadmap

---

**For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
