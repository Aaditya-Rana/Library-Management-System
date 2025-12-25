import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { MockEmailService } from './mocks/mock-email.service';

describe('Notifications E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    let adminToken: string;
    let librarianToken: string;
    let userToken: string;
    let adminId: string;
    let _librarianId: string;
    let userId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(EmailService)
            .useClass(MockEmailService)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        prisma = app.get<PrismaService>(PrismaService);

        await app.init();

        // Clean up test data
        await prisma.notification.deleteMany({
            where: {
                user: {
                    email: {
                        contains: '@notiftest.com',
                    },
                },
            },
        });
        await prisma.transaction.deleteMany({
            where: {
                user: {
                    email: {
                        contains: '@notiftest.com',
                    },
                },
            },
        });
        await prisma.bookCopy.deleteMany({
            where: {
                book: {
                    isbn: {
                        contains: 'NOTIF',
                    },
                },
            },
        });
        await prisma.book.deleteMany({
            where: {
                isbn: {
                    contains: 'NOTIF',
                },
            },
        });
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@notiftest.com',
                },
            },
        });

        // Create test users via register endpoint and activate them
        const adminEmail = `admin${Date.now()}@notiftest.com`;
        const librarianEmail = `librarian${Date.now()}@notiftest.com`;
        const userEmail = `user${Date.now()}@notiftest.com`;
        const password = 'Test123!@#';

        // Register users
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: adminEmail,
                password,
                firstName: 'Admin',
                lastName: 'User',
            });

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: librarianEmail,
                password,
                firstName: 'Librarian',
                lastName: 'User',
            });

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: userEmail,
                password,
                firstName: 'Regular',
                lastName: 'User',
            });

        // Update users to be verified and set roles
        const admin = await prisma.user.update({
            where: { email: adminEmail },
            data: {
                emailVerified: true,
                status: 'ACTIVE',
                role: 'ADMIN',
            },
        });

        const librarian = await prisma.user.update({
            where: { email: librarianEmail },
            data: {
                emailVerified: true,
                status: 'ACTIVE',
                role: 'LIBRARIAN',
            },
        });

        const user = await prisma.user.update({
            where: { email: userEmail },
            data: {
                emailVerified: true,
                status: 'ACTIVE',
            },
        });

        adminId = admin.id;
        _librarianId = librarian.id;
        userId = user.id;

        // Login to get tokens
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: adminEmail,
                password,
            });
        adminToken = adminLogin.body.data.tokens.accessToken;

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: librarianEmail,
                password,
            });
        librarianToken = librarianLogin.body.data.tokens.accessToken;

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: userEmail,
                password,
            });
        userToken = userLogin.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        // Clean up
        await prisma.notification.deleteMany({
            where: {
                user: {
                    email: {
                        contains: '@notiftest.com',
                    },
                },
            },
        });
        await prisma.transaction.deleteMany({
            where: {
                user: {
                    email: {
                        contains: '@notiftest.com',
                    },
                },
            },
        });
        await prisma.bookCopy.deleteMany({
            where: {
                book: {
                    isbn: {
                        contains: 'NOTIF',
                    },
                },
            },
        });
        await prisma.book.deleteMany({
            where: {
                isbn: {
                    contains: 'NOTIF',
                },
            },
        });
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@notiftest.com',
                },
            },
        });

        await prisma.$disconnect();
        await app.close();
    });

    describe('GET /notifications - Get User Notifications', () => {
        it('should return user notifications', async () => {
            // Create a notification for user
            await prisma.notification.create({
                data: {
                    userId,
                    type: 'IN_APP',
                    category: 'BOOK_ISSUED',
                    title: 'Book Issued',
                    message: 'Your book has been issued',
                    sentAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .get('/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toBeDefined();
            expect(Array.isArray(response.body.data.notifications)).toBe(true);
            expect(response.body.data.notifications.length).toBeGreaterThan(0);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should filter notifications by read status', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications?read=false')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notifications).toBeDefined();
        });

        it('should filter notifications by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications?category=BOOK_ISSUED')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should paginate notifications', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications?page=1&limit=5')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/notifications')
                .expect(401);
        });
    });

    describe('GET /notifications/unread-count - Get Unread Count', () => {
        it('should return unread notification count', async () => {
            const response = await request(app.getHttpServer())
                .get('/notifications/unread-count')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.unreadCount).toBeDefined();
            expect(typeof response.body.data.unreadCount).toBe('number');
        });
    });

    describe('PATCH /notifications/:id/read - Mark as Read', () => {
        it('should mark notification as read', async () => {
            // Create unread notification
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type: 'IN_APP',
                    category: 'BOOK_RETURNED',
                    title: 'Book Returned',
                    message: 'Your book has been returned',
                    read: false,
                    sentAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .patch(`/notifications/${notification.id}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('marked as read');
            expect(response.body.data.notification.read).toBe(true);
        });

        it('should fail to mark another user\'s notification', async () => {
            // Create notification for admin
            const notification = await prisma.notification.create({
                data: {
                    userId: adminId,
                    type: 'IN_APP',
                    category: 'PAYMENT_CONFIRMATION',
                    title: 'Payment Received',
                    message: 'Payment confirmed',
                    read: false,
                    sentAt: new Date(),
                },
            });

            await request(app.getHttpServer())
                .patch(`/notifications/${notification.id}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('PATCH /notifications/read-all - Mark All as Read', () => {
        it('should mark all notifications as read', async () => {
            // Create multiple unread notifications
            await prisma.notification.createMany({
                data: [
                    {
                        userId,
                        type: 'IN_APP',
                        category: 'DUE_REMINDER',
                        title: 'Book Due Soon',
                        message: 'Your book is due soon',
                        read: false,
                        sentAt: new Date(),
                    },
                    {
                        userId,
                        type: 'IN_APP',
                        category: 'FINE_NOTICE',
                        title: 'Fine Notice',
                        message: 'You have a pending fine',
                        read: false,
                        sentAt: new Date(),
                    },
                ],
            });

            const response = await request(app.getHttpServer())
                .patch('/notifications/read-all')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('marked as read');
            expect(response.body.data.count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('DELETE /notifications/:id - Delete Notification', () => {
        it('should delete notification', async () => {
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type: 'IN_APP',
                    category: 'BOOK_ISSUED',
                    title: 'Test Notification',
                    message: 'This will be deleted',
                    sentAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .delete(`/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('deleted successfully');

            // Verify deletion
            const deleted = await prisma.notification.findUnique({
                where: { id: notification.id },
            });
            expect(deleted).toBeNull();
        });

        it('should fail to delete another user\'s notification', async () => {
            const notification = await prisma.notification.create({
                data: {
                    userId: adminId,
                    type: 'IN_APP',
                    category: 'BOOK_ISSUED',
                    title: 'Admin Notification',
                    message: 'Admin only',
                    sentAt: new Date(),
                },
            });

            await request(app.getHttpServer())
                .delete(`/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should allow admin to delete any notification', async () => {
            const notification = await prisma.notification.create({
                data: {
                    userId,
                    type: 'IN_APP',
                    category: 'BOOK_ISSUED',
                    title: 'User Notification',
                    message: 'To be deleted by admin',
                    sentAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .delete(`/notifications/${notification.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('Integration with Transactions - Auto Notifications', () => {
        it('should create notification when book is issued', async () => {
            // Create a book and copy
            const book = await prisma.book.create({
                data: {
                    title: 'Notification Test Book',
                    author: 'Test Author',
                    isbn: `NOTIF-${Date.now()}`,
                    publisher: 'Test Publisher',
                    publicationYear: 2024,
                    category: 'Fiction',
                    genre: 'Novel',
                    bookValue: 500,
                    totalCopies: 1,
                    availableCopies: 1,
                    isActive: true,
                },
            });

            await prisma.bookCopy.create({
                data: {
                    bookId: book.id,
                    copyNumber: '001',
                    barcode: `BC-NOTIF-${Date.now()}`,
                    status: 'AVAILABLE',
                },
            });

            // Get initial notification count
            const beforeCount = await prisma.notification.count({
                where: { userId },
            });

            // Issue book
            await request(app.getHttpServer())
                .post('/transactions/issue')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    bookId: book.id,
                    userId,
                })
                .expect(201);

            // Check notification was created
            const afterCount = await prisma.notification.count({
                where: { userId },
            });

            expect(afterCount).toBe(beforeCount + 1);

            // Verify notification details
            const notification = await prisma.notification.findFirst({
                where: {
                    userId,
                    category: 'BOOK_ISSUED',
                },
                orderBy: { createdAt: 'desc' },
            });

            expect(notification).toBeDefined();
            expect(notification?.title).toBe('Book Issued');
            expect(notification?.message).toContain(book.title);
        });

        it('should create notification when book is returned', async () => {
            // Create and issue a book
            const book = await prisma.book.create({
                data: {
                    title: 'Return Test Book',
                    author: 'Test Author',
                    isbn: `NOTIF-RET-${Date.now()}`,
                    publisher: 'Test Publisher',
                    publicationYear: 2024,
                    category: 'Fiction',
                    genre: 'Novel',
                    bookValue: 500,
                    totalCopies: 1,
                    availableCopies: 0,
                    isActive: true,
                },
            });

            const bookCopy = await prisma.bookCopy.create({
                data: {
                    bookId: book.id,
                    copyNumber: '002',
                    barcode: `BC-NOTIF-RET-${Date.now()}`,
                    status: 'ISSUED',
                },
            });

            const transaction = await prisma.transaction.create({
                data: {
                    userId,
                    bookId: book.id,
                    bookCopyId: bookCopy.id,
                    issueDate: new Date(),
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    status: 'ISSUED',
                },
            });

            //Get initial notification count
            const beforeCount = await prisma.notification.count({
                where: { userId, category: 'BOOK_RETURNED' },
            });

            // Return book
            await request(app.getHttpServer())
                .post(`/transactions/${transaction.id}/return`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({})
                .expect(200);

            // Check notification was created
            const afterCount = await prisma.notification.count({
                where: { userId, category: 'BOOK_RETURNED' },
            });

            expect(afterCount).toBe(beforeCount + 1);

            // Verify notification details
            const notification = await prisma.notification.findFirst({
                where: {
                    userId,
                    category: 'BOOK_RETURNED',
                },
                orderBy: { createdAt: 'desc' },
            });

            expect(notification).toBeDefined();
            expect(notification?.title).toBe('Book Returned');
            expect(notification?.message).toContain(book.title);
        });
    });
});
