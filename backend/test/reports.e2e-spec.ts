import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { MockEmailService } from './mocks/mock-email.service';
import * as bcrypt from 'bcrypt';

describe('Reports E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let librarianToken: string;
    let userToken: string;

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
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        const timestamp = Date.now();

        const admin = await prisma.user.create({
            data: {
                email: `admin${timestamp}@reportstest.com`,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: 'ADMIN',
                status: 'ACTIVE',
                emailVerified: true,
            },
        });

        const librarian = await prisma.user.create({
            data: {
                email: `librarian${timestamp}@reportstest.com`,
                password: hashedPassword,
                firstName: 'Librarian',
                lastName: 'User',
                role: 'LIBRARIAN',
                status: 'ACTIVE',
                emailVerified: true,
            },
        });

        const user = await prisma.user.create({
            data: {
                email: `user${timestamp}@reportstest.com`,
                password: hashedPassword,
                firstName: 'Regular',
                lastName: 'User',
                role: 'USER',
                status: 'ACTIVE',
                emailVerified: true,
            },
        });

        // Login users
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: admin.email, password: 'Test@123' });
        adminToken = adminLogin.body.data.tokens.accessToken;

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: librarian.email, password: 'Test@123' });
        librarianToken = librarianLogin.body.data.tokens.accessToken;

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: user.email, password: 'Test@123' });
        userToken = userLogin.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { email: { contains: '@reportstest.com' } },
        });
        await app.close();
    });

    describe('GET /reports/dashboard', () => {
        it('should return dashboard stats for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/dashboard')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.overview).toBeDefined();
            expect(response.body.data.financial).toBeDefined();
            expect(response.body.data.today).toBeDefined();
        });

        it('should allow librarian access', async () => {
            await request(app.getHttpServer())
                .get('/reports/dashboard')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);
        });

        it('should deny regular user access', async () => {
            await request(app.getHttpServer())
                .get('/reports/dashboard')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('GET /reports/users/active', () => {
        it('should return active users', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/users/active?limit=10')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeDefined();
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });
    });

    describe('GET /reports/users/overdue', () => {
        it('should return overdue users list', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/users/overdue')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.overdueUsers).toBeDefined();
            expect(response.body.data.totalOverdueCount).toBeDefined();
        });
    });

    describe('GET /reports/books/popular', () => {
        it('should return popular books', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/books/popular?limit=5')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.books).toBeDefined();
        });
    });

    describe('GET /reports/books/low-circulation', () => {
        it('should return low circulation books', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/books/low-circulation?limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.books).toBeDefined();
        });
    });

    describe('GET /reports/books/categories', () => {
        it('should return category distribution', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/books/categories')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.categories).toBeDefined();
        });
    });

    describe('GET /reports/circulation', () => {
        it('should return circulation stats', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/circulation?groupBy=month')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.circulation).toBeDefined();
        });
    });

    describe('GET /reports/financial/summary', () => {
        it('should return financial summary for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/reports/financial/summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalRevenue).toBeDefined();
            expect(response.body.data.pendingFines).toBeDefined();
        });

        it('should deny librarian access to financial reports', async () => {
            await request(app.getHttpServer())
                .get('/reports/financial/summary')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(403);
        });
    });
});
