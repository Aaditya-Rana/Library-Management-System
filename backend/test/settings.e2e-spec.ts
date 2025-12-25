import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { MockEmailService } from './mocks/mock-email.service';
import { SettingsService } from '../src/settings/settings.service';
import * as bcrypt from 'bcrypt';

describe('Settings E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let settingsService: SettingsService;
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
        settingsService = app.get<SettingsService>(SettingsService);

        // Seed default settings
        await settingsService.seedDefaultSettings();

        // Create test users
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        const timestamp = Date.now();

        const admin = await prisma.user.create({
            data: {
                email: `admin${timestamp}@settingstest.com`,
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
                email: `librarian${timestamp}@settingstest.com`,
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
                email: `user${timestamp}@settingstest.com`,
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
            where: { email: { contains: '@settingstest.com' } },
        });
        await app.close();
    });

    describe('GET /settings', () => {
        it('should return all settings for admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/settings')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.settings).toBeDefined();
            expect(Array.isArray(response.body.data.settings)).toBe(true);
            expect(response.body.data.settings.length).toBeGreaterThan(0);
        });

        it('should allow librarian to view settings', async () => {
            await request(app.getHttpServer())
                .get('/settings')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);
        });

        it('should deny regular user access', async () => {
            await request(app.getHttpServer())
                .get('/settings')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should filter settings by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/settings?category=LIBRARY')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            const settings = response.body.data.settings;
            settings.forEach((setting) => {
                expect(setting.category).toBe('LIBRARY');
            });
        });
    });

    describe('GET /settings/:key', () => {
        it('should return a specific setting', async () => {
            const response = await request(app.getHttpServer())
                .get('/settings/library.name')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.setting.key).toBe('library.name');
            expect(response.body.data.setting.value).toBeDefined();
        });

        it('should return 404 for non-existent key', async () => {
            await request(app.getHttpServer())
                .get('/settings/invalid.key')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });

    describe('PATCH /settings/:key', () => {
        it('should update a setting value', async () => {
            const response = await request(app.getHttpServer())
                .patch('/settings/library.name')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: 'Updated Library Name' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Setting updated successfully');
            expect(response.body.data.setting.value).toBe('Updated Library Name');
        });

        it('should update a numeric setting', async () => {
            const response = await request(app.getHttpServer())
                .patch('/settings/fines.per_day_amount')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: 10 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.setting.value).toBe(10);
        });

        it('should update a boolean setting', async () => {
            const response = await request(app.getHttpServer())
                .patch('/settings/system.email_notifications')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: false })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.setting.value).toBe(false);
        });

        it('should deny librarian from updating settings', async () => {
            await request(app.getHttpServer())
                .patch('/settings/library.name')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({ value: 'Test' })
                .expect(403);
        });

        it('should validate value type', async () => {
            await request(app.getHttpServer())
                .patch('/settings/fines.per_day_amount')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: 'invalid' })
                .expect(400);
        });
    });

    describe('POST /settings/:key/reset', () => {
        it('should reset a setting to default value', async () => {
            // First update it
            await request(app.getHttpServer())
                .patch('/settings/library.phone')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ value: 'Changed Phone' })
                .expect(200);

            // Then reset it
            const response = await request(app.getHttpServer())
                .post('/settings/library.phone/reset')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Setting reset to default successfully');
            expect(response.body.data.setting.value).toBe('+1-234-567-8900');
        });

        it('should deny librarian from resetting settings', async () => {
            await request(app.getHttpServer())
                .post('/settings/library.name/reset')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(403);
        });
    });
});
