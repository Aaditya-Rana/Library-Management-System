# Library Management System - Complete Implementation Plan

## 🎯 Project Overview

**Tech Stack:**
- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL 15+
- **Image Storage:** Cloudinary
- **Payment:** Razorpay
- **Code Quality:** ESLint, Prettier, Husky
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel (Frontend), Railway/Render (Backend)

---

## 📁 Project Structure

```
library-management-system/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App router pages
│   │   │   ├── (auth)/         # Auth routes
│   │   │   ├── (dashboard)/    # Protected routes
│   │   │   ├── api/            # API routes (if needed)
│   │   │   └── layout.tsx
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── forms/          # Form components
│   │   │   ├── layouts/        # Layout components
│   │   │   └── features/       # Feature-specific components
│   │   ├── lib/                # Utilities
│   │   │   ├── api/            # API client
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── utils/          # Helper functions
│   │   │   └── validations/    # Zod schemas
│   │   ├── types/              # TypeScript types
│   │   └── styles/             # Global styles
│   ├── public/                 # Static assets
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── next.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                     # NestJS application
│   ├── src/
│   │   ├── auth/               # Authentication module
│   │   ├── users/              # User management
│   │   ├── books/              # Book management
│   │   ├── transactions/       # Circulation
│   │   ├── deliveries/         # Home delivery
│   │   ├── payments/           # Payment integration
│   │   ├── notifications/      # Email/SMS
│   │   ├── reports/            # Analytics
│   │   ├── config/             # Configuration
│   │   ├── common/             # Shared utilities
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── filters/
│   │   └── main.ts
│   ├── prisma/                 # Prisma ORM
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── test/                   # E2E tests
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── deploy.yml
│
├── docs/                       # Documentation
├── .gitignore
└── README.md
```

---

## 🗄️ Database Schema (PostgreSQL + Prisma)

### Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  LIBRARIAN
  USER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_APPROVAL
}

enum MembershipType {
  FREE
  PREMIUM
  STUDENT
  CORPORATE
}

enum BookStatus {
  AVAILABLE
  ISSUED
  RESERVED
  IN_TRANSIT_DELIVERY
  IN_TRANSIT_RETURN
  DAMAGED
  LOST
  MAINTENANCE
}

enum BookCondition {
  NEW
  EXCELLENT
  GOOD
  FAIR
  POOR
  DAMAGED
}

enum TransactionStatus {
  ISSUED
  RETURNED
  OVERDUE
  RENEWED
}

enum DeliveryStatus {
  PENDING
  PAYMENT_CONFIRMED
  APPROVED
  READY_FOR_DELIVERY
  ASSIGNED
  OUT_FOR_DELIVERY
  DELIVERED
  PICKUP_SCHEDULED
  PICKUP_IN_PROGRESS
  RETURNED
  FAILED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentMethod {
  CASH
  CARD
  UPI
  NET_BANKING
  WALLET
}

enum NotificationType {
  EMAIL
  SMS
  IN_APP
}

enum NotificationCategory {
  BOOK_ISSUED
  BOOK_RETURNED
  DUE_REMINDER
  OVERDUE_NOTICE
  RESERVATION_AVAILABLE
  DELIVERY_UPDATE
  PAYMENT_CONFIRMATION
  FINE_NOTICE
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id                String           @id @default(uuid())
  email             String           @unique
  password          String
  role              UserRole         @default(USER)
  status            UserStatus       @default(PENDING_APPROVAL)
  
  // Profile
  firstName         String
  lastName          String
  phone             String?
  dateOfBirth       DateTime?
  profileImageUrl   String?
  
  // Membership
  membershipType    MembershipType   @default(FREE)
  membershipExpiry  DateTime?
  
  // Settings
  emailVerified     Boolean          @default(false)
  twoFactorEnabled  Boolean          @default(false)
  
  // Metadata
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  lastLoginAt       DateTime?
  
  // Relations
  addresses         Address[]
  transactions      Transaction[]
  reservations      Reservation[]
  reviews           Review[]
  notifications     Notification[]
  deliveryRequests  DeliveryRequest[]
  payments          Payment[]
  auditLogs         AuditLog[]
  
