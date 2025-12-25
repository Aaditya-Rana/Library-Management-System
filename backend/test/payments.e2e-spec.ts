import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { PaymentMethod, PaymentStatus, UserRole, UserStatus, MembershipType, BookStatus, BookCondition, TransactionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Payments (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let librarianToken: string;
    let userToken: string;
    let adminToken: string;
    let userId: string;
    let transactionId: string;
    let paymentId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Clean up database
        await prisma.payment.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.bookCopy.deleteMany();
        await prisma.book.deleteMany();
        await prisma.user.deleteMany();

        // Create test users
        const hashedPassword = await bcrypt.hash('password123', 10);

        const librarian = await prisma.user.create({
            data: {
                email: 'librarian@test.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'Librarian',
                role: UserRole.LIBRARIAN,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
            },
        });

        const user = await prisma.user.create({
            data: {
                email: 'user@test.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
            },
        });

        const admin = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'Admin',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                membershipType: MembershipType.FREE,
            },
        });

        userId = user.id;

        // Login to get tokens
        const librarianLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'librarian@test.com', password: 'password123' });
        librarianToken = librarianLoginResponse.body.data.tokens.accessToken;

        const userLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user@test.com', password: 'password123' });
        userToken = userLoginResponse.body.data.tokens.accessToken;

        const adminLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@test.com', password: 'password123' });
        adminToken = adminLoginResponse.body.data.tokens.accessToken;

        // Create a test book and transaction
        const book = await prisma.book.create({
            data: {
                isbn: '978-0-123456-78-9',
                title: 'Test Book',
                author: 'Test Author',
                publisher: 'Test Publisher',
                language: 'English',
                genre: 'Fiction',
                category: 'Test',
                totalCopies: 1,
                availableCopies: 0,
                bookValue: 500,
                securityDeposit: 200,
                loanPeriodDays: 14,
                finePerDay: 5,
            },
        });

        const bookCopy = await prisma.bookCopy.create({
            data: {
                bookId: book.id,
                copyNumber: '001',
                barcode: 'TEST-001',
                status: BookStatus.ISSUED,
                condition: BookCondition.GOOD,
            },
        });

        const transaction = await prisma.transaction.create({
            data: {
                userId: user.id,
                bookId: book.id,
                bookCopyId: bookCopy.id,
                issueDate: new Date(),
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                status: TransactionStatus.OVERDUE,
                fineAmount: 25, // 5 days * 5 per day
                finePaid: false,
                damageCharge: 0,
            },
        });

        transactionId = transaction.id;
    });

    afterAll(async () => {
        await prisma.payment.deleteMany();
        await prisma.transaction.deleteMany();
        await prisma.bookCopy.deleteMany();
        await prisma.book.deleteMany();
        await prisma.user.deleteMany();
        await app.close();
    });

    describe('POST /payments/record', () => {
        it('should record a payment as librarian', () => {
            return request(app.getHttpServer())
                .post('/payments/record')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    transactionId,
                    amount: 25,
                    paymentMethod: PaymentMethod.CASH,
                    lateFee: 25,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toBe('Payment recorded successfully');
                    expect(res.body.data.payment).toBeDefined();
                    expect(res.body.data.payment.amount).toBe(25);
                    expect(res.body.data.payment.paymentMethod).toBe(PaymentMethod.CASH);
                    paymentId = res.body.data.payment.id;
                });
        });

        it('should fail to record payment as regular user', () => {
            return request(app.getHttpServer())
                .post('/payments/record')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    transactionId,
                    amount: 25,
                    paymentMethod: PaymentMethod.CASH,
                    lateFee: 25,
                })
                .expect(403);
        });

        it('should fail with invalid transaction ID', () => {
            return request(app.getHttpServer())
                .post('/payments/record')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    transactionId: '00000000-0000-0000-0000-000000000000',
                    amount: 25,
                    paymentMethod: PaymentMethod.CASH,
                    lateFee: 25,
                })
                .expect(404);
        });

        it('should fail with mismatched payment breakdown', () => {
            return request(app.getHttpServer())
                .post('/payments/record')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    transactionId,
                    amount: 50,
                    paymentMethod: PaymentMethod.CASH,
                    lateFee: 25,
                })
                .expect(400);
        });
    });

    describe('GET /payments/:id', () => {
        it('should get payment details as owner', () => {
            return request(app.getHttpServer())
                .get(`/payments/${paymentId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data.payment).toBeDefined();
                    expect(res.body.data.payment.id).toBe(paymentId);
                    expect(res.body.data.payment.user).toBeDefined();
                });
        });

        it('should get payment details as librarian', () => {
            return request(app.getHttpServer())
                .get(`/payments/${paymentId}`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);
        });

        it('should fail with invalid payment ID', () => {
            return request(app.getHttpServer())
                .get('/payments/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });
    });

    describe('GET /payments/user/:userId', () => {
        it('should get user payments as owner', () => {
            return request(app.getHttpServer())
                .get(`/payments/user/${userId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data.payments).toBeDefined();
                    expect(Array.isArray(res.body.data.payments)).toBe(true);
                    expect(res.body.data.pagination).toBeDefined();
                });
        });

        it('should get user payments as librarian', () => {
            return request(app.getHttpServer())
                .get(`/payments/user/${userId}`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);
        });

        it('should support pagination and filtering', () => {
            return request(app.getHttpServer())
                .get(`/payments/user/${userId}`)
                .query({ page: 1, limit: 10, status: PaymentStatus.COMPLETED })
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.pagination.page).toBe(1);
                    expect(res.body.data.pagination.limit).toBe(10);
                });
        });
    });

    describe('GET /payments/transaction/:transactionId', () => {
        it('should get transaction payments', () => {
            return request(app.getHttpServer())
                .get(`/payments/transaction/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data.payments).toBeDefined();
                    expect(res.body.data.summary).toBeDefined();
                    expect(res.body.data.summary.totalPaid).toBe(25);
                    expect(res.body.data.summary.netAmount).toBe(25);
                });
        });

        it('should fail with invalid transaction ID', () => {
            return request(app.getHttpServer())
                .get('/payments/transaction/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });
    });

    describe('POST /payments/:id/refund', () => {
        it('should process refund as admin', () => {
            return request(app.getHttpServer())
                .post(`/payments/${paymentId}/refund`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    refundAmount: 10,
                    refundReason: 'Overpayment',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.message).toBe('Refund processed successfully');
                    expect(res.body.data.payment.refundAmount).toBe(10);
                    expect(res.body.data.payment.paymentStatus).toBe(
                        PaymentStatus.PARTIALLY_REFUNDED,
                    );
                });
        });

        it('should fail to process refund as librarian', () => {
            return request(app.getHttpServer())
                .post(`/payments/${paymentId}/refund`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    refundAmount: 5,
                    refundReason: 'Test',
                })
                .expect(403);
        });

        it('should fail with excessive refund amount', () => {
            return request(app.getHttpServer())
                .post(`/payments/${paymentId}/refund`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    refundAmount: 100,
                    refundReason: 'Test',
                })
                .expect(400);
        });
    });

    describe('GET /payments/transaction/:transactionId/breakdown', () => {
        it('should calculate payment breakdown', () => {
            return request(app.getHttpServer())
                .get(`/payments/transaction/${transactionId}/breakdown`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.success).toBe(true);
                    expect(res.body.data).toBeDefined();
                    expect(res.body.data.fineAmount).toBe(25);
                    expect(res.body.data.totalPaid).toBeDefined();
                    expect(res.body.data.pendingAmount).toBeDefined();
                });
        });
    });
});
