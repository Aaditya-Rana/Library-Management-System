# Library Management System - Backend

A comprehensive library management system backend built with NestJS, PostgreSQL, and Prisma.

## 🚀 Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Passport
- **File Upload:** Cloudinary
- **Payments:** Razorpay
- **Email:** Nodemailer
- **Testing:** Jest

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 15.x
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate
```

## 🏃 Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # User management
│   ├── books/             # Book management
│   ├── transactions/      # Circulation
│   ├── deliveries/        # Home delivery
│   ├── payments/          # Payment integration
│   ├── notifications/     # Email/SMS
│   ├── reports/           # Analytics
│   ├── reviews/           # Reviews & ratings
│   ├── settings/          # System configuration
│   ├── common/            # Shared utilities
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   └── services/
│   ├── config/            # Configuration
│   └── main.ts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── test/                  # E2E tests
└── package.json
```

## 🔧 Configuration

Environment variables required:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/library_db"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Razorpay
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Library System <noreply@library.com>"
```

## 📚 API Documentation

API documentation is available at `/api/docs` when running in development mode.

## 🔀 Git Workflow

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Hotfix branches

## 📝 Commit Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Create a pull request to `develop`

## 📄 License

MIT