  @@index([email])
  @@index([role])
  @@index([status])
}

model Address {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  addressType     String   // home, work, other
  addressLine1    String
  addressLine2    String?
  city            String
  state           String
  pincode         String
  landmark        String?
  
  latitude        Float?
  longitude       Float?
  isDefault       Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  deliveryRequests DeliveryRequest[]
  
  @@index([userId])
}

// ============================================
// BOOK MANAGEMENT
// ============================================

model Book {
  id                String         @id @default(uuid())
  
  // Basic Info
  isbn              String         @unique
  title             String
  author            String
  publisher         String?
  edition           String?
  publicationYear   Int?
  language          String         @default("English")
  
  // Classification
  genre             String
  category          String
  subCategory       String?
  
  // Physical Details
  pages             Int?
  format            String?        // hardcover, paperback, etc.
  
  // Content
  description       String?        @db.Text
  coverImageUrl     String?
  
  // Inventory
  totalCopies       Int            @default(1)
  availableCopies   Int            @default(1)
  
  // Pricing & Policies
  bookValue         Float          // For damage/loss calculation
  securityDeposit   Float          @default(200)
  loanPeriodDays    Int            @default(14)
  finePerDay        Float          @default(5)
  maxRenewals       Int            @default(2)
  
  // Flags
  isDeliveryEligible Boolean       @default(true)
  isActive          Boolean        @default(true)
  
  // Metadata
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  // Relations
  copies            BookCopy[]
  transactions      Transaction[]
  reservations      Reservation[]
  reviews           Review[]
  deliveryRequests  DeliveryRequest[]
  
  @@index([isbn])
  @@index([title])
  @@index([author])
  @@index([genre])
  @@index([category])
}

model BookCopy {
  id              String         @id @default(uuid())
  bookId          String
  book            Book           @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  copyNumber      String         // e.g., "001", "002"
  barcode         String         @unique
  
  status          BookStatus     @default(AVAILABLE)
  condition       BookCondition  @default(GOOD)
  
  // Location
  shelfLocation   String?
  section         String?
  
  // Tracking
  acquiredDate    DateTime       @default(now())
  lastIssuedDate  DateTime?
  
  // Condition tracking
  conditionNotes  String?        @db.Text
  conditionPhotos Json?          // Array of image URLs
  
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  transactions    Transaction[]
  
  @@index([bookId])
  @@index([barcode])
  @@index([status])
}

// ============================================
// CIRCULATION
// ============================================

model Transaction {
  id              String            @id @default(uuid())
  
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  bookId          String
  book            Book              @relation(fields: [bookId], references: [id])
  
  bookCopyId      String
  bookCopy        BookCopy          @relation(fields: [bookCopyId], references: [id])
  
  librarianId     String?           // Who issued the book
  
  // Dates
  issueDate       DateTime          @default(now())
  dueDate         DateTime
  returnDate      DateTime?
  
  // Status
  status          TransactionStatus @default(ISSUED)
  renewalCount    Int               @default(0)
  
  // Charges
  fineAmount      Float             @default(0)
  finePaid        Boolean           @default(false)
  damageCharge    Float             @default(0)
  
  // Condition tracking
  issueCondition  Json?             // Photos at issue time
  returnCondition Json?             // Photos at return time
  
  // Metadata
  isHomeDelivery  Boolean           @default(false)
  notes           String?           @db.Text
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  payments        Payment[]
  
  @@index([userId])
  @@index([bookId])
  @@index([status])
  @@index([dueDate])
}

model Reservation {
  id              String    @id @default(uuid())
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bookId          String
  book            Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  reservedDate    DateTime  @default(now())
  expiresAt       DateTime?
  notifiedAt      DateTime?
  
  status          String    // pending, fulfilled, expired, cancelled
  priority        Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
  @@index([bookId])
  @@index([status])
}

// ============================================
// HOME DELIVERY
// ============================================

model DeliveryRequest {
  id                    String          @id @default(uuid())
  
  userId                String
  user                  User            @relation(fields: [userId], references: [id])
  
  bookId                String
  book                  Book            @relation(fields: [bookId], references: [id])
  
  addressId             String
  address               Address         @relation(fields: [addressId], references: [id])
  
  requestType           String          // delivery, pickup
  
  // Scheduling
  preferredDate         DateTime
  preferredSlot         String          // morning, afternoon, evening
  scheduledDate         DateTime?
  scheduledSlot         String?
  
  // Assignment
  assignedToId          String?
  assignedTo            DeliveryPersonnel? @relation(fields: [assignedToId], references: [id])
  assignedAt            DateTime?
  
  // Status
  status                DeliveryStatus  @default(PENDING)
  
  // Delivery details
  deliveredAt           DateTime?
  deliveryProofUrl      String?
  deliverySignatureUrl  String?
  deliveryNotes         String?        @db.Text
  
  // Book condition
  conditionOnDelivery   Json?
  conditionOnReturn     Json?
  
  // Charges
  deliveryFee           Float           @default(50)
  securityDeposit       Float           @default(200)
  
  // Special instructions
  specialInstructions   String?         @db.Text
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  // Relations
  payments              Payment[]
  
  @@index([userId])
  @@index([bookId])
  @@index([status])
  @@index([assignedToId])
}

model DeliveryPersonnel {
  id                    String            @id @default(uuid())
  
  name                  String
  phone                 String
  email                 String?
  
  employeeId            String            @unique
  status                String            @default("active") // active, inactive, on_leave
  
  // Vehicle
  vehicleType           String?           // bike, car, bicycle
  vehicleNumber         String?
  
  // Performance
  totalDeliveries       Int               @default(0)
  successfulDeliveries  Int               @default(0)
  failedDeliveries      Int               @default(0)
  averageRating         Float?
  
  // Availability
  available             Boolean           @default(true)
  currentLocationLat    Float?
  currentLocationLng    Float?
  lastLocationUpdate    DateTime?
  
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  
  // Relations
  deliveryRequests      DeliveryRequest[]
  
  @@index([employeeId])
  @@index([status])
}

// ============================================
// PAYMENTS
// ============================================

model Payment {
  id                String         @id @default(uuid())
  
  userId            String
  user              User           @relation(fields: [userId], references: [id])
  
  transactionId     String?
  transaction       Transaction?   @relation(fields: [transactionId], references: [id])
  
  deliveryRequestId String?
  deliveryRequest   DeliveryRequest? @relation(fields: [deliveryRequestId], references: [id])
  
  // Payment details
  amount            Float
  paymentMethod     PaymentMethod
  paymentStatus     PaymentStatus  @default(PENDING)
  
  // Gateway details
  razorpayOrderId   String?
  razorpayPaymentId String?
  razorpaySignature String?
  
  // Breakdown
  deliveryFee       Float          @default(0)
  securityDeposit   Float          @default(0)
  lateFee           Float          @default(0)
  damageCharge      Float          @default(0)
  
  // Refund
  refundAmount      Float?
  refundDate        DateTime?
  refundReason      String?
  
  // Metadata
  paymentDate       DateTime?
  notes             String?        @db.Text
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@index([userId])
  @@index([paymentStatus])
  @@index([razorpayOrderId])
}

// ============================================
// REVIEWS & RATINGS
// ============================================

model Review {
  id              String    @id @default(uuid())
  
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bookId          String
  book            Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  
  rating          Int       // 1-5
  reviewText      String?   @db.Text
  helpfulCount    Int       @default(0)
  
  status          String    @default("pending") // pending, approved, rejected
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, bookId])
  @@index([bookId])
  @@index([rating])
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id              String              @id @default(uuid())
  
  userId          String
  user            User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            NotificationType
  category        NotificationCategory
  
  title           String
  message         String              @db.Text
  
  read            Boolean             @default(false)
  sentAt          DateTime?
  
  createdAt       DateTime            @default(now())
  
  @@index([userId])
  @@index([read])
  @@index([category])
}

