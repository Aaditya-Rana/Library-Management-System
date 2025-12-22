# Documentation

This directory contains feature documentation and API references.

## 📚 Available Documents

### Planning & Architecture
- **[BRAINSTORMING.md](./BRAINSTORMING.md)** - Initial project planning and features
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Development roadmap
- **[SYSTEM_CONFIGURATION_AND_WORKFLOWS.md](./SYSTEM_CONFIGURATION_AND_WORKFLOWS.md)** - User workflows
- **[HOME_DELIVERY_FEATURE.md](./HOME_DELIVERY_FEATURE.md)** - Delivery system specification
- **[REVENUE_MODEL.md](./REVENUE_MODEL.md)** - Business model

### API Documentation
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference (87 endpoints)

### Feature Guides
- **[AUTH_MODULE_SUMMARY.md](./AUTH_MODULE_SUMMARY.md)** - Authentication API endpoints and testing

---

## 🚀 Quick Start

### Run the Backend
```bash
cd backend
npm run start:dev
```

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

---

**For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
