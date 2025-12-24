import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { CloudinaryService } from '../src/common/services/cloudinary.service';
import { MockEmailService } from './mocks/mock-email.service';
import { MockCloudinaryService } from './mocks/mock-cloudinary.service';

describe('Transactions (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let librarianToken: string;
    let userToken: string;
    let adminId: string;
    let librarianId: string;
    let userId: string;
    let bookId: string;
    let bookCopyId: string;
    let transactionId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailService)
            .useClass(MockEmailService)
            .overrideProvider(CloudinaryService)
            .useClass(MockCloudinaryService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                transformOptions: { enableImplicitConversion: true },
            }),
        );
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);

        // Clean up database - ONLY this test's data
        // Delete in correct order: transactions first, then book copies
        await prisma.transaction.deleteMany({
            where: {
                OR: [
                    { user: { email: { contains: '@transtest.com' } } },
                    { bookCopy: { book: { isbn: { startsWith: '97812345' } } } },
                ],
            },
        });
        await prisma.bookCopy.deleteMany({
            where: {
                book: { isbn: { startsWith: '97812345' } },
            },
        });
        await prisma.book.deleteMany({
            where: { isbn: { startsWith: '97812345' } },
        });
        await prisma.user.deleteMany({
            where: { email: { contains: '@transtest.com' } },
        });

        // Create test users
        const adminEmail = `admin${Date.now()}@transtest.com`;
        const librarianEmail = `librarian${Date.now()}@transtest.com`;
        const userEmail = `user${Date.now()}@transtest.com`;

        // Register admin
        const adminRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: adminEmail,
                password: 'Admin@123',
                firstName: 'Admin',
                lastName: 'User',
                phone: '1234567890',
            });
        adminId = adminRes.body.data.user.id;

        // Update admin role
        await prisma.user.update({
            where: { id: adminId },
            data: { role: 'ADMIN', emailVerified: true, status: 'ACTIVE' },
        });

        // Register librarian
        const librarianRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: librarianEmail,
                password: 'Librarian@123',
                firstName: 'Librarian',
                lastName: 'User',
                phone: '1234567891',
            });
        librarianId = librarianRes.body.data.user.id;

        // Update librarian role
        await prisma.user.update({
            where: { id: librarianId },
            data: { role: 'LIBRARIAN', emailVerified: true, status: 'ACTIVE' },
        });

        // Register regular user
        const userRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: userEmail,
                password: 'User@123',
                firstName: 'Regular',
                lastName: 'User',
                phone: '1234567892',
            });
        userId = userRes.body.data.user.id;

        // Update user status
        await prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true, status: 'ACTIVE' },
        });

        // Login users
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: adminEmail, password: 'Admin@123' });
        adminToken = adminLogin.body.data.accessToken;

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: librarianEmail, password: 'Librarian@123' });
        librarianToken = librarianLogin.body.data.accessToken;

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userEmail, password: 'User@123' });
        userToken = userLogin.body.data.accessToken;

        // Create a test book
        const book = await prisma.book.create({
            data: {
                isbn: '9781234567890',
                title: 'Test Book for Transactions',
                author: 'Test Author',
                category: 'Fiction',
                genre: 'Mystery',
                bookValue: 500,
                totalCopies: 5,
                availableCopies: 5,
            },
        });
        bookId = book.id;

        // Create a book copy
        const bookCopy = await prisma.bookCopy.create({
            data: {
                bookId,
                copyNumber: '001',
                barcode: `BC${Date.now()}`,
                status: 'AVAILABLE',
            },
        });
        bookCopyId = bookCopy.id;
    });

    afterAll(async () => {
        // Clean up only this test's data
        // Delete in correct order: transactions first, then book copies
        await prisma.transaction.deleteMany({
            where: {
                OR: [
                    { user: { email: { contains: '@transtest.com' } } },
                    { bookCopy: { book: { isbn: { startsWith: '97812345' } } } },
                ],
            },
        });
        await prisma.bookCopy.deleteMany({
            where: {
                book: { isbn: { startsWith: '97812345' } },
            },
        });
        await prisma.book.deleteMany({
            where: { isbn: { startsWith: '97812345' } },
        });
        await prisma.user.deleteMany({
            where: { email: { contains: '@transtest.com' } },
        });
        await app.close();
    });

    describe('POST /transactions/issue', () => {
        it('should issue a book to a user (librarian)', async () => {
            const response = await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    bookId,
                    userId,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.userId).toBe(userId);
            expect(response.body.data.bookId).toBe(bookId);
            expect(response.body.data.status).toBe('ISSUED');

            transactionId = response.body.data.id;
        });

        it('should fail if user has pending fines', async () => {
            // Create a transaction with fine
            const transWithFine = await prisma.transaction.create({
                data: {
                    userId,
                    bookId,
                    bookCopyId,
                    issueDate: new Date(),
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    status: 'RETURNED',
                    fineAmount: 50,
                    finePaid: false,
                },
            });

            const response = await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    bookId,
                    userId,
                });

            expect(response.status).toBe(403);

            // Clean up
            await prisma.transaction.delete({ where: { id: transWithFine.id } });
        });

        it('should fail if book is not available', async () => {
            // Update book to have 0 copies
            await prisma.book.update({
                where: { id: bookId },
                data: { availableCopies: 0 },
            });

            const response = await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    bookId,
                    userId,
                });

            expect(response.status).toBe(400);

            // Restore
            await prisma.book.update({
                where: { id: bookId },
                data: { availableCopies: 5 },
            });
        });

        it('should fail without proper authorization', async () => {
            const response = await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    bookId,
                    userId,
                });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /transactions', () => {
        it('should return paginated transactions (admin)', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toBeDefined();
            expect(response.body.meta.page).toBe(1);
        });

        it('should filter by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions?status=ISSUED')
                .set('Authorization', `Bearer ${librarianToken}`);

            expect(response.status).toBe(200);
            response.body.data.forEach((trans: any) => {
                expect(trans.status).toBe('ISSUED');
            });
        });
    });

    describe('GET /transactions/:id', () => {
        it('should return transaction details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(transactionId);
        });
    });

    describe('GET /transactions/user/:userId', () => {
        it('should return user transactions', async () => {
            const response = await request(app.getHttpServer())
                .get(`/transactions/user/${userId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
        });
    });

    describe('POST /transactions/:id/renew', () => {
        it('should renew a transaction', async () => {
            const response = await request(app.getHttpServer())
                .post(`/transactions/${transactionId}/renew`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.renewalCount).toBe(1);
        });

        it('should fail if renewal limit reached', async () => {
            // Update transaction to max renewals
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { renewalCount: 2 },
            });

            const response = await request(app.getHttpServer())
                .post(`/transactions/${transactionId}/renew`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(response.status).toBe(400);

            // Restore
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { renewalCount: 1 },
            });
        });
    });

    describe('GET /transactions/:id/calculate-fine', () => {
        it('should calculate fine for overdue transaction', async () => {
            // Make transaction overdue
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { dueDate: new Date('2020-01-01') },
            });

            const response = await request(app.getHttpServer())
                .get(`/transactions/${transactionId}/calculate-fine`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.fineAmount).toBeGreaterThan(0);
            expect(response.body.daysOverdue).toBeGreaterThan(0);

            // Restore
            await prisma.transaction.update({
                where: { id: transactionId },
                data: { dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            });
        });
    });

    describe('POST /transactions/:id/return', () => {
        it('should return a book', async () => {
            const response = await request(app.getHttpServer())
                .post(`/transactions/${transactionId}/return`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    notes: 'Book returned in good condition',
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe('RETURNED');
        });

        it('should fail if already returned', async () => {
            const response = await request(app.getHttpServer())
                .post(`/transactions/${transactionId}/return`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({});

            expect(response.status).toBe(400);
        });
    });

    describe('GET /transactions/overdue', () => {
        it('should return overdue transactions', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions/overdue')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBeDefined();
            expect(response.body.transactions).toBeInstanceOf(Array);
        });
    });

    describe('GET /transactions/stats', () => {
        it('should return transaction statistics', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.totalTransactions).toBeDefined();
            expect(response.body.activeTransactions).toBeDefined();
            expect(response.body.returnedTransactions).toBeDefined();
        });
    });

    describe('Complete workflow', () => {
        it('should handle complete issue-renew-return flow', async () => {
            // Issue
            const issueRes = await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({ bookId, userId });

            expect(issueRes.status).toBe(201);
            const newTransId = issueRes.body.data.id;

            // Renew
            const renewRes = await request(app.getHttpServer())
                .post(`/transactions/${newTransId}/renew`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(renewRes.status).toBe(200);

            // Return
            const returnRes = await request(app.getHttpServer())
                .post(`/transactions/${newTransId}/return`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({ notes: 'Returned' });

            expect(returnRes.status).toBe(200);
            expect(returnRes.body.data.status).toBe('RETURNED');
        });
    });
});