// ============================================
// SYSTEM CONFIGURATION
// ============================================

model SystemSetting {
  id              String    @id @default(uuid())
  
  key             String    @unique
  value           String    @db.Text
  category        String    // fine_rates, delivery_charges, loan_periods, etc.
  description     String?
  
  updatedBy       String?
  updatedAt       DateTime  @updatedAt
  createdAt       DateTime  @default(now())
  
  @@index([category])
}

// ============================================
// AUDIT LOGS
// ============================================

model AuditLog {
  id              String    @id @default(uuid())
  
  userId          String?
  user            User?     @relation(fields: [userId], references: [id])
  
  action          String    // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType      String    // User, Book, Transaction, etc.
  entityId        String?
  
  oldValue        Json?
  newValue        Json?
  
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([entityType])
  @@index([action])
  @@index([createdAt])
}
```

---

## 🚀 Phase-by-Phase Implementation

### **Phase 1: Project Setup & Foundation** (Week 1)

#### 1.1 Initialize Projects

**Backend Setup:**
```bash
# Create NestJS project
npx @nestjs/cli new backend
cd backend

# Install dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @prisma/client bcrypt class-validator class-transformer
npm install cloudinary razorpay nodemailer

# Dev dependencies
npm install -D prisma @types/bcrypt @types/passport-jwt @types/nodemailer
npm install -D eslint prettier eslint-config-prettier
npm install -D husky lint-staged

