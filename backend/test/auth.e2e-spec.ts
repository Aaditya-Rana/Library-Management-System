import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import * as crypto from 'crypto';

describe('Auth E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

        prisma = app.get<PrismaService>(PrismaService);

        await app.init();

        // Clean up test data
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@e2etest.com',
                },
            },
        });
    });

    afterAll(async () => {
        // Clean up
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@e2etest.com',
                },
            },
        });

        await app.close();
    });

    describe('Email Verification Flow', () => {
        let userEmail: string;

        it('should register user and send verification email', async () => {
            userEmail = `test${Date.now()}@e2etest.com`;

            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: userEmail,
                    password: 'Test123!@#',
                    firstName: 'Test',
                    lastName: 'User',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('verify your account');
            expect(response.body.data.user.emailVerified).toBe(false);

            // Get verification token from database
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            expect(user).toBeDefined();
            expect(user?.emailVerificationToken).toBeDefined();
            expect(user?.emailVerificationExpiry).toBeDefined();
        });

        it('should verify email with valid token', async () => {
            // Get user and generate token (simulating email link)
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            if (!user) {
                throw new Error('User not found');
            }

            // For testing, we need to create a valid token
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(rawToken)
                .digest('hex');

            // Update user with our test token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerificationToken: hashedToken,
                    emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/auth/verify-email?token=${rawToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('verified successfully');

            // Verify user is now verified
            const verifiedUser = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            expect(verifiedUser?.emailVerified).toBe(true);
            expect(verifiedUser?.emailVerificationToken).toBeNull();
            expect(verifiedUser?.emailVerificationExpiry).toBeNull();
        });

        it('should fail with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/auth/verify-email?token=invalid-token')
                .expect(400);
        });

        it('should fail with expired token', async () => {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto
                .createHash('sha256')
                .update(rawToken)
                .digest('hex');

            const testEmail = `expired${Date.now()}@e2etest.com`;

            // Create user with expired token
            await prisma.user.create({
                data: {
                    email: testEmail,
                    password: 'hashedpass',
                    firstName: 'Test',
                    lastName: 'User',
                    emailVerificationToken: hashedToken,
                    emailVerificationExpiry: new Date(Date.now() - 1000), // Expired
                },
            });

            await request(app.getHttpServer())
                .get(`/auth/verify-email?token=${rawToken}`)
                .expect(400);
        });

        it('should resend verification email', async () => {
            const newEmail = `resend${Date.now()}@e2etest.com`;

            // Create unverified user
            await prisma.user.create({
                data: {
                    email: newEmail,
                    password: 'hashedpass',
                    firstName: 'Test',
                    lastName: 'User',
                    emailVerified: false,
                },
            });

            const response = await request(app.getHttpServer())
                .post('/auth/resend-verification')
                .send({ email: newEmail })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('sent successfully');

            // Verify token was created
            const user = await prisma.user.findUnique({
                where: { email: newEmail },
            });

            expect(user?.emailVerificationToken).toBeDefined();
            expect(user?.emailVerificationExpiry).toBeDefined();
        });

        it('should fail to resend for already verified email', async () => {
            const verifiedEmail = `verified${Date.now()}@e2etest.com`;

            await prisma.user.create({
                data: {
                    email: verifiedEmail,
                    password: 'hashedpass',
                    firstName: 'Test',
                    lastName: 'User',
                    emailVerified: true,
                },
            });

            await request(app.getHttpServer())
                .post('/auth/resend-verification')
                .send({ email: verifiedEmail })
                .expect(400);
        });

        it('should not reveal if email does not exist when resending', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/resend-verification')
                .send({ email: 'nonexistent@e2etest.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('If the email exists');
        });
    });

    describe('Login with Email Verification', () => {
        it('should allow login after email verification', async () => {
            const loginEmail = `login${Date.now()}@e2etest.com`;
            const password = 'Test123!@#';

            // Register user
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: loginEmail,
                    password,
                    firstName: 'Test',
                    lastName: 'User',
                });

            // Verify email and activate account
            const user = await prisma.user.findUnique({
                where: { email: loginEmail },
            });

            if (!user) {
                throw new Error('User not found');
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    status: 'ACTIVE', // Also activate account
                },
            });

            // Login should work
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: loginEmail,
                    password,
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.tokens).toBeDefined();
            expect(response.body.data.tokens.accessToken).toBeDefined();
        });
    });
});
