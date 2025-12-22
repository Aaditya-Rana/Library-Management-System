# Library Management System

A modern, full-stack library management system with home delivery support, built with Next.js and NestJS.

## 📚 Project Overview

This system supports four user roles (Super Admin, Admin, Librarian, User) and two operational modes:
- **Offline Mode**: Traditional in-library book borrowing
- **Online Mode**: Home delivery with payment integration

## 🏗️ Architecture

```
library-management-system/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application (coming soon)
└── docs/             # Documentation
```

## 🚀 Tech Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT + Passport
- **File Storage:** Cloudinary
- **Payments:** Razorpay
- **Email:** Nodemailer

### Frontend (Planned)
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand + TanStack Query

## 📋 Features

- ✅ Multi-role authentication & authorization
- ✅ Book catalog management with search
- ✅ Offline book issuing/returning
- ✅ Online home delivery system
- ✅ Payment integration (Razorpay)
- ✅ Fine management
- ✅ Reviews & ratings
- ✅ Reporting & analytics
- ✅ Email notifications
- ✅ Audit logging

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 15.x
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run Prisma migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

### Running Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📖 Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Development roadmap
- [System Workflows](./SYSTEM_CONFIGURATION_AND_WORKFLOWS.md) - User flows
- [Revenue Model](./REVENUE_MODEL.md) - Business model
- [Home Delivery Feature](./HOME_DELIVERY_FEATURE.md) - Delivery system details

## 🔀 Git Workflow

We follow a structured branching strategy:

- `main` - Production-ready code
- `develop` - Development branch (default)
- `feature/*` - Feature branches
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

### Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Test changes
chore: Build/tooling changes
```

## 🧪 CI/CD

GitHub Actions workflows automatically:
- Run linting and type checking
- Execute unit and E2E tests
- Build the application
- Generate coverage reports

## 📊 Project Status

**Current Phase:** Phase 1 Complete ✅  
**Next Phase:** Phase 2 - Authentication Module

### Phase 1: Project Setup ✅
- [x] NestJS project initialization
- [x] Prisma schema with 15 models
- [x] ESLint + Prettier + Husky
- [x] Git repository with branch strategy
- [x] GitHub Actions CI/CD
- [x] Folder structure for all modules

### Phase 2: Backend Core (In Progress)
- [ ] Authentication module
- [ ] Users module
- [ ] Books module
- [ ] Database migrations

## 👥 Team

- **Developer:** [Your Name]
- **Project Type:** Production-ready library management system

## 📄 License

MIT

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass and linting is clean
5. Create a pull request to `develop`

---

**Built with ❤️ using NestJS and Next.js**