# Initialize Prisma
npx prisma init
```

**Frontend Setup:**
```bash
# Create Next.js project
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir

cd frontend

# Install dependencies
npm install axios react-hook-form zod @hookform/resolvers
npm install zustand @tanstack/react-query
npm install next-auth
npm install lucide-react class-variance-authority clsx tailwind-merge

# UI components (shadcn/ui)
npx shadcn-ui@latest init

# Dev dependencies
npm install -D eslint prettier eslint-config-prettier
npm install -D husky lint-staged
```

#### 1.2 Configure Code Quality Tools

**ESLint Config (both projects):**
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

**Prettier Config:**
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "semi": true
}
```

**Husky Setup:**
```bash
# Initialize husky
npx husky-init && npm install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

**Lint-staged Config:**
```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### 1.3 GitHub Workflows

**Backend CI:**
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: library_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: backend
        run: npm ci
      
      - name: Run Prisma migrations
        working-directory: backend
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/library_test
      
      - name: Run linter
        working-directory: backend
        run: npm run lint
      
      - name: Run tests
        working-directory: backend
        run: npm run test:cov
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/library_test
      
      - name: Build
        working-directory: backend
        run: npm run build
```

**Frontend CI:**
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Run linter
        working-directory: frontend
        run: npm run lint
      
      - name: Run type check
        working-directory: frontend
        run: npm run type-check
      
      - name: Build
        working-directory: frontend
        run: npm run build
```

---

### **Phase 2: Backend Core** (Weeks 2-4)

#### 2.1 Authentication Module

**Files to create:**
- `src/auth/auth.module.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.controller.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/guards/roles.guard.ts`
- `src/auth/decorators/roles.decorator.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/dto/register.dto.ts`

**Key Features:**
- JWT-based authentication
- Role-based authorization (RBAC)
- Password hashing with bcrypt
- Refresh token mechanism
- Email verification
- Password reset flow

#### 2.2 Users Module

**Files to create:**
- `src/users/users.module.ts`
- `src/users/users.service.ts`
- `src/users/users.controller.ts`
- `src/users/dto/create-user.dto.ts`
- `src/users/dto/update-user.dto.ts`
- `src/users/entities/user.entity.ts`

**Endpoints:**
```
POST   /users                    # Create user (admin only)
GET    /users                    # List users (admin/librarian)
GET    /users/:id                # Get user details
PATCH  /users/:id                # Update user
DELETE /users/:id                # Delete user (admin only)
GET    /users/me                 # Get current user profile
PATCH  /users/me                 # Update own profile
POST   /users/:id/approve        # Approve user (admin)
POST   /users/:id/suspend        # Suspend user (admin)
```

#### 2.3 Books Module

**Files to create:**
- `src/books/books.module.ts`
- `src/books/books.service.ts`
- `src/books/books.controller.ts`
- `src/books/dto/create-book.dto.ts`
- `src/books/dto/update-book.dto.ts`
- `src/books/dto/search-books.dto.ts`

**Endpoints:**
```
POST   /books                    # Add book (admin)
GET    /books                    # List/search books
GET    /books/:id                # Get book details
PATCH  /books/:id                # Update book (admin)
DELETE /books/:id                # Delete book (admin)
POST   /books/:id/copies         # Add book copies
GET    /books/:id/availability   # Check availability
POST   /books/bulk-import        # Bulk import (CSV)
```

**Cloudinary Integration:**
```typescript
// src/common/services/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      ).end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
```

#### 2.4 Database Setup

**Environment Variables:**
```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
```

**Run Migrations:**
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

---

### **Phase 3: Frontend Core** (Weeks 5-7)

#### 3.1 Authentication UI

**Pages to create:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`

**Components:**
- `src/components/forms/LoginForm.tsx`
- `src/components/forms/RegisterForm.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Button.tsx`

**State Management (Zustand):**
```typescript
// src/lib/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

#### 3.2 Dashboard Layouts

