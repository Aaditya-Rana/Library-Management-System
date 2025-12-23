import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Users E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let librarianToken: string;
    let userToken: string;
    let adminUserId: string;
    let regularUserId: string;

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
                    contains: '@userstest.com',
                },
            },
        });

        // Create test users with different roles
        const hashedPassword = await bcrypt.hash('Test123!@#', 10);

        // Create admin user
        const adminUser = await prisma.user.create({
            data: {
                email: `admin${Date.now()}@userstest.com`,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            },
        });
        adminUserId = adminUser.id;

        // Create librarian user
        const librarianUser = await prisma.user.create({
            data: {
                email: `librarian${Date.now()}@userstest.com`,
                password: hashedPassword,
                firstName: 'Librarian',
                lastName: 'User',
                role: UserRole.LIBRARIAN,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            },
        });

        // Create regular user
        const regularUser = await prisma.user.create({
            data: {
                email: `user${Date.now()}@userstest.com`,
                password: hashedPassword,
                firstName: 'Regular',
                lastName: 'User',
                role: UserRole.USER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
            },
        });
        regularUserId = regularUser.id;

        // Login to get tokens
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: adminUser.email,
                password: 'Test123!@#',
            });
        adminToken = adminLogin.body.data.tokens.accessToken;

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: librarianUser.email,
                password: 'Test123!@#',
            });
        librarianToken = librarianLogin.body.data.tokens.accessToken;

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: regularUser.email,
                password: 'Test123!@#',
            });
        userToken = userLogin.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        // Clean up
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@userstest.com',
                },
            },
        });

        await prisma.$disconnect();
        await app.close();
    });

    describe('POST /users - Create User', () => {
        it('should create user as admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `newuser${Date.now()}@userstest.com`,
                    password: 'Test123!@#',
                    firstName: 'New',
                    lastName: 'User',
                    phone: '+919876543210',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User created successfully');
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.email).toBeDefined();
            expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);
        });

        it('should fail to create user with duplicate email', async () => {
            const email = `duplicate${Date.now()}@userstest.com`;

            // Create first user
            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email,
                    password: 'Test123!@#',
                    firstName: 'First',
                    lastName: 'User',
                });

            // Try to create duplicate
            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email,
                    password: 'Test123!@#',
                    firstName: 'Second',
                    lastName: 'User',
                })
                .expect(409);
        });

        it('should fail to create user as regular user', async () => {
            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    email: `unauthorized${Date.now()}@userstest.com`,
                    password: 'Test123!@#',
                    firstName: 'Unauthorized',
                    lastName: 'User',
                })
                .expect(403);
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .post('/users')
                .send({
                    email: `noauth${Date.now()}@userstest.com`,
                    password: 'Test123!@#',
                    firstName: 'No',
                    lastName: 'Auth',
                })
                .expect(401);
        });

        it('should validate email format', async () => {
            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'invalid-email',
                    password: 'Test123!@#',
                    firstName: 'Invalid',
                    lastName: 'Email',
                })
                .expect(400);
        });

        it('should validate password length', async () => {
            await request(app.getHttpServer())
                .post('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `shortpass${Date.now()}@userstest.com`,
                    password: 'short',
                    firstName: 'Short',
                    lastName: 'Pass',
                })
                .expect(400);
        });
    });

    describe('GET /users - List Users', () => {
        it('should list users as admin', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeDefined();
            expect(Array.isArray(response.body.data.users)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should list users as librarian', async () => {
            const response = await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${librarianToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBeDefined();
        });

        it('should fail to list users as regular user', async () => {
            await request(app.getHttpServer())
                .get('/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should filter users by role', async () => {
            const response = await request(app.getHttpServer())
                .get('/users?role=ADMIN')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.users.forEach((user: { role: UserRole }) => {
                expect(user.role).toBe(UserRole.ADMIN);
            });
        });

        it('should filter users by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/users?status=ACTIVE')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.users.forEach((user: { status: UserStatus }) => {
                expect(user.status).toBe(UserStatus.ACTIVE);
            });
        });

        it('should search users by name', async () => {
            const response = await request(app.getHttpServer())
                .get('/users?search=Admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.length).toBeGreaterThan(0);
        });

        it('should paginate users', async () => {
            const response = await request(app.getHttpServer())
                .get('/users?page=1&limit=2')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
            expect(response.body.data.users.length).toBeLessThanOrEqual(2);
        });
    });

    describe('GET /users/me - Get Current User', () => {
        it('should get current user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toBeDefined();
            expect(response.body.data.user.id).toBe(regularUserId);
            expect(response.body.data.user.stats).toBeDefined();
        });

        it('should fail without authentication', async () => {
            await request(app.getHttpServer())
                .get('/users/me')
                .expect(401);
        });
    });

    describe('GET /users/:id - Get User by ID', () => {
        it('should get user by id as admin', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${regularUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe(regularUserId);
        });

        it('should get own profile as regular user', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${regularUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe(regularUserId);
        });

        it('should return own profile when regular user tries to access other user', async () => {
            const response = await request(app.getHttpServer())
                .get(`/users/${adminUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // Should return requesting user's profile instead
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.id).toBe(regularUserId);
        });
    });

    describe('PATCH /users/me - Update Own Profile', () => {
        it('should update own profile', async () => {
            const response = await request(app.getHttpServer())
                .patch('/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    firstName: 'UpdatedFirst',
                    lastName: 'UpdatedLast',
                    phone: '+919999999999',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User updated successfully');
            expect(response.body.data.user.firstName).toBe('UpdatedFirst');
            expect(response.body.data.user.lastName).toBe('UpdatedLast');
        });
    });

    describe('PATCH /users/:id - Update User', () => {
        it('should update user as admin', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${regularUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    firstName: 'AdminUpdated',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.firstName).toBe('AdminUpdated');
        });

        it('should fail to update other user as regular user', async () => {
            await request(app.getHttpServer())
                .patch(`/users/${adminUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    firstName: 'Unauthorized',
                })
                .expect(403);
        });
    });

    describe('POST /users/:id/approve - Approve User', () => {
        it('should approve pending user as admin', async () => {
            // Create pending user
            const hashedPassword = await bcrypt.hash('Test123!@#', 10);

            const pendingUser = await prisma.user.create({
                data: {
                    email: `pending${Date.now()}@userstest.com`,
                    password: hashedPassword,
                    firstName: 'Pending',
                    lastName: 'User',
                    status: UserStatus.PENDING_APPROVAL,
                    emailVerified: true,
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/users/${pendingUser.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User approved successfully');
            expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);
        });

        it('should fail to approve as regular user', async () => {
            await request(app.getHttpServer())
                .post(`/users/${regularUserId}/approve`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('POST /users/:id/suspend - Suspend User', () => {
        it('should suspend user as admin', async () => {
            // Create user to suspend
            const hashedPassword = await bcrypt.hash('Test123!@#', 10);

            const userToSuspend = await prisma.user.create({
                data: {
                    email: `tosuspend${Date.now()}@userstest.com`,
                    password: hashedPassword,
                    firstName: 'To',
                    lastName: 'Suspend',
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/users/${userToSuspend.id}/suspend`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: 'Violation of terms',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User suspended successfully');

            // Verify user is suspended
            const suspendedUser = await prisma.user.findUnique({
                where: { id: userToSuspend.id },
            });
            expect(suspendedUser?.status).toBe(UserStatus.SUSPENDED);
        });

        it('should fail to suspend as regular user', async () => {
            await request(app.getHttpServer())
                .post(`/users/${regularUserId}/suspend`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    reason: 'Unauthorized',
                })
                .expect(403);
        });
    });

    describe('POST /users/:id/activate - Activate User', () => {
        it('should activate suspended user as admin', async () => {
            // Create suspended user
            const hashedPassword = await bcrypt.hash('Test123!@#', 10);

            const suspendedUser = await prisma.user.create({
                data: {
                    email: `suspended${Date.now()}@userstest.com`,
                    password: hashedPassword,
                    firstName: 'Suspended',
                    lastName: 'User',
                    status: UserStatus.SUSPENDED,
                    emailVerified: true,
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/users/${suspendedUser.id}/activate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User activated successfully');
            expect(response.body.data.user.status).toBe(UserStatus.ACTIVE);
        });

        it('should fail to activate as regular user', async () => {
            await request(app.getHttpServer())
                .post(`/users/${regularUserId}/activate`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });

    describe('DELETE /users/:id - Delete User', () => {
        it('should delete user as admin', async () => {
            // Create user to delete
            const hashedPassword = await bcrypt.hash('Test123!@#', 10);

            const userToDelete = await prisma.user.create({
                data: {
                    email: `todelete${Date.now()}@userstest.com`,
                    password: hashedPassword,
                    firstName: 'To',
                    lastName: 'Delete',
                    status: UserStatus.ACTIVE,
                    emailVerified: true,
                },
            });

            const response = await request(app.getHttpServer())
                .delete(`/users/${userToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');

            // Verify user is soft deleted (status = INACTIVE)
            const deletedUser = await prisma.user.findUnique({
                where: { id: userToDelete.id },
            });
            expect(deletedUser?.status).toBe(UserStatus.INACTIVE);
        });

        it('should fail to delete own account', async () => {
            await request(app.getHttpServer())
                .delete(`/users/${adminUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);
        });

        it('should fail to delete as regular user', async () => {
            await request(app.getHttpServer())
                .delete(`/users/${regularUserId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });
    });
});
