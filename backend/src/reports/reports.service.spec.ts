import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../common/services/prisma.service';

describe('ReportsService', () => {
    let service: ReportsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        book: {
            count: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
        },
        user: {
            count: jest.fn(),
            findUnique: jest.fn(),
        },
        transaction: {
            count: jest.fn(),
            aggregate: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
        payment: {
            aggregate: jest.fn(),
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDashboardStats', () => {
        it('should return dashboard statistics', async () => {
            mockPrismaService.book.count.mockResolvedValue(100);
            mockPrismaService.user.count.mockResolvedValue(50);
            mockPrismaService.transaction.count
                .mockResolvedValueOnce(200) // total transactions
                .mockResolvedValueOnce(30) // active transactions
                .mockResolvedValueOnce(10) // overdue transactions
                .mockResolvedValueOnce(5) // today issued
                .mockResolvedValueOnce(3); // today returned
            mockPrismaService.transaction.aggregate.mockResolvedValue({
                _sum: { fineAmount: 500 },
            });
            mockPrismaService.book.aggregate.mockResolvedValue({
                _sum: { availableCopies: 80 },
            });

            const result = await service.getDashboardStats();

            expect(result.success).toBe(true);
            expect(result.data.overview.totalBooks).toBe(100);
            expect(result.data.overview.totalUsers).toBe(50);
            expect(result.data.overview.totalTransactions).toBe(200);
            expect(result.data.overview.activeTransactions).toBe(30);
            expect(result.data.financial.pendingFines).toBe(500);
        });
    });

    describe('getActiveUsers', () => {
        it('should return most active users', async () => {
            const mockGroupBy = [
                { userId: 'user1', _count: { id: 10 } },
                { userId: 'user2', _count: { id: 8 } },
            ];
            const mockUser1 = {
                id: 'user1',
                email: 'user1@test.com',
                firstName: 'User',
                lastName: 'One',
                membershipType: 'PREMIUM',
            };
            const mockUser2 = {
                id: 'user2',
                email: 'user2@test.com',
                firstName: 'User',
                lastName: 'Two',
                membershipType: 'FREE',
            };

            mockPrismaService.transaction.groupBy.mockResolvedValue(mockGroupBy);
            mockPrismaService.user.findUnique
                .mockResolvedValueOnce(mockUser1)
                .mockResolvedValueOnce(mockUser2);

            const result = await service.getActiveUsers({ limit: 10 });

            expect(result.success).toBe(true);
            expect(result.data.users).toHaveLength(2);
            expect(result.data.users[0].transactionCount).toBe(10);
            expect(result.data.users[1].transactionCount).toBe(8);
        });

        it('should filter by date range', async () => {
            mockPrismaService.transaction.groupBy.mockResolvedValue([]);

            await service.getActiveUsers({
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                limit: 5,
            });

            expect(mockPrismaService.transaction.groupBy).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        issueDate: expect.objectContaining({
                            gte: expect.any(Date),
                            lte: expect.any(Date),
                        }),
                    }),
                }),
            );
        });
    });

    describe('getOverdueUsers', () => {
        it('should return users with overdue books', async () => {
            const mockOverdueTransactions = [
                {
                    userId: 'user1',
                    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    fineAmount: 25,
                    user: {
                        id: 'user1',
                        email: 'user1@test.com',
                        firstName: 'User',
                        lastName: 'One',
                        phone: '1234567890',
                    },
                    book: {
                        id: 'book1',
                        title: 'Test Book',
                        author: 'Test Author',
                        isbn: '123456',
                    },
                },
            ];

            mockPrismaService.transaction.findMany.mockResolvedValue(
                mockOverdueTransactions,
            );

            const result = await service.getOverdueUsers();

            expect(result.success).toBe(true);
            expect(result.data.overdueUsers).toHaveLength(1);
            expect(result.data.totalOverdueCount).toBe(1);
            expect(result.data.overdueUsers[0].overdueBooks).toHaveLength(1);
        });
    });

    describe('getPopularBooks', () => {
        it('should return most borrowed books', async () => {
            const mockGroupBy = [
                { bookId: 'book1', _count: { id: 15 } },
                { bookId: 'book2', _count: { id: 10 } },
            ];
            const mockBook = {
                id: 'book1',
                title: 'Popular Book',
                author: 'Test Author',
                isbn: '123456',
                category: 'Fiction',
                genre: 'Mystery',
                coverImageUrl: null,
                availableCopies: 3,
                totalCopies: 5,
            };

            mockPrismaService.transaction.groupBy.mockResolvedValue(mockGroupBy);
            mockPrismaService.book.findUnique
                .mockResolvedValueOnce(mockBook)
                .mockResolvedValueOnce(mockBook);

            const result = await service.getPopularBooks({ limit: 10 });

            expect(result.success).toBe(true);
            expect(result.data.books.length).toBeGreaterThan(0);
        });
    });

    describe('getCirculationStats', () => {
        it('should return circulation statistics grouped by month', async () => {
            const mockTransactions = [
                {
                    issueDate: new Date('2024-01-15'),
                    returnDate: new Date('2024-01-20'),
                    status: 'RETURNED',
                },
                {
                    issueDate: new Date('2024-01-25'),
                    returnDate: null,
                    status: 'ISSUED',
                },
            ];

            mockPrismaService.transaction.findMany.mockResolvedValue(
                mockTransactions,
            );

            const result = await service.getCirculationStats({
                groupBy: 'MONTH' as any,
            });

            expect(result.success).toBe(true);
            expect(result.data.circulation).toBeDefined();
            expect(Array.isArray(result.data.circulation)).toBe(true);
        });
    });

    describe('getFinancialSummary', () => {
        it('should return financial summary', async () => {
            mockPrismaService.payment.aggregate
                .mockResolvedValueOnce({ _sum: { amount: 5000 } })
                .mockResolvedValueOnce({ _sum: { lateFee: 500 } });
            mockPrismaService.payment.groupBy.mockResolvedValue([
                {
                    paymentMethod: 'CASH',
                    _count: { id: 10 },
                    _sum: { amount: 3000 },
                },
            ]);
            mockPrismaService.transaction.aggregate.mockResolvedValue({
                _sum: { fineAmount: 200 },
                _count: { id: 5 },
            });

            const result = await service.getFinancialSummary({});

            expect(result.success).toBe(true);
            expect(result.data.totalRevenue).toBe(5000);
            expect(result.data.totalFinesCollected).toBe(500);
            expect(result.data.pendingFines).toBe(200);
        });
    });

    describe('getCategoryDistribution', () => {
        it('should return book distribution by category', async () => {
            const mockDistribution = [
                {
                    category: 'Fiction',
                    _count: { id: 50 },
                    _sum: { totalCopies: 100, availableCopies: 60 },
                },
                {
                    category: 'Non-Fiction',
                    _count: { id: 30 },
                    _sum: { totalCopies: 50, availableCopies: 25 },
                },
            ];

            mockPrismaService.book.groupBy.mockResolvedValue(mockDistribution);

            const result = await service.getCategoryDistribution();

            expect(result.success).toBe(true);
            expect(result.data.categories).toHaveLength(2);
            expect(result.data.categories[0].category).toBe('Fiction');
            expect(result.data.categories[0].bookCount).toBe(50);
        });
    });

    describe('getLowCirculationBooks', () => {
        it('should return least borrowed books', async () => {
            const mockBooks = [
                {
                    id: 'book1',
                    title: 'Low Circulation Book',
                    author: 'Test Author',
                    isbn: '123456',
                    category: 'Fiction',
                    genre: 'Mystery',
                    totalCopies: 3,
                    availableCopies: 3,
                    _count: { transactions: 1 },
                },
            ];

            mockPrismaService.book.findMany.mockResolvedValue(mockBooks);

            const result = await service.getLowCirculationBooks(10);

            expect(result.success).toBe(true);
            expect(result.data.books).toHaveLength(1);
            expect(result.data.books[0].borrowCount).toBe(1);
        });
    });
});