**Role-based Dashboards:**
- `src/app/(dashboard)/super-admin/page.tsx`
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/librarian/page.tsx`
- `src/app/(dashboard)/user/page.tsx`

**Layout Components:**
- `src/components/layouts/DashboardLayout.tsx`
- `src/components/layouts/Sidebar.tsx`
- `src/components/layouts/Header.tsx`

#### 3.3 Book Catalog

**Pages:**
- `src/app/(dashboard)/books/page.tsx` (List)
- `src/app/(dashboard)/books/[id]/page.tsx` (Details)
- `src/app/(dashboard)/books/search/page.tsx`

**Components:**
- `src/components/features/books/BookCard.tsx`
- `src/components/features/books/BookGrid.tsx`
- `src/components/features/books/BookSearch.tsx`
- `src/components/features/books/BookFilters.tsx`

**API Client:**
```typescript
// src/lib/api/books.api.ts
import axios from './axios';

export const booksApi = {
  getAll: (params?: SearchParams) => 
    axios.get('/books', { params }),
  
  getById: (id: string) => 
    axios.get(`/books/${id}`),
  
  create: (data: CreateBookDto) => 
    axios.post('/books', data),
  
  update: (id: string, data: UpdateBookDto) => 
    axios.patch(`/books/${id}`, data),
  
  delete: (id: string) => 
    axios.delete(`/books/${id}`),
  
  uploadCover: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`/books/${id}/cover`, formData);
  },
};
```

---

### **Phase 4: Circulation & Delivery** (Weeks 8-10)

#### 4.1 Offline Book Issuing

**Backend:**
- `src/transactions/transactions.module.ts`
- `src/transactions/transactions.service.ts`
- `src/transactions/transactions.controller.ts`

**Endpoints:**
```
POST   /transactions/issue       # Issue book (librarian)
POST   /transactions/return      # Return book (librarian)
POST   /transactions/renew       # Renew book
GET    /transactions             # List transactions
GET    /transactions/:id         # Get transaction details
PATCH  /transactions/:id/fine    # Update fine
```

**Frontend:**
- `src/app/(dashboard)/librarian/issue/page.tsx`
- `src/app/(dashboard)/librarian/return/page.tsx`
- `src/components/features/circulation/IssueBookForm.tsx`
- `src/components/features/circulation/ReturnBookForm.tsx`

#### 4.2 Online Delivery System

**Backend:**
- `src/deliveries/deliveries.module.ts`
- `src/deliveries/deliveries.service.ts`
- `src/deliveries/deliveries.controller.ts`

**Endpoints:**
```
POST   /deliveries/request       # Create delivery request (user)
GET    /deliveries               # List delivery requests
GET    /deliveries/:id           # Get delivery details
PATCH  /deliveries/:id/approve   # Approve request (librarian)
PATCH  /deliveries/:id/assign    # Assign to personnel
PATCH  /deliveries/:id/status    # Update status
POST   /deliveries/:id/pickup    # Schedule pickup
```

**Frontend:**
- `src/app/(dashboard)/user/delivery/request/page.tsx`
- `src/app/(dashboard)/librarian/deliveries/page.tsx`
- `src/components/features/delivery/DeliveryRequestForm.tsx`
- `src/components/features/delivery/DeliveryManagement.tsx`

#### 4.3 Payment Integration (Razorpay)

**Backend:**
```typescript
// src/payments/payments.service.ts
import Razorpay from 'razorpay';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(amount: number, currency = 'INR') {
    return this.razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    });
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<boolean> {
    const crypto = require('crypto');
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    return generated_signature === signature;
  }

  async processRefund(paymentId: string, amount: number) {
    return this.razorpay.payments.refund(paymentId, {
      amount: amount * 100,
    });
  }
}
```

**Frontend:**
```typescript
// src/lib/razorpay.ts
export const initiatePayment = async (
  orderId: string,
  amount: number,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void,
) => {
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: 'INR',
    name: 'Library Management System',
    description: 'Book Delivery Payment',
    order_id: orderId,
    handler: onSuccess,
    prefill: {
      name: 'User Name',
      email: 'user@example.com',
      contact: '9999999999',
    },
    theme: {
      color: '#3399cc',
    },
  };

  const razorpay = new (window as any).Razorpay(options);
  razorpay.on('payment.failed', onFailure);
  razorpay.open();
};
```

#### 4.4 Notification System

**Backend:**
```typescript
// src/notifications/notifications.service.ts
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
  }

  async sendBookIssuedEmail(user: User, book: Book, dueDate: Date) {
    const html = `
      <h1>Book Issued Successfully</h1>
      <p>Dear ${user.firstName},</p>
      <p>You have successfully borrowed "${book.title}"</p>
      <p>Due Date: ${dueDate.toLocaleDateString()}</p>
      <p>Please return the book on time to avoid late fees.</p>
    `;
    
    await this.sendEmail(user.email, 'Book Issued', html);
  }

  // Similar methods for other notifications...
}
```

---

### **Phase 5: Advanced Features** (Weeks 11-13)

#### 5.1 Reporting & Analytics

**Backend:**
- `src/reports/reports.module.ts`
- `src/reports/reports.service.ts`
- `src/reports/reports.controller.ts`

**Endpoints:**
```
GET /reports/dashboard           # Dashboard stats
GET /reports/books/popular       # Most borrowed books
GET /reports/revenue             # Revenue report
GET /reports/overdue             # Overdue books
GET /reports/users/activity      # User activity
GET /reports/export              # Export to Excel/PDF
```

**Frontend:**
- `src/app/(dashboard)/admin/reports/page.tsx`
- `src/components/features/reports/DashboardStats.tsx`
- `src/components/features/reports/Charts.tsx` (using Chart.js/Recharts)

#### 5.2 Fine Management

**Backend:**
- Auto-calculate fines on overdue
- Fine waiver workflow
- Payment tracking

**Frontend:**
- `src/app/(dashboard)/user/fines/page.tsx`
- `src/components/features/fines/FinesList.tsx`
- `src/components/features/fines/PaymentModal.tsx`

#### 5.3 Reviews & Ratings

**Backend:**
- `src/reviews/reviews.module.ts`
- Review moderation
- Rating aggregation

**Frontend:**
- `src/components/features/books/ReviewSection.tsx`
- `src/components/features/books/RatingStars.tsx`
- `src/components/features/books/WriteReview.tsx`

#### 5.4 Admin Configuration Panel

**Frontend:**
- `src/app/(dashboard)/super-admin/settings/page.tsx`
- `src/components/features/settings/FineRatesConfig.tsx`
- `src/components/features/settings/DeliveryChargesConfig.tsx`
- `src/components/features/settings/LoanPeriodsConfig.tsx`

---

### **Phase 6: Testing & Deployment** (Weeks 14-15)

#### 6.1 Testing

**Backend Tests:**
```typescript
// src/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });
  
  it('should register a new user', async () => {
    const dto = { email: 'test@test.com', password: 'password' };
    const result = await service.register(dto);
    expect(result).toHaveProperty('token');
  });
  
  // More tests...
});
```

**Frontend Tests:**
```typescript
// src/components/forms/LoginForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
```

#### 6.2 Deployment

**Backend (Railway/Render):**
```bash
# Add Procfile
web: npm run start:prod

