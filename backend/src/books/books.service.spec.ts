import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { PrismaService } from '../common/services/prisma.service';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('BooksService', () => {
    let service: BooksService;
    let _prismaService: PrismaService;
    let _cloudinaryService: CloudinaryService;

    const mockPrismaService = {
        book: {
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        bookCopy: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        transaction: {
            findFirst: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    const mockCloudinaryService = {
        uploadImage: jest.fn(),
        deleteImage: jest.fn(),
        getImageUrl: jest.fn(),
    };

    const mockBook = {
        id: '1',
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        publisher: 'Test Publisher',
        publicationYear: 2024,
        category: 'Fiction',
        genre: 'Mystery',
        language: 'English',
        totalCopies: 5,
        availableCopies: 3,
        price: 299.99,
        bookValue: 500,
        description: 'Test description',
        coverImageUrl: 'https://example.com/cover.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BooksService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: CloudinaryService,
                    useValue: mockCloudinaryService,
                },
            ],
        }).compile();

        service = module.get<BooksService>(BooksService);
        _prismaService = module.get<PrismaService>(PrismaService);
        _cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return paginated books', async () => {
            const books = [mockBook];
            mockPrismaService.book.findMany.mockResolvedValue(books);
            mockPrismaService.book.count.mockResolvedValue(1);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toEqual(books);
            expect(result.meta).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });

        it('should filter by category', async () => {
            mockPrismaService.book.findMany.mockResolvedValue([mockBook]);
            mockPrismaService.book.count.mockResolvedValue(1);

            await service.findAll({ category: 'Fiction' });

            expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ category: 'Fiction' }),
                }),
            );
        });

        it('should search by title, author, or ISBN', async () => {
            mockPrismaService.book.findMany.mockResolvedValue([mockBook]);
            mockPrismaService.book.count.mockResolvedValue(1);

            await service.findAll({ search: 'test' });

            expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            { title: { contains: 'test', mode: 'insensitive' } },
                            { author: { contains: 'test', mode: 'insensitive' } },
                            { isbn: { contains: 'test' } },
                        ]),
                    }),
                }),
            );
        });

        it('should filter by availability', async () => {
            mockPrismaService.book.findMany.mockResolvedValue([mockBook]);
            mockPrismaService.book.count.mockResolvedValue(1);

            await service.findAll({ availability: 'available' });

            expect(mockPrismaService.book.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        availableCopies: { gt: 0 },
                    }),
                }),
            );
        });
    });

    describe('findOne', () => {
        it('should return a book by ID', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

            const result = await service.findOne('1');

            expect(result).toEqual(mockBook);
            expect(mockPrismaService.book.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });

        it('should throw NotFoundException if book not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByISBN', () => {
        it('should return a book by ISBN', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

            const result = await service.findByISBN('1234567890');

            expect(result).toEqual(mockBook);
        });

        it('should throw NotFoundException if ISBN not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(service.findByISBN('9999999999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        const createBookDto = {
            isbn: '1234567890',
            title: 'New Book',
            author: 'New Author',
            category: 'Fiction',
            genre: 'Mystery',
            bookValue: 500,
        };

        it('should create a new book', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);
            mockPrismaService.book.create.mockResolvedValue(mockBook);

            const result = await service.create(createBookDto);

            expect(result).toEqual(mockBook);
            expect(mockPrismaService.book.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if ISBN already exists', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

            await expect(service.create(createBookDto)).rejects.toThrow(ConflictException);
        });

        it('should upload cover image if provided', async () => {
            const mockFile: any = { mimetype: 'image/jpeg', size: 1024 };
            mockPrismaService.book.findUnique.mockResolvedValue(null);
            mockCloudinaryService.uploadImage.mockResolvedValue({
                secure_url: 'https://cloudinary.com/uploaded.jpg',
            });
            mockPrismaService.book.create.mockResolvedValue({
                ...mockBook,
                coverImageUrl: 'https://cloudinary.com/uploaded.jpg',
            });

            const result = await service.create(createBookDto, mockFile);

            expect(result.coverImageUrl).toBe('https://cloudinary.com/uploaded.jpg');
        });
    });

    describe('update', () => {
        const updateBookDto = {
            title: 'Updated Title',
        };

        it('should update a book', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
            mockPrismaService.book.update.mockResolvedValue({
                ...mockBook,
                ...updateBookDto,
            });

            const result = await service.update('1', updateBookDto);

            expect(result.title).toBe('Updated Title');
        });

        it('should throw NotFoundException if book not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(service.update('999', updateBookDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if updating to existing ISBN', async () => {
            mockPrismaService.book.findUnique
                .mockResolvedValueOnce(mockBook)
                .mockResolvedValueOnce({ ...mockBook, id: '2' });

            await expect(
                service.update('1', { isbn: '9999999999' }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('remove', () => {
        it('should soft delete a book', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
            mockPrismaService.book.update.mockResolvedValue({
                ...mockBook,
                isActive: false,
            });

            const result = await service.remove('1');

            expect(result.success).toBe(true);
            expect(mockPrismaService.book.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { isActive: false },
            });
        });

        it('should throw NotFoundException if book not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(service.remove('999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('uploadCoverImage', () => {
        it('should upload valid image file', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg',
                size: 1024 * 1024, // 1MB
            } as Express.Multer.File;

            mockCloudinaryService.uploadImage.mockResolvedValue({
                secure_url: 'https://cloudinary.com/image.jpg',
            });

            const result = await service.uploadCoverImage(mockFile);

            expect(result.secure_url).toBe('https://cloudinary.com/image.jpg');
        });

        it('should throw BadRequestException for invalid file type', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
                mimetype: 'application/pdf',
                size: 1024,
            } as Express.Multer.File;

            await expect(service.uploadCoverImage(mockFile)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException for file too large', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg',
                size: 10 * 1024 * 1024, // 10MB
            } as Express.Multer.File;

            await expect(service.uploadCoverImage(mockFile)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('updateInventory', () => {
        it('should throw BadRequestException (deprecated)', async () => {
            await expect(service.updateInventory('1', 10)).rejects.toThrow(
                BadRequestException,
            );
            await expect(service.updateInventory('1', 10)).rejects.toThrow(
                /deprecated/i,
            );
        });
    });

    describe('checkAvailability', () => {
        it('should return true if book is available', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

            const result = await service.checkAvailability('1');

            expect(result).toBe(true);
        });

        it('should return false if no copies available', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue({
                ...mockBook,
                availableCopies: 0,
            });

            const result = await service.checkAvailability('1');

            expect(result).toBe(false);
        });

        it('should return false if book is inactive', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue({
                ...mockBook,
                isActive: false,
            });

            const result = await service.checkAvailability('1');

            expect(result).toBe(false);
        });
    });

    describe('addBookCopies', () => {
        it('should add multiple copies successfully', async () => {
            const bookId = '1';
            const dto = { numberOfCopies: 3, shelfLocation: 'A-12', section: 'Fiction' };

            mockPrismaService.book.findUnique.mockResolvedValue({
                ...mockBook,
                copies: [],
            });

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                return callback({
                    bookCopy: {
                        create: jest.fn().mockResolvedValue({
                            id: 'copy-1',
                            copyNumber: '001',
                            barcode: 'BC-12345678-001',
                            status: 'AVAILABLE',
                        }),
                    },
                    book: {
                        update: jest.fn().mockResolvedValue({
                            ...mockBook,
                            totalCopies: 3,
                            availableCopies: 3,
                        }),
                    },
                });
            });

            const result = await service.addBookCopies(bookId, dto);

            expect(result.success).toBe(true);
            expect(result.data.copiesAdded).toBe(3);
        });

        it('should throw NotFoundException if book not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(
                service.addBookCopies('1', { numberOfCopies: 1 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getBookCopies', () => {
        it('should return all copies for a book', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);
            mockPrismaService.bookCopy = {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 'copy-1',
                        copyNumber: '001',
                        barcode: 'BC-001',
                        status: 'AVAILABLE',
                        condition: 'GOOD',
                        transactions: [],
                    },
                ]),
            };

            const result = await service.getBookCopies('1');

            expect(result.success).toBe(true);
            expect(result.data.copies).toHaveLength(1);
        });

        it('should throw NotFoundException if book not found', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(null);

            await expect(service.getBookCopies('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getBookCopyById', () => {
        it('should return copy with transaction history', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 'copy-1',
                    copyNumber: '001',
                    book: mockBook,
                    transactions: [],
                }),
            };

            const result = await service.getBookCopyById('1', 'copy-1');

            expect(result.success).toBe(true);
            expect(result.data.id).toBe('copy-1');
        });

        it('should throw NotFoundException if copy not found', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue(null),
            };

            await expect(service.getBookCopyById('1', 'copy-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('updateBookCopy', () => {
        it('should update copy details', async () => {
            const dto = { shelfLocation: 'B-15', condition: 'FAIR' as any };

            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({ id: 'copy-1' }),
                update: jest.fn().mockResolvedValue({
                    id: 'copy-1',
                    shelfLocation: 'B-15',
                    condition: 'FAIR',
                }),
            };

            const result = await service.updateBookCopy('1', 'copy-1', dto);

            expect(result.success).toBe(true);
            expect(result.data.shelfLocation).toBe('B-15');
        });

        it('should throw NotFoundException if copy not found', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue(null),
            };

            await expect(
                service.updateBookCopy('1', 'copy-1', {}),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateCopyStatus', () => {
        it('should update status and decrement availableCopies', async () => {
            const dto = { status: 'DAMAGED' as any, reason: 'Water damage' };

            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 'copy-1',
                    status: 'AVAILABLE',
                }),
            };

            mockPrismaService.transaction = {
                findFirst: jest.fn().mockResolvedValue(null),
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                return callback({
                    bookCopy: {
                        update: jest.fn().mockResolvedValue({
                            id: 'copy-1',
                            status: 'DAMAGED',
                        }),
                    },
                    book: {
                        update: jest.fn().mockResolvedValue(mockBook),
                    },
                });
            });

            const result = await service.updateCopyStatus('1', 'copy-1', dto);

            expect(result.success).toBe(true);
            expect(result.message).toContain('DAMAGED');
        });

        it('should throw BadRequestException if copy is currently issued', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({ id: 'copy-1', status: 'AVAILABLE' }),
            };

            mockPrismaService.transaction = {
                findFirst: jest.fn().mockResolvedValue({ id: 'trans-1' }),
            };

            await expect(
                service.updateCopyStatus('1', 'copy-1', { status: 'DAMAGED' as any }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('deleteBookCopy', () => {
        it('should delete copy and update counters', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({
                    id: 'copy-1',
                    status: 'AVAILABLE',
                }),
            };

            mockPrismaService.transaction = {
                findFirst: jest.fn().mockResolvedValue(null),
            };

            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                return callback({
                    bookCopy: {
                        delete: jest.fn().mockResolvedValue({ id: 'copy-1' }),
                    },
                    book: {
                        update: jest.fn().mockResolvedValue(mockBook),
                    },
                });
            });

            const result = await service.deleteBookCopy('1', 'copy-1');

            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted');
        });

        it('should throw BadRequestException if copy is currently issued', async () => {
            mockPrismaService.bookCopy = {
                findFirst: jest.fn().mockResolvedValue({ id: 'copy-1' }),
            };

            mockPrismaService.transaction = {
                findFirst: jest.fn().mockResolvedValue({ id: 'trans-1' }),
            };

            await expect(service.deleteBookCopy('1', 'copy-1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getBookStats', () => {
        it('should return book statistics', async () => {
            mockPrismaService.book.findUnique.mockResolvedValue(mockBook);

            const result = await service.getBookStats('1');

            expect(result).toEqual({
                bookId: '1',
                title: 'Test Book',
                totalCopies: 5,
                availableCopies: 3,
                borrowedCopies: 2,
                availabilityPercentage: 60,
                isAvailable: true,
                isActive: true,
            });
        });
    });
});
