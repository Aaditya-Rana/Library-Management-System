import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { MockEmailService } from './mocks/mock-email.service';

describe('Borrow Requests E2E Tests', () => {
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

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailService)
            .useClass(MockEmailService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Create test users
        const timestamp = Date.now();
        const adminRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `admin${timestamp}@borrowtest.com`,
                password: 'Test@1234',
                firstName: 'Admin',
                lastName: 'User',
                phone: '1234567890',
            });
        adminId = adminRes.body.data.user.id;

        const librarianRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `librarian${timestamp}@borrowtest.com`,
                password: 'Test@1234',
                firstName: 'Librarian',
                lastName: 'User',
                phone: '1234567891',
            });
        librarianId = librarianRes.body.data.user.id;

        const userRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `user${timestamp}@borrowtest.com`,
                password: 'Test@1234',
                firstName: 'Regular',
                lastName: 'User',
                phone: '1234567892',
            });
        userId = userRes.body.data.user.id;

        // Update roles and activate users
        await prisma.user.update({
            where: { id: adminId },
            data: { role: 'ADMIN', status: 'ACTIVE' },
        });
        await prisma.user.update({
            where: { id: librarianId },
            data: { role: 'LIBRARIAN', status: 'ACTIVE' },
        });
        await prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE' },
        });

        // Get tokens
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: `admin${timestamp}@borrowtest.com`,
                password: 'Test@1234',
            });
        adminToken = adminLogin.body.data.tokens.accessToken;

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: `librarian${timestamp}@borrowtest.com`,
                password: 'Test@1234',
            });
        librarianToken = librarianLogin.body.data.tokens.accessToken;

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: `user${timestamp}@borrowtest.com`,
                password: 'Test@1234',
            });
        userToken = userLogin.body.data.tokens.accessToken;

        // Verify all users' emails to activate them
        const users = await prisma.user.findMany({
            where: {
                id: { in: [adminId, librarianId, userId] },
            },
        });

        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true },
            });
        }

        console.log('User tokens:', { adminToken, librarianToken, userToken });
        console.log('User IDs:', { adminId, librarianId, userId });

        // Create test book
        const book = await prisma.book.create({
            data: {
                isbn: `ISBN-BORROW-${timestamp}`,
                title: 'Test Book for Borrow',
                author: 'Test Author',
                genre: 'Fiction',
                category: 'General',
                bookValue: 500,
                totalCopies: 2,
                availableCopies: 2,
            },
        });
        bookId = book.id;

        // Create book copy
        const copy = await prisma.bookCopy.create({
            data: {
                bookId: book.id,
                copyNumber: '001',
                barcode: `BARCODE-${timestamp}`,
                status: 'AVAILABLE',
                condition: 'GOOD',
            },
        });
        bookCopyId = copy.id;
    });

    afterAll(async () => {
        // Cleanup in correct order to avoid foreign key constraints
        try {
            // Delete borrow requests first
            await prisma.borrowRequest.deleteMany({
                where: { userId },
            });

            // Delete transactions if any
            await prisma.transaction.deleteMany({
                where: { userId },
            });

            // Delete book copies
            if (bookId) {
                await prisma.bookCopy.deleteMany({ where: { bookId } });
                // Delete book
                await prisma.book.delete({ where: { id: bookId } }).catch(() => { });
            }

            // Delete users
            await prisma.user.deleteMany({
                where: {
                    id: { in: [adminId, librarianId, userId] },
                },
            });
        } catch (error) {
            console.error('Cleanup error:', error);
        }

        await app.close();
    });

    describe('POST /transactions/request', () => {
        it('should allow user to create borrow request', async () => {
            const response = await request(app.getHttpServer())
                .post('/transactions/request')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    bookId,
                    notes: 'Need this book for research',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('created successfully');
            expect(response.body.data.borrowRequest).toHaveProperty('id');
            expect(response.body.data.borrowRequest.status).toBe('PENDING');
        });

        it('should not allow duplicate pending request', async () => {
            await request(app.getHttpServer())
                .post('/transactions/request')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ bookId })
                .expect(400);
        });
    });

    describe('GET /transactions/requests', () => {
        it.skip('should allow librarian to list all requests', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions/requests')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.borrowRequests)).toBe(true);
        });

        it.skip('should not allow regular user to list all requests', async () => {
            await request(app.getHttpServer())
                .get('/transactions/requests')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('GET /transactions/requests/my', () => {
        it('should allow user to view their own requests', async () => {
            const response = await request(app.getHttpServer())
                .get('/transactions/requests/my')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.borrowRequests)).toBe(true);
        });
    });

    describe('POST /transactions/requests/:id/approve', () => {
        let requestId: string;

        beforeAll(async () => {
            // Find the pending request
            const requests = await prisma.borrowRequest.findMany({
                where: { userId, status: 'PENDING' },
            });
            if (requests.length > 0) {
                requestId = requests[0].id;
            }
        });

        it('should allow librarian to approve request', async () => {
            if (!requestId) {
                console.log('No pending request found, skipping test');
                return;
            }

            const response = await request(app.getHttpServer())
                .post(`/transactions/requests/${requestId}/approve`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    bookCopyId,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('approved');
        });

        it('should not allow regular user to approve request', async () => {
            await request(app.getHttpServer())
                .post(`/transactions/requests/${requestId}/approve`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ bookCopyId })
                .expect(403);
        });
    });

    describe('POST /transactions/requests/:id/reject', () => {
        let requestId: string;

        beforeAll(async () => {
            // Create a new request to reject
            const req = await prisma.borrowRequest.create({
                data: {
                    user: { connect: { id: userId } },
                    book: { connect: { id: bookId } },
                    status: 'PENDING',
                },
            });
            requestId = req.id;
        });

        it('should allow librarian to reject request', async () => {
            const response = await request(app.getHttpServer())
                .post(`/transactions/requests/${requestId}/reject`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    rejectionReason: 'Book reserved for another user',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('rejected');
        });
    });

    describe('DELETE /transactions/requests/:id', () => {
        let requestId: string;

        beforeAll(async () => {
            const req = await prisma.borrowRequest.create({
                data: {
                    user: { connect: { id: userId } },
                    book: { connect: { id: bookId } },
                    status: 'PENDING',
                },
            });
            requestId = req.id;
        });

        it('should allow user to cancel their own request', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/transactions/requests/${requestId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('cancelled');
        });
    });
});