# Environment variables on platform
DATABASE_URL=postgresql://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
RAZORPAY_KEY_ID=...
```

**Frontend (Vercel):**
```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}

# Environment variables on Vercel
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
```

---

## 📱 Complete User Flows

### Flow 1: User Registration & Book Borrowing (Offline)

```
1. User visits website
   ↓
2. Clicks "Register"
   ↓
3. Fills registration form
   - Email, password, name, phone
   - Uploads ID proof (Cloudinary)
   - Uploads profile photo (Cloudinary)
   ↓
4. Submits form
   ↓
5. Backend creates user with status: PENDING_APPROVAL
   ↓
6. Admin/Librarian reviews registration
   ↓
7. Admin approves user
   ↓
8. User receives approval email
   ↓
9. User visits library physically
   ↓
10. Librarian scans user card
    ↓
11. Librarian scans book barcode
    ↓
12. System checks eligibility
    ↓
13. Librarian issues book
    ↓
14. User receives confirmation email
    ↓
15. User takes book home
    ↓
16. User returns book before due date
    ↓
17. Librarian scans book
    ↓
18. System marks as returned
    ↓
19. User receives return confirmation
```

### Flow 2: Online Book Delivery

```
1. User logs in
   ↓
2. Browses book catalog
   ↓
3. Searches for specific book
   ↓
4. Views book details
   ↓
5. Clicks "Request Home Delivery"
   ↓
6. Selects/adds delivery address
   ↓
7. Chooses delivery date & time slot
   ↓
8. Reviews order summary
   - Book details
   - Delivery fee: ₹50
   - Security deposit: ₹200
   - Total: ₹250
   ↓
