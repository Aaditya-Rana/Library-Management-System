import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';

describe('BooksController', () => {
    let controller: BooksController;
    let _service: BooksService;

    const mockBooksService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByISBN: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        uploadCoverImage: jest.fn(),
        updateInventory: jest.fn(),
        checkAvailability: jest.fn(),
        getBookStats: jest.fn(),
    };

    const mockBook = {
        id: '1',
        isbn: '1234567890',
        title: 'Test Book',
        author: 'Test Author',
        category: 'Fiction',
        genre: 'Mystery',
        bookValue: 500,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BooksController],
            providers: [
                {
                    provide: BooksService,
                    useValue: mockBooksService,
                },
            ],
        }).compile();

        controller = module.get<BooksController>(BooksController);
        _service = module.get<BooksService>(BooksService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a new book', async () => {
            mockBooksService.create.mockResolvedValue(mockBook);

            const result = await controller.create(mockBook as unknown as any);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBook);
            expect(mockBooksService.create).toHaveBeenCalledWith(mockBook, undefined);
        });

        it('should create a book with cover image', async () => {
            const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
            mockBooksService.create.mockResolvedValue(mockBook);

            const _result = await controller.create(mockBook as unknown as any, mockFile);

            expect(mockBooksService.create).toHaveBeenCalledWith(mockBook, mockFile);
        });
    });

    describe('findAll', () => {
        it('should return paginated books', async () => {
            const paginatedResult = {
                data: [mockBook],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
            mockBooksService.findAll.mockResolvedValue(paginatedResult);

            const result = await controller.findAll({ page: 1, limit: 10 });

            expect(result).toEqual(paginatedResult);
        });
    });

    describe('findByISBN', () => {
        it('should return a book by ISBN', async () => {
            mockBooksService.findByISBN.mockResolvedValue(mockBook);

            const result = await controller.findByISBN('1234567890');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBook);
        });
    });

    describe('findOne', () => {
        it('should return a book by ID', async () => {
            mockBooksService.findOne.mockResolvedValue(mockBook);

            const result = await controller.findOne('1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBook);
        });
    });

    describe('update', () => {
        it('should update a book', async () => {
            const updateDto = { title: 'Updated Title' };
            mockBooksService.update.mockResolvedValue({ ...mockBook, ...updateDto });

            const result = await controller.update('1', updateDto);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Book updated successfully');
        });
    });

    describe('remove', () => {
        it('should delete a book', async () => {
            mockBooksService.remove.mockResolvedValue({
                success: true,
                message: 'Book deleted successfully',
            });

            const result = await controller.remove('1');

            expect(result.success).toBe(true);
        });
    });

    describe('uploadCover', () => {
        it('should upload cover image', async () => {
            const mockFile = { buffer: Buffer.from('test') } as Express.Multer.File;
            mockBooksService.uploadCoverImage.mockResolvedValue({
                secure_url: 'https://cloudinary.com/image.jpg',
                public_id: 'books/image123',
            });
            mockBooksService.update.mockResolvedValue(mockBook);

            const result = await controller.uploadCover('1', mockFile);

            expect(result.success).toBe(true);
            expect(result.data?.url).toBe('https://cloudinary.com/image.jpg');
        });

        it('should return error if no file uploaded', async () => {
            const result = await controller.uploadCover('1', undefined as unknown as Express.Multer.File);

            expect(result.success).toBe(false);
            expect(result.message).toBe('No file uploaded');
        });
    });

    describe('updateInventory', () => {
        it('should update book inventory', async () => {
            mockBooksService.updateInventory.mockResolvedValue({
                ...mockBook,
                totalCopies: 10,
            });

            const result = await controller.updateInventory('1', { quantity: 10 });

            expect(result.success).toBe(true);
            expect(result.message).toBe('Inventory updated successfully');
        });
    });

    describe('getStats', () => {
        it('should return book statistics', async () => {
            const stats = {
                bookId: '1',
                totalCopies: 5,
                availableCopies: 3,
                borrowedCopies: 2,
            };
            mockBooksService.getBookStats.mockResolvedValue(stats);

            const result = await controller.getStats('1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(stats);
        });
    });

    describe('checkAvailability', () => {
        it('should check book availability', async () => {
            mockBooksService.checkAvailability.mockResolvedValue(true);

            const result = await controller.checkAvailability('1');

            expect(result.success).toBe(true);
            expect(result.data.isAvailable).toBe(true);
        });
    });
});
