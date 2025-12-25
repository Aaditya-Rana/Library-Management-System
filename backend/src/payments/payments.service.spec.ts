import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentStatus, PaymentMethod, UserRole } from '@prisma/client';

describe('PaymentsService', () => {
    let service: PaymentsService;
    let _prisma: PrismaService;

    const mockPrismaService = {
        transaction: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        payment: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<PaymentsService>(PaymentsService);
        _prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('recordPayment', () => {
        it('should record a payment successfully', async () => {
            const dto = {
                transactionId: 'trans-123',
                amount: 100,
                paymentMethod: PaymentMethod.CASH,
                lateFee: 100,
            };

            const mockTransaction = {
                id: 'trans-123',
                userId: 'user-123',
                fineAmount: 100,
            };

            const mockPayment = {
                id: 'payment-123',
                userId: 'user-123',
                transactionId: 'trans-123',
                amount: 100,
                paymentMethod: PaymentMethod.CASH,
                paymentStatus: PaymentStatus.COMPLETED,
                lateFee: 100,
                user: { id: 'user-123', email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
                transaction: {
                    id: 'trans-123',
                    issueDate: new Date(),
                    dueDate: new Date(),
                    returnDate: null,
                    book: { title: 'Test Book', author: 'Test Author' },
                },
            };

            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
            mockPrismaService.payment.create.mockResolvedValue(mockPayment);
            mockPrismaService.transaction.update.mockResolvedValue({});

            const result = await service.recordPayment(dto, 'librarian-123');

            expect(result.success).toBe(true);
            expect(result.message).toBe('Payment recorded successfully');
            expect(result.data.payment).toEqual(mockPayment);
            expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
                where: { id: 'trans-123' },
                data: { finePaid: true },
            });
        });

        it('should throw NotFoundException if transaction not found', async () => {
            const dto = {
                transactionId: 'invalid-trans',
                amount: 100,
                paymentMethod: PaymentMethod.CASH,
                lateFee: 100,
            };

            mockPrismaService.transaction.findUnique.mockResolvedValue(null);

            await expect(service.recordPayment(dto, 'librarian-123')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if payment breakdown does not match amount', async () => {
            const dto = {
                transactionId: 'trans-123',
                amount: 150,
                paymentMethod: PaymentMethod.CASH,
                lateFee: 100,
                damageCharge: 20,
            };

            const mockTransaction = {
                id: 'trans-123',
                userId: 'user-123',
            };

            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

            await expect(service.recordPayment(dto, 'librarian-123')).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw BadRequestException if transactionId is not provided', async () => {
            const dto = {
                amount: 100,
                paymentMethod: PaymentMethod.CASH,
                lateFee: 100,
            };

            await expect(service.recordPayment(dto, 'librarian-123')).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('findOne', () => {
        it('should return payment details for authorized user', async () => {
            const mockPayment = {
                id: 'payment-123',
                userId: 'user-123',
                amount: 100,
                user: { id: 'user-123', email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
                transaction: {
                    id: 'trans-123',
                    book: { title: 'Test Book', author: 'Test Author' },
                },
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

            const result = await service.findOne('payment-123', 'user-123', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.data.payment).toEqual(mockPayment);
        });

        it('should throw NotFoundException if payment not found', async () => {
            mockPrismaService.payment.findUnique.mockResolvedValue(null);

            await expect(
                service.findOne('invalid-payment', 'user-123', UserRole.USER),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user tries to view another user\'s payment', async () => {
            const mockPayment = {
                id: 'payment-123',
                userId: 'user-123',
                amount: 100,
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

            await expect(
                service.findOne('payment-123', 'user-456', UserRole.USER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow admin to view any payment', async () => {
            const mockPayment = {
                id: 'payment-123',
                userId: 'user-123',
                amount: 100,
                user: { id: 'user-123', email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
                transaction: null,
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

            const result = await service.findOne('payment-123', 'admin-123', UserRole.ADMIN);

            expect(result.success).toBe(true);
            expect(result.data.payment).toEqual(mockPayment);
        });
    });

    describe('findByUser', () => {
        it('should return paginated payments for user', async () => {
            const mockPayments = [
                { id: 'payment-1', amount: 100, userId: 'user-123' },
                { id: 'payment-2', amount: 200, userId: 'user-123' },
            ];

            mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);
            mockPrismaService.payment.count.mockResolvedValue(2);

            const result = await service.findByUser(
                'user-123',
                { page: 1, limit: 20 },
                'user-123',
                UserRole.USER,
            );

            expect(result.success).toBe(true);
            expect(result.data.payments).toEqual(mockPayments);
            expect(result.data.pagination).toEqual({
                page: 1,
                limit: 20,
                total: 2,
                totalPages: 1,
            });
        });

        it('should throw ForbiddenException if user tries to view another user\'s payments', async () => {
            await expect(
                service.findByUser('user-123', {}, 'user-456', UserRole.USER),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should allow librarian to view any user\'s payments', async () => {
            const mockPayments = [{ id: 'payment-1', amount: 100 }];

            mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);
            mockPrismaService.payment.count.mockResolvedValue(1);

            const result = await service.findByUser(
                'user-123',
                {},
                'librarian-123',
                UserRole.LIBRARIAN,
            );

            expect(result.success).toBe(true);
        });
    });

    describe('findByTransaction', () => {
        it('should return payments for a transaction', async () => {
            const mockTransaction = {
                id: 'trans-123',
                userId: 'user-123',
            };

            const mockPayments = [
                { id: 'payment-1', amount: 100, refundAmount: 0, user: {} },
                { id: 'payment-2', amount: 50, refundAmount: 10, user: {} },
            ];

            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);
            mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

            const result = await service.findByTransaction(
                'trans-123',
                'user-123',
                UserRole.USER,
            );

            expect(result.success).toBe(true);
            expect(result.data.payments).toEqual(mockPayments);
            expect(result.data.summary.totalPaid).toBe(150);
            expect(result.data.summary.totalRefunded).toBe(10);
            expect(result.data.summary.netAmount).toBe(140);
        });

        it('should throw NotFoundException if transaction not found', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(null);

            await expect(
                service.findByTransaction('invalid-trans', 'user-123', UserRole.USER),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if user tries to view another user\'s transaction payments', async () => {
            const mockTransaction = {
                id: 'trans-123',
                userId: 'user-123',
            };

            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

            await expect(
                service.findByTransaction('trans-123', 'user-456', UserRole.USER),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('processRefund', () => {
        it('should process refund successfully', async () => {
            const mockPayment = {
                id: 'payment-123',
                amount: 100,
                refundAmount: 0,
                paymentStatus: PaymentStatus.COMPLETED,
            };

            const updatedPayment = {
                ...mockPayment,
                refundAmount: 50,
                paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
                user: { id: 'user-123' },
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrismaService.payment.update.mockResolvedValue(updatedPayment);

            const result = await service.processRefund('payment-123', {
                refundAmount: 50,
                refundReason: 'Overpayment',
            });

            expect(result.success).toBe(true);
            expect(result.message).toBe('Refund processed successfully');
            expect(result.data.payment.refundAmount).toBe(50);
        });

        it('should set status to REFUNDED when full refund is processed', async () => {
            const mockPayment = {
                id: 'payment-123',
                amount: 100,
                refundAmount: 0,
                paymentStatus: PaymentStatus.COMPLETED,
            };

            const updatedPayment = {
                ...mockPayment,
                refundAmount: 100,
                paymentStatus: PaymentStatus.REFUNDED,
                user: { id: 'user-123' },
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
            mockPrismaService.payment.update.mockResolvedValue(updatedPayment);

            const result = await service.processRefund('payment-123', {
                refundAmount: 100,
                refundReason: 'Cancelled',
            });

            expect(result.data.payment.paymentStatus).toBe(PaymentStatus.REFUNDED);
        });

        it('should throw NotFoundException if payment not found', async () => {
            mockPrismaService.payment.findUnique.mockResolvedValue(null);

            await expect(
                service.processRefund('invalid-payment', {
                    refundAmount: 50,
                    refundReason: 'Test',
                }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if refund amount exceeds available amount', async () => {
            const mockPayment = {
                id: 'payment-123',
                amount: 100,
                refundAmount: 50,
                paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
            };

            mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

            await expect(
                service.processRefund('payment-123', {
                    refundAmount: 60,
                    refundReason: 'Test',
                }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('calculatePaymentBreakdown', () => {
        it('should calculate payment breakdown correctly', async () => {
            const mockTransaction = {
                id: 'trans-123',
                fineAmount: 100,
                damageCharge: 50,
                payments: [
                    { amount: 80, refundAmount: 0 },
                    { amount: 30, refundAmount: 10 },
                ],
                book: {
                    finePerDay: 5,
                    securityDeposit: 200,
                },
            };

            mockPrismaService.transaction.findUnique.mockResolvedValue(mockTransaction);

            const result = await service.calculatePaymentBreakdown('trans-123');

            expect(result.success).toBe(true);
            expect(result.data.fineAmount).toBe(100);
            expect(result.data.damageCharge).toBe(50);
            expect(result.data.totalDue).toBe(150);
            expect(result.data.totalPaid).toBe(100); // 80 + 30 - 10
            expect(result.data.pendingAmount).toBe(50);
        });

        it('should throw NotFoundException if transaction not found', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue(null);

            await expect(service.calculatePaymentBreakdown('invalid-trans')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
