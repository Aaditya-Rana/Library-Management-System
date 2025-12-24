import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../common/services/prisma.service';
import { BooksService } from '../books/books.service';
import {
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { TransactionStatus, PaymentMethod } from '@prisma/client';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let _prismaService: PrismaService;
    let _booksService: BooksService;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
        },
        transaction: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            aggregate: jest.fn(),
        },
        bookCopy: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        book: {
            update: jest.fn(),
        },
        payment: {
            create: jest.fn(),
        },
    };

    const mockBooksService = {
        findOne: jest.fn(),
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        status: 'ACTIVE',
    };

    const mockBook = {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        isActive: true,
        availableCopies: 5,
        loanPeriodDays: 14,
        finePerDay: 5,
        maxRenewals: 2,
    };

    const mockBookCopy = {
        id: 'copy-1',
        bookId: 'book-1',
        copyNumber: '001',
        barcode: 'BC001',
        status: 'AVAILABLE',
        condition: 'GOOD',
    };

    const mockTransaction = {
        id: 'trans-1',
        userId: 'user-1',
        bookId: 'book-1',
        bookCopyId: 'copy-1',
        issueDate: new Date('2024-01-01'),
        dueDate: new Date('2024-01-15'),
        returnDate: null,
        status: TransactionStatus.ISSUED,
        renewalCount: 0,
        fineAmount: 0,
        finePaid: false,
        damageCharge: 0,
        isHomeDelivery: false,
        book: mockBook,
        user: mockUser,
        bookCopy: mockBookCopy,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: BooksService,
                    useValue: mockBooksService,
                },
            ],
        }).compile();

        service = module.get<TransactionsService>(TransactionsService);
        _prismaService = module.get<PrismaService>(PrismaService);
        _booksService = module.get<BooksService>(BooksService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('issueBook', () => {
        const issueBookDto = {
            bookId: 'book-1',
            userId: 'user-1',
        };

        it('should issue a book successfully', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.transaction.findFirst.mockResolvedValue(null);
            mockBooksService.findOne.mockResolvedValue(mockBook);
            mockPrismaService.bookCopy.findFirst.mockResolvedValue(mockBookCopy);
            mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);
            mockPrismaService.bookCopy.update.mockResolvedValue(mockBookCopy);
            mockPrismaService.book.update.mockResolvedValue(mockBook);

            const result = await service.issueBook(issueBookDto);

            expect(result).toEqual(mockTransaction);
            expect(mockPrismaService.transaction.create).toHaveBeenCalled();
            expect(mockPrismaService.bookCopy.update).toHaveBeenCalled();
            expect(mockPrismaService.book.update).toHaveBeenCalled();
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            await expect(service.issueBook(issueBookDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if user is not active', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                ...mockUser,
                status: 'SUSPENDED',
            });

            await expect(service.issueBook(issueBookDto)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw ForbiddenException if user has pending fines', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.transaction.findFirst.mockResolvedValue({
                fineAmount: 50,
                finePaid: false,
            });

            await expect(service.issueBook(issueBookDto)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should throw BadRequestException if book is not active', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.transaction.findFirst.mockResolvedValue(null);
            mockBooksService.findOne.mockResolvedValue({
                ...mockBook,
                isActive: false,
            });

            await expect(service.issueBook(issueBookDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException if no copies available', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
            mockPrismaService.transaction.findFirst.mockResolvedValue(null);
            mockBooksService.findOne.mockResolvedValue({
                ...mockBook,
                availableCopies: 0,
            });

            await expect(service.issueBook(issueBookDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('returnBook', () => {
        const returnBookDto = {
            notes: 'Book returned in good condition',
        };

        it('should return a book successfully', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
            mockPrismaService.transaction.update.mockResolvedValue({
                ...mockTransaction,
                status: TransactionStatus.RETURNED,
                returnDate: new Date(),
            });
            mockPrismaService.bookCopy.update.mockResolvedValue(mockBookCopy);
            mockPrismaService.book.update.mockResolvedValue(mockBook);

            const result = await service.returnBook('trans-1', returnBookDto);

            expect(result.status).toBe(TransactionStatus.RETURNED);
            expect(mockPrismaService.bookCopy.update).toHaveBeenCalled();
            expect(mockPrismaService.book.update).toHaveBeenCalled();
        });

        it('should calculate fine for overdue return', async () => {
            const overdueTransaction = {
                ...mockTransaction,
                dueDate: new Date('2024-01-01'),
            };
            mockPrismaService.transaction.findUnique.mockResolvedValue(
                overdueTransaction,
            );
            mockPrismaService.transaction.update.mockResolvedValue({
                ...overdueTransaction,
                status: TransactionStatus.RETURNED,
                fineAmount: 50,
            });
            mockPrismaService.bookCopy.update.mockResolvedValue(mockBookCopy);
            mockPrismaService.book.update.mockResolvedValue(mockBook);

            const result = await service.returnBook('trans-1', returnBookDto);

            expect(result.fineAmount).toBeGreaterThan(0);
        });

        it('should throw NotFoundException if transaction not found', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(null);

            await expect(
                service.returnBook('invalid-id', returnBookDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if already returned', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                status: TransactionStatus.RETURNED,
            });

            await expect(
                service.returnBook('trans-1', returnBookDto),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('renewTransaction', () => {
        const renewDto = {};

        it('should renew a transaction successfully', async () => {
            const futureTransaction = {
                ...mockTransaction,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            };
            mockPrismaService.transaction.findUnique.mockResolvedValue(futureTransaction);
            mockPrismaService.transaction.update.mockResolvedValue({
                ...futureTransaction,
                renewalCount: 1,
                status: TransactionStatus.RENEWED,
            });

            const result = await service.renewTransaction('trans-1', renewDto, 'user-1');

            expect(result.renewalCount).toBe(1);
            expect(result.status).toBe(TransactionStatus.RENEWED);
        });

        it('should throw ForbiddenException if user does not own transaction', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

            await expect(
                service.renewTransaction('trans-1', renewDto, 'other-user'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException if renewal limit reached', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                renewalCount: 2,
            });

            await expect(
                service.renewTransaction('trans-1', renewDto, 'user-1'),
            ).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if transaction is overdue', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                dueDate: new Date('2020-01-01'),
            });

            await expect(
                service.renewTransaction('trans-1', renewDto, 'user-1'),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('should return paginated transactions', async () => {
            mockPrismaService.transaction.findMany.mockResolvedValue([mockTransaction]);
            mockPrismaService.transaction.count.mockResolvedValue(1);

            const result = await service.findAll({ page: 1, limit: 10 });

            expect(result.data).toEqual([mockTransaction]);
            expect(result.meta).toEqual({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
            });
        });

        it('should filter by status', async () => {
            mockPrismaService.transaction.findMany.mockResolvedValue([mockTransaction]);
            mockPrismaService.transaction.count.mockResolvedValue(1);

            await service.findAll({ status: 'ISSUED' });

            expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'ISSUED' }),
                }),
            );
        });
    });

    describe('calculateFine', () => {
        it('should return 0 fine if not overdue', async () => {
            const futureTransaction = {
                ...mockTransaction,
                dueDate: new Date(Date.now() + 86400000),
            };
            mockPrismaService.transaction.findUnique.mockResolvedValue(
                futureTransaction,
            );

            const result = await service.calculateFine('trans-1');

            expect(result.fineAmount).toBe(0);
        });

        it('should calculate fine for overdue transaction', async () => {
            const overdueTransaction = {
                ...mockTransaction,
                dueDate: new Date('2020-01-01'),
            };
            mockPrismaService.transaction.findUnique.mockResolvedValue(
                overdueTransaction,
            );
            mockPrismaService.transaction.update.mockResolvedValue(overdueTransaction);

            const result = await service.calculateFine('trans-1');

            expect(result.fineAmount).toBeGreaterThan(0);
            expect(result.daysOverdue).toBeGreaterThan(0);
        });
    });

    describe('payFine', () => {
        const payFineDto = {
            amount: 50,
            paymentMethod: PaymentMethod.CASH,
        };

        it('should pay fine successfully', async () => {
            const transactionWithFine = {
                ...mockTransaction,
                fineAmount: 50,
                finePaid: false,
            };
            mockPrismaService.transaction.findUnique.mockResolvedValue(
                transactionWithFine,
            );
            mockPrismaService.transaction.update.mockResolvedValue({
                ...transactionWithFine,
                finePaid: true,
            });
            mockPrismaService.payment.create.mockResolvedValue({});

            const result = await service.payFine('trans-1', payFineDto);

            expect(result.success).toBe(true);
            expect(mockPrismaService.payment.create).toHaveBeenCalled();
        });

        it('should throw BadRequestException if fine already paid', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                finePaid: true,
            });

            await expect(service.payFine('trans-1', payFineDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException if no fine to pay', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                fineAmount: 0,
            });

            await expect(service.payFine('trans-1', payFineDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getOverdueTransactions', () => {
        it('should return overdue transactions with calculated fines', async () => {
            const overdueTransaction = {
                ...mockTransaction,
                dueDate: new Date('2020-01-01'),
            };
            mockPrismaService.transaction.findMany.mockResolvedValue([
                overdueTransaction,
            ]);

            const result = await service.getOverdueTransactions();

            expect(result.count).toBe(1);
            expect(result.transactions[0].daysOverdue).toBeGreaterThan(0);
            expect(result.transactions[0].calculatedFine).toBeGreaterThan(0);
        });
    });

    describe('getTransactionStats', () => {
        it('should return transaction statistics', async () => {
            mockPrismaService.transaction.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(5) // active
                .mockResolvedValueOnce(4) // returned
                .mockResolvedValueOnce(1); // overdue
            mockPrismaService.transaction.aggregate
                .mockResolvedValueOnce({ _sum: { fineAmount: 100 } })
                .mockResolvedValueOnce({ _sum: { fineAmount: 50 } });

            const result = await service.getTransactionStats();

            expect(result.totalTransactions).toBe(10);
            expect(result.activeTransactions).toBe(5);
            expect(result.returnedTransactions).toBe(4);
            expect(result.overdueTransactions).toBe(1);
            expect(result.totalFines).toBe(100);
            expect(result.unpaidFines).toBe(50);
        });
    });

    describe('cancelTransaction', () => {
        it('should cancel a transaction successfully', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
            mockPrismaService.bookCopy.update.mockResolvedValue(mockBookCopy);
            mockPrismaService.book.update.mockResolvedValue(mockBook);
            mockPrismaService.transaction.delete.mockResolvedValue(mockTransaction);

            const result = await service.cancelTransaction('trans-1');

            expect(result.success).toBe(true);
            expect(mockPrismaService.transaction.delete).toHaveBeenCalled();
        });

        it('should throw BadRequestException if transaction already returned', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                ...mockTransaction,
                status: TransactionStatus.RETURNED,
            });

            await expect(service.cancelTransaction('trans-1')).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
