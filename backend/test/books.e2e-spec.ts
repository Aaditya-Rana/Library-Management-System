import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/services/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { CloudinaryService } from '../src/common/services/cloudinary.service';
import { MockEmailService } from './mocks/mock-email.service';
import { MockCloudinaryService } from './mocks/mock-cloudinary.service';

describe('Books E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let adminToken: string;
    let librarianToken: string;
    let userToken: string;
    let createdBookId: string;

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
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        prisma = app.get(PrismaService);

        // Clean up test data
        await prisma.book.deleteMany({
            where: {
                isbn: {
                    startsWith: '9999',
                },
            },
        });

        // Create test users and get tokens
        const adminRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `admin${Date.now()}@bookstest.com`,
                password: 'Admin123!',
                firstName: 'Admin',
                lastName: 'User',
            });

        const librarianRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `librarian${Date.now()}@bookstest.com`,
                password: 'Librarian123!',
                firstName: 'Librarian',
                lastName: 'User',
            });

        const userRes = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: `user${Date.now()}@bookstest.com`,
                password: 'User123!',
                firstName: 'Regular',
                lastName: 'User',
            });

        // Update roles
        await prisma.user.update({
            where: { id: adminRes.body.data.user.id },
            data: { role: 'ADMIN', status: 'ACTIVE', emailVerified: true },
        });

        await prisma.user.update({
            where: { id: librarianRes.body.data.user.id },
            data: { role: 'LIBRARIAN', status: 'ACTIVE', emailVerified: true },
        });

        await prisma.user.update({
            where: { id: userRes.body.data.user.id },
            data: { status: 'ACTIVE', emailVerified: true },
        });

        // Login to get tokens
        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: adminRes.body.data.user.email,
                password: 'Admin123!',
            });

        const librarianLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: librarianRes.body.data.user.email,
                password: 'Librarian123!',
            });

        const userLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: userRes.body.data.user.email,
                password: 'User123!',
            });

        adminToken = adminLogin.body.data.tokens.accessToken;
        librarianToken = librarianLogin.body.data.tokens.accessToken;
        userToken = userLogin.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        // Clean up
        await prisma.book.deleteMany({
            where: {
                isbn: {
                    startsWith: '9999',
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: '@bookstest.com',
                },
            },
        });

        await app.close();
    });

    describe('POST /books - Create Book', () => {
        it('should create a book as admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isbn: '9999999991',
                    title: 'Test Book 1',
                    author: 'Test Author',
                    publisher: 'Test Publisher',
                    publicationYear: 2024,
                    category: 'Fiction',
                    genre: 'Mystery',
                    language: 'English',
                    price: 299.99,
                    bookValue: 500,
                    description: 'A test book',
                });

            if (response.status !== 201) {
                console.error('Book creation failed:', response.status, response.body);
            }

            expect(response.status).toBe(201);
            expect(response.body.data.isbn).toBe('9999999991');
            expect(response.body.data.totalCopies).toBe(0);
            expect(response.body.data.availableCopies).toBe(0);
            createdBookId = response.body.data.id;
        });

        it('should create a book as librarian', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    isbn: '9999999992',
                    title: 'Test Book 2',
                    author: 'Test Author 2',
                    category: 'Non-Fiction',
                    genre: 'Biography',
                    bookValue: 400,
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should fail to create book as regular user', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    isbn: '9999999993',
                    title: 'Test Book 3',
                    author: 'Test Author 3',
                    category: 'Fiction',
                    genre: 'Thriller',
                    bookValue: 450,
                });

            expect(response.status).toBe(403);
        });

        it('should fail without authentication', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .send({
                    isbn: '9999999994',
                    title: 'Test Book 4',
                    author: 'Test Author 4',
                    category: 'Fiction',
                    genre: 'Romance',
                    bookValue: 350,
                });

            expect(response.status).toBe(401);
        });

        it('should fail with duplicate ISBN', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isbn: '9999999991', // Duplicate
                    title: 'Duplicate Book',
                    author: 'Test Author',
                    category: 'Fiction',
                    genre: 'Mystery',
                    bookValue: 500,
                });

            expect(response.status).toBe(409);
        });

        it('should validate ISBN format', async () => {
            const response = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isbn: '123', // Invalid ISBN
                    title: 'Invalid ISBN Book',
                    author: 'Test Author',
                    category: 'Fiction',
                    genre: 'Mystery',
                    bookValue: 500,
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /books/bulk-import - Bulk Import Books', () => {
        it('should bulk import books as admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/books/bulk-import')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    books: [
                        {
                            isbn: '9999999995',
                            title: 'Bulk Import Book 1',
                            author: 'Test Author',
                            category: 'Fiction',
                            genre: 'Scifi',
                            bookValue: 500,
                        },
                        {
                            isbn: '9999999996',
                            title: 'Bulk Import Book 2',
                            author: 'Test Author 2',
                            category: 'Non-Fiction',
                            genre: 'History',
                            bookValue: 450,
                        },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.imported).toBe(2);
            expect(response.body.data.failed).toBe(0);
            expect(response.body.data.successfulBooks).toHaveLength(2);
        });

        it('should handle partial failures in bulk import', async () => {
            const response = await request(app.getHttpServer())
                .post('/books/bulk-import')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    books: [
                        {
                            isbn: '9999999997',
                            title: 'New Book',
                            author: 'Author',
                            category: 'Fiction',
                            genre: 'Mystery',
                            bookValue: 400,
                        },
                        {
                            isbn: '9999999995', // Duplicate ISBN
                            title: 'Duplicate',
                            author: 'Author',
                            category: 'Fiction',
                            genre: 'Mystery',
                            bookValue: 400,
                        },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.data.imported).toBe(1);
            expect(response.body.data.failed).toBe(1);
            expect(response.body.data.failedBooks[0].error).toContain('already exists');
        });

        it('should bulk import as librarian', async () => {
            const response = await request(app.getHttpServer())
                .post('/books/bulk-import')
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    books: [
                        {
                            isbn: '9999999998',
                            title: 'Librarian Bulk Book',
                            author: 'Test Author',
                            category: 'Fiction',
                            genre: 'Romance',
                            bookValue: 350,
                        },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('should fail bulk import as regular user', async () => {
            const response = await request(app.getHttpServer())
                .post('/books/bulk-import')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    books: [
                        {
                            isbn: '9999999999',
                            title: 'User Book',
                            author: 'Test',
                            category: 'Fiction',
                            genre: 'Mystery',
                            bookValue: 300,
                        },
                    ],
                });

            expect(response.status).toBe(403);
        });

        it('should validate bulk import request', async () => {
            const response = await request(app.getHttpServer())
                .post('/books/bulk-import')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    books: [], // Empty array
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /books - List Books', () => {
        it('should list all books', async () => {
            const response = await request(app.getHttpServer())
                .get('/books')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.meta).toBeDefined();
        });

        it('should filter books by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/books?category=Fiction')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            response.body.data.forEach((book: { category: string }) => {
                expect(book.category).toBe('Fiction');
            });
        });

        it('should search books by title', async () => {
            const response = await request(app.getHttpServer())
                .get('/books?search=Test Book 1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should paginate results', async () => {
            const response = await request(app.getHttpServer())
                .get('/books?page=1&limit=1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.limit).toBe(1);
        });

        it('should sort books', async () => {
            const response = await request(app.getHttpServer())
                .get('/books?sortBy=title&sortOrder=asc')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('GET /books/:id - Get Book by ID', () => {
        it('should get a book by ID', async () => {
            const response = await request(app.getHttpServer())
                .get(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(createdBookId);
        });

        it('should return 404 for non-existent book', async () => {
            const response = await request(app.getHttpServer())
                .get('/books/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('GET /books/isbn/:isbn - Get Book by ISBN', () => {
        it('should get a book by ISBN', async () => {
            const response = await request(app.getHttpServer())
                .get('/books/isbn/9999999991')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.isbn).toBe('9999999991');
        });

        it('should return 404 for non-existent ISBN', async () => {
            const response = await request(app.getHttpServer())
                .get('/books/isbn/0000000000')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /books/:id - Update Book', () => {
        it('should update a book as admin', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Updated Test Book',
                    price: 399.99,
                });

            expect(response.status).toBe(200);
            expect(response.body.data.title).toBe('Updated Test Book');
        });

        it('should update a book as librarian', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${librarianToken}`)
                .send({
                    description: 'Updated description',
                });

            expect(response.status).toBe(200);
        });

        it('should fail to update as regular user', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    title: 'Unauthorized Update',
                });

            expect(response.status).toBe(403);
        });
    });

    describe('PATCH /books/:id/inventory - Update Inventory (Deprecated)', () => {
        it('should throw 400 error (deprecated)', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/books/${createdBookId}/inventory`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    quantity: 10,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(/deprecated/i);
        });
    });

    describe('GET /books/:id/stats - Get Book Stats', () => {
        it('should get book statistics', async () => {
            const response = await request(app.getHttpServer())
                .get(`/books/${createdBookId}/stats`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('totalCopies');
            expect(response.body.data).toHaveProperty('availableCopies');
            expect(response.body.data).toHaveProperty('borrowedCopies');
        });
    });

    describe('GET /books/:id/availability - Check Availability', () => {
        it('should check book availability', async () => {
            const response = await request(app.getHttpServer())
                .get(`/books/${createdBookId}/availability`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('isAvailable');
        });
    });

    describe('DELETE /books/:id - Delete Book', () => {
        it('should fail to delete as librarian', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${librarianToken}`);

            expect(response.status).toBe(403);
        });

        it('should fail to delete as regular user', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });

        it('should delete a book as admin', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/books/${createdBookId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should verify book is soft deleted', async () => {
            const book = await prisma.book.findUnique({
                where: { id: createdBookId },
            });

            expect(book?.isActive).toBe(false);
        });
    });

    describe('BookCopy Management', () => {
        let testBookId: string;
        let copyId: string;

        beforeAll(async () => {
            // Create a book for copy management tests
            const bookRes = await request(app.getHttpServer())
                .post('/books')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isbn: '9999999999',
                    title: 'Copy Management Test Book',
                    author: 'Test Author',
                    category: 'Fiction',
                    genre: 'Test',
                    bookValue: 500,
                });
            testBookId = bookRes.body.data.id;
        });

        describe('POST /books/:id/copies - Add Copies', () => {
            it('should add copies as admin', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/books/${testBookId}/copies`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        numberOfCopies: 3,
                        shelfLocation: 'A-12',
                        section: 'Fiction',
                    });

                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
                expect(response.body.data.copiesAdded).toBe(3);
                expect(response.body.data.totalCopies).toBe(3);
                expect(response.body.data.availableCopies).toBe(3);
                expect(response.body.data.copies).toHaveLength(3);
                copyId = response.body.data.copies[0].id;
            });

            it('should add copies as librarian', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/books/${testBookId}/copies`)
                    .set('Authorization', `Bearer ${librarianToken}`)
                    .send({
                        numberOfCopies: 2,
                    });

                expect(response.status).toBe(201);
                expect(response.body.data.copiesAdded).toBe(2);
            });

            it('should fail as regular user', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/books/${testBookId}/copies`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({
                        numberOfCopies: 1,
                    });

                expect(response.status).toBe(403);
            });
        });

        describe('GET /books/:id/copies - List Copies', () => {
            it('should list all copies', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/books/${testBookId}/copies`)
                    .set('Authorization', `Bearer ${librarianToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.copies).toHaveLength(5); // 3 + 2 from previous tests
            });
        });

        describe('GET /books/:bookId/copies/:copyId - Get Copy Details', () => {
            it('should get copy details', async () => {
                const response = await request(app.getHttpServer())
                    .get(`/books/${testBookId}/copies/${copyId}`)
                    .set('Authorization', `Bearer ${librarianToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.id).toBe(copyId);
                expect(response.body.data.transactionHistory).toBeDefined();
            });
        });

        describe('PATCH /books/:bookId/copies/:copyId - Update Copy', () => {
            it('should update copy metadata', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/books/${testBookId}/copies/${copyId}`)
                    .set('Authorization', `Bearer ${librarianToken}`)
                    .send({
                        shelfLocation: 'B-15',
                        condition: 'FAIR',
                        conditionNotes: 'Minor wear',
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.shelfLocation).toBe('B-15');
                expect(response.body.data.condition).toBe('FAIR');
            });
        });

        describe('PATCH /books/:bookId/copies/:copyId/status - Update Status', () => {
            it('should mark copy as DAMAGED', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/books/${testBookId}/copies/${copyId}/status`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'DAMAGED',
                        reason: 'Water damage',
                        notes: 'Pages 10-20 damaged',
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.status).toBe('DAMAGED');
            });

            it('should verify availableCopies decreased', async () => {
                const bookRes = await request(app.getHttpServer())
                    .get(`/books/${testBookId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(bookRes.body.data.availableCopies).toBe(4); // 5 - 1 damaged
            });

            it('should mark copy back as AVAILABLE', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/books/${testBookId}/copies/${copyId}/status`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        status: 'AVAILABLE',
                        reason: 'Repaired',
                    });

                expect(response.status).toBe(200);
                expect(response.body.data.status).toBe('AVAILABLE');
            });
        });

        describe('DELETE /books/:bookId/copies/:copyId - Delete Copy', () => {
            it('should delete copy as admin', async () => {
                const response = await request(app.getHttpServer())
                    .delete(`/books/${testBookId}/copies/${copyId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            it('should verify counters updated', async () => {
                const bookRes = await request(app.getHttpServer())
                    .get(`/books/${testBookId}`)
                    .set('Authorization', `Bearer ${adminToken}`);

                expect(bookRes.body.data.totalCopies).toBe(4); // 5 - 1 deleted
                expect(bookRes.body.data.availableCopies).toBe(4);
            });

            it('should fail as librarian', async () => {
                const copies = await request(app.getHttpServer())
                    .get(`/books/${testBookId}/copies`)
                    .set('Authorization', `Bearer ${librarianToken}`);

                const anotherCopyId = copies.body.data.copies[0].id;

                const response = await request(app.getHttpServer())
                    .delete(`/books/${testBookId}/copies/${anotherCopyId}`)
                    .set('Authorization', `Bearer ${librarianToken}`);

                expect(response.status).toBe(403); // Only ADMIN can delete
            });
        });
    });
});