9. Clicks "Proceed to Payment"
   ↓
10. Razorpay payment modal opens
    ↓
11. User completes payment
    ↓
12. Backend verifies payment
    ↓
13. Creates delivery request (status: PAYMENT_CONFIRMED)
    ↓
14. User receives confirmation email
    ↓
15. Librarian sees request in dashboard
    ↓
16. Librarian approves request
    ↓
17. Librarian prepares book
    - Scans barcode
    - Takes condition photos (Cloudinary)
    - Packs book
    ↓
18. Librarian assigns to delivery personnel
    ↓
19. Delivery person receives notification
    ↓
20. Delivery person delivers book
    - Scans QR code
    - Captures signature
    - Takes delivery photo
    ↓
21. User receives book
    ↓
22. System updates status: DELIVERED
    ↓
23. User receives delivery confirmation
    ↓
24. User reads book (14 days)
    ↓
25. User receives reminder (3 days before due)
    ↓
26. User schedules return pickup
    ↓
27. Delivery person picks up book
    - Scans QR code
    - Takes condition photos
    ↓
28. Book returned to library
    ↓
29. Librarian inspects book
    ↓
30. Librarian processes return
    - Compares photos
    - Calculates charges (if any)
    ↓
31. System processes refund
    - Security deposit: ₹200
    - Late fee: ₹0
    - Refund: ₹200
    ↓
32. User receives refund in 24 hours
    ↓
33. User receives final receipt
```

### Flow 3: Admin Managing System Settings

```
1. Super Admin logs in
   ↓
2. Navigates to Settings
   ↓
3. Selects "Fine Rates"
   ↓
4. Updates fine rate
   - Standard books: ₹5/day → ₹7/day
   ↓
5. Clicks "Save Changes"
   ↓
6. System validates input
   ↓
7. Updates SystemSetting table
   ↓
8. Creates audit log
   ↓
9. Shows success message
   ↓
10. New fine rate applies to all future transactions
```

---

## 🎨 UI/UX Design Guidelines

### Design System

**Colors:**
```css
:root {
  --primary: #3B82F6;      /* Blue */
  --secondary: #8B5CF6;    /* Purple */
  --success: #10B981;      /* Green */
  --warning: #F59E0B;      /* Amber */
  --danger: #EF4444;       /* Red */
  --background: #F9FAFB;   /* Light gray */
  --surface: #FFFFFF;      /* White */
  --text-primary: #111827; /* Dark gray */
  --text-secondary: #6B7280; /* Medium gray */
}
```

**Typography:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

h1: 2.5rem / 600
h2: 2rem / 600
h3: 1.5rem / 600
body: 1rem / 400
small: 0.875rem / 400
```

**Components:**
- Use shadcn/ui for consistent components
- Implement dark mode support
- Ensure WCAG 2.1 AA compliance
- Mobile-first responsive design

---

## 📊 Success Metrics & Monitoring

### Key Metrics to Track

**Technical:**
- API response time < 500ms
- Page load time < 2s
- Error rate < 1%
- Uptime > 99.9%

**Business:**
- Daily active users
- Books borrowed per day
- Delivery requests per day
- Revenue per day
- User retention rate

**Monitoring Tools:**
- Sentry (Error tracking)
- LogRocket (Session replay)
- Google Analytics (User behavior)
- Prisma Studio (Database monitoring)

---

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All tests passing (unit, integration, E2E)
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Database backups configured
- [ ] SSL certificates installed
- [ ] Environment variables secured
- [ ] Error monitoring setup
- [ ] Analytics configured
- [ ] Documentation complete
- [ ] User training materials ready

### Launch Day
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Run database migrations
- [ ] Verify all integrations (Razorpay, Cloudinary)
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Announce launch

### Post-Launch
- [ ] Gather user feedback
- [ ] Monitor metrics daily
- [ ] Fix critical bugs immediately
- [ ] Plan iteration based on feedback
- [ ] Scale infrastructure as needed

---

## 📚 Documentation Requirements

### Technical Documentation
- API documentation (Swagger/OpenAPI)
- Database schema documentation
- Deployment guide
- Development setup guide
- Architecture diagrams

### User Documentation
- User manual (for library members)
- Librarian guide
- Admin guide
- FAQ section
- Video tutorials

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-21  
**Status:** Complete Implementation Plan - Ready for Development
