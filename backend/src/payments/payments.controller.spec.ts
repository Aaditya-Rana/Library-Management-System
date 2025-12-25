import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UserRole, PaymentStatus, PaymentMethod } from '@prisma/client';

describe('PaymentsController', () => {
    let controller: PaymentsController;
    let service: PaymentsService;

    const mockPaymentsService = {
        recordPayment: jest.fn(),
        findOne: jest.fn(),
        findByUser: jest.fn(),
        findByTransaction: jest.fn(),
        processRefund: jest.fn(),
        calculatePaymentBreakdown: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentsController],
            providers: [
                {
                    provide: PaymentsService,
                    useValue: mockPaymentsService,
                },
            ],
        }).compile();

        controller = module.get<PaymentsController>(PaymentsController);
        service = module.get<PaymentsService>(PaymentsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('recordPayment', () => {
        it('should record a payment', async () => {
            const dto = {
                transactionId: 'trans-123',
                amount: 100,
                paymentMethod: PaymentMethod.CASH,
                lateFee: 100,
            };

            const expectedResult = {
                success: true,
                message: 'Payment recorded successfully',
                data: {
                    payment: {
                        id: 'payment-123',
                        amount: 100,
                    },
                },
            };

            mockPaymentsService.recordPayment.mockResolvedValue(expectedResult);

            const result = await controller.recordPayment(dto, 'librarian-123');

            expect(result).toEqual(expectedResult);
            expect(service.recordPayment).toHaveBeenCalledWith(dto, 'librarian-123');
        });
    });

    describe('findOne', () => {
        it('should return payment details', async () => {
            const expectedResult = {
                success: true,
                data: {
                    payment: {
                        id: 'payment-123',
                        amount: 100,
                    },
                },
            };

            mockPaymentsService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.findOne('payment-123', 'user-123', UserRole.USER);

            expect(result).toEqual(expectedResult);
            expect(service.findOne).toHaveBeenCalledWith(
                'payment-123',
                'user-123',
                UserRole.USER,
            );
        });
    });

    describe('findByUser', () => {
        it('should return user\'s payment history', async () => {
            const queryDto = {
                page: 1,
                limit: 20,
            };

            const expectedResult = {
                success: true,
                data: {
                    payments: [
                        { id: 'payment-1', amount: 100 },
                        { id: 'payment-2', amount: 200 },
                    ],
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 2,
                        totalPages: 1,
                    },
                },
            };

            mockPaymentsService.findByUser.mockResolvedValue(expectedResult);

            const result = await controller.findByUser(
                'user-123',
                queryDto,
                'user-123',
                UserRole.USER,
            );

            expect(result).toEqual(expectedResult);
            expect(service.findByUser).toHaveBeenCalledWith(
                'user-123',
                queryDto,
                'user-123',
                UserRole.USER,
            );
        });

        it('should handle filtering by status', async () => {
            const queryDto = {
                page: 1,
                limit: 20,
                status: PaymentStatus.COMPLETED,
            };

            const expectedResult = {
                success: true,
                data: {
                    payments: [{ id: 'payment-1', amount: 100, paymentStatus: PaymentStatus.COMPLETED }],
                    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
                },
            };

            mockPaymentsService.findByUser.mockResolvedValue(expectedResult);

            const result = await controller.findByUser(
                'user-123',
                queryDto,
                'user-123',
                UserRole.USER,
            );

            expect(result).toEqual(expectedResult);
        });
    });

    describe('findByTransaction', () => {
        it('should return payments for a transaction', async () => {
            const expectedResult = {
                success: true,
                data: {
                    payments: [
                        { id: 'payment-1', amount: 100 },
                        { id: 'payment-2', amount: 50 },
                    ],
                    summary: {
                        totalPaid: 150,
                        totalRefunded: 0,
                        netAmount: 150,
                        paymentCount: 2,
                    },
                },
            };

            mockPaymentsService.findByTransaction.mockResolvedValue(expectedResult);

            const result = await controller.findByTransaction(
                'trans-123',
                'user-123',
                UserRole.USER,
            );

            expect(result).toEqual(expectedResult);
            expect(service.findByTransaction).toHaveBeenCalledWith(
                'trans-123',
                'user-123',
                UserRole.USER,
            );
        });
    });

    describe('processRefund', () => {
        it('should process a refund', async () => {
            const dto = {
                refundAmount: 50,
                refundReason: 'Overpayment',
            };

            const expectedResult = {
                success: true,
                message: 'Refund processed successfully',
                data: {
                    payment: {
                        id: 'payment-123',
                        amount: 100,
                        refundAmount: 50,
                        paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
                    },
                },
            };

            mockPaymentsService.processRefund.mockResolvedValue(expectedResult);

            const result = await controller.processRefund('payment-123', dto);

            expect(result).toEqual(expectedResult);
            expect(service.processRefund).toHaveBeenCalledWith('payment-123', dto);
        });
    });

    describe('calculateBreakdown', () => {
        it('should return payment breakdown for a transaction', async () => {
            const expectedResult = {
                success: true,
                data: {
                    fineAmount: 100,
                    damageCharge: 50,
                    securityDeposit: 200,
                    totalDue: 150,
                    totalPaid: 100,
                    pendingAmount: 50,
                },
            };

            mockPaymentsService.calculatePaymentBreakdown.mockResolvedValue(expectedResult);

            const result = await controller.calculateBreakdown('trans-123');

            expect(result).toEqual(expectedResult);
            expect(service.calculatePaymentBreakdown).toHaveBeenCalledWith('trans-123');
        });
    });
});
