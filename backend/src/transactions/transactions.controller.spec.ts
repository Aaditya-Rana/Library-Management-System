import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionStatus } from '@prisma/client';

describe('TransactionsController', () => {
    let controller: TransactionsController;
    let _service: TransactionsService;

    const mockTransactionsService = {
        issueBook: jest.fn(),
        returnBook: jest.fn(),
        renewTransaction: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByUser: jest.fn(),
        findByBook: jest.fn(),
        calculateFine: jest.fn(),
        payFine: jest.fn(),
        getOverdueTransactions: jest.fn(),
        getTransactionStats: jest.fn(),
        cancelTransaction: jest.fn(),
    };

    const mockTransaction = {
        id: 'trans-1',
        userId: 'user-1',
        bookId: 'book-1',
        status: TransactionStatus.ISSUED,
        issueDate: new Date(),
        dueDate: new Date(),
        fineAmount: 0,
        finePaid: false,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TransactionsController],
            providers: [
                {
                    provide: TransactionsService,
                    useValue: mockTransactionsService,
                },
            ],
        }).compile();

        controller = module.get<TransactionsController>(TransactionsController);
        _service = module.get<TransactionsService>(TransactionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('issueBook', () => {
        it('should issue a book', async () => {
            const issueBookDto = {
                bookId: 'book-1',
                userId: 'user-1',
            };
            mockTransactionsService.issueBook.mockResolvedValue(mockTransaction);

            const result = await controller.issueBook(issueBookDto, 'librarian-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTransaction);
            expect(mockTransactionsService.issueBook).toHaveBeenCalledWith(
                issueBookDto,
                'librarian-1',
            );
        });
    });

    describe('returnBook', () => {
        it('should return a book', async () => {
            const returnBookDto = { notes: 'Good condition' };
            mockTransactionsService.returnBook.mockResolvedValue({
                ...mockTransaction,
                status: TransactionStatus.RETURNED,
            });

            const result = await controller.returnBook('trans-1', returnBookDto);

            expect(result.success).toBe(true);
            expect(mockTransactionsService.returnBook).toHaveBeenCalledWith(
                'trans-1',
                returnBookDto,
            );
        });
    });

    describe('renewTransaction', () => {
        it('should renew a transaction', async () => {
            const renewDto = {};
            mockTransactionsService.renewTransaction.mockResolvedValue({
                ...mockTransaction,
                renewalCount: 1,
            });

            const result = await controller.renewTransaction(
                'trans-1',
                renewDto,
                'user-1',
            );

            expect(result.success).toBe(true);
            expect(mockTransactionsService.renewTransaction).toHaveBeenCalledWith(
                'trans-1',
                renewDto,
                'user-1',
            );
        });
    });

    describe('findAll', () => {
        it('should return paginated transactions', async () => {
            const queryDto = { page: 1, limit: 10 };
            const paginatedResult = {
                data: [mockTransaction],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
            mockTransactionsService.findAll.mockResolvedValue(paginatedResult);

            const result = await controller.findAll(queryDto);

            expect(result).toEqual(paginatedResult);
        });
    });

    describe('findOne', () => {
        it('should return a transaction', async () => {
            mockTransactionsService.findOne.mockResolvedValue(mockTransaction);

            const result = await controller.findOne('trans-1', 'user-1', 'USER');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTransaction);
        });
    });

    describe('findByUser', () => {
        it('should return user transactions', async () => {
            const queryDto = { page: 1, limit: 10 };
            const paginatedResult = {
                data: [mockTransaction],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
            mockTransactionsService.findByUser.mockResolvedValue(paginatedResult);

            const result = await controller.findByUser(
                'user-1',
                queryDto,
                'user-1',
                'USER',
            );

            expect(result).toEqual(paginatedResult);
        });
    });

    describe('findByBook', () => {
        it('should return book transaction history', async () => {
            const queryDto = { page: 1, limit: 10 };
            const paginatedResult = {
                data: [mockTransaction],
                meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
            };
            mockTransactionsService.findByBook.mockResolvedValue(paginatedResult);

            const result = await controller.findByBook('book-1', queryDto);

            expect(result).toEqual(paginatedResult);
        });
    });

    describe('calculateFine', () => {
        it('should calculate fine for a transaction', async () => {
            const fineResult = {
                transactionId: 'trans-1',
                fineAmount: 50,
                daysOverdue: 10,
            };
            mockTransactionsService.calculateFine.mockResolvedValue(fineResult);

            const result = await controller.calculateFine('trans-1');

            expect(result).toEqual(fineResult);
        });
    });

    describe('payFine', () => {
        it('should pay fine for a transaction', async () => {
            const payFineDto = {
                amount: 50,
                paymentMethod: 'CASH' as any,
            };
            const paymentResult = {
                success: true,
                message: 'Fine paid successfully',
                transaction: mockTransaction,
                amountPaid: 50,
            };
            mockTransactionsService.payFine.mockResolvedValue(paymentResult);

            const result = await controller.payFine('trans-1', payFineDto);

            expect(result).toEqual(paymentResult);
        });
    });

    describe('getOverdue', () => {
        it('should return overdue transactions', async () => {
            const overdueResult = {
                count: 1,
                transactions: [mockTransaction],
            };
            mockTransactionsService.getOverdueTransactions.mockResolvedValue(
                overdueResult,
            );

            const result = await controller.getOverdue();

            expect(result).toEqual(overdueResult);
        });
    });

    describe('getStats', () => {
        it('should return transaction statistics', async () => {
            const stats = {
                totalTransactions: 10,
                activeTransactions: 5,
                returnedTransactions: 4,
                overdueTransactions: 1,
                totalFines: 100,
                unpaidFines: 50,
            };
            mockTransactionsService.getTransactionStats.mockResolvedValue(stats);

            const result = await controller.getStats();

            expect(result).toEqual(stats);
        });
    });

    describe('cancelTransaction', () => {
        it('should cancel a transaction', async () => {
            const cancelResult = {
                success: true,
                message: 'Transaction cancelled successfully',
            };
            mockTransactionsService.cancelTransaction.mockResolvedValue(
                cancelResult,
            );

            const result = await controller.cancelTransaction('trans-1');

            expect(result).toEqual(cancelResult);
        });
    });
});
