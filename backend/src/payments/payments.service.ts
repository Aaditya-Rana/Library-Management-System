import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { PaymentStatus, UserRole, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly notificationsService: NotificationsService,
    ) { }

    async recordPayment(dto: RecordPaymentDto, _librarianId: string) {
        // Validate transaction if provided
        let userId: string;

        if (dto.transactionId) {
            const transaction = await this.prisma.transaction.findUnique({
                where: { id: dto.transactionId },
                include: { user: true },
            });

            if (!transaction) {
                throw new NotFoundException('Transaction not found');
            }

            userId = transaction.userId;

            // Validate payment breakdown matches transaction charges
            const totalBreakdown = (dto.lateFee || 0) + (dto.damageCharge || 0) + (dto.securityDeposit || 0);
            if (Math.abs(totalBreakdown - dto.amount) > 0.01) {
                throw new BadRequestException(
                    'Payment amount must match the sum of breakdown components',
                );
            }
        } else {
            // For standalone payments (e.g., membership fees), userId must be provided
            throw new BadRequestException(
                'Transaction ID is required for payment recording',
            );
        }

        // Create payment record
        const payment = await this.prisma.payment.create({
            data: {
                userId,
                transactionId: dto.transactionId,
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
                paymentStatus: PaymentStatus.COMPLETED,
                lateFee: dto.lateFee || 0,
                damageCharge: dto.damageCharge || 0,
                securityDeposit: dto.securityDeposit || 0,
                paymentDate: new Date(),
                notes: dto.notes,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        issueDate: true,
                        dueDate: true,
                        returnDate: true,
                        book: {
                            select: {
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });

        // Update transaction fine status if applicable
        if (dto.transactionId && dto.lateFee && dto.lateFee > 0) {
            await this.prisma.transaction.update({
                where: { id: dto.transactionId },
                data: { finePaid: true },
            });
        }

        return {
            success: true,
            message: 'Payment recorded successfully',
            data: { payment },
        };
    }

    async findOne(id: string, requestingUserId: string, role: UserRole) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                transaction: {
                    select: {
                        id: true,
                        issueDate: true,
                        dueDate: true,
                        returnDate: true,
                        book: {
                            select: {
                                title: true,
                                author: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        // Authorization: Users can only view their own payments
        if (
            role === UserRole.USER &&
            payment.userId !== requestingUserId
        ) {
            throw new ForbiddenException(
                'You can only view your own payments',
            );
        }

        return {
            success: true,
            data: { payment },
        };
    }

    async findByUser(
        userId: string,
        queryDto: QueryPaymentsDto,
        requestingUserId: string,
        role: UserRole,
    ) {
        // Authorization: Users can only view their own payments
        if (role === UserRole.USER && userId !== requestingUserId) {
            throw new ForbiddenException(
                'You can only view your own payments',
            );
        }

        const { page = 1, limit = 20, status, paymentMethod, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            userId: string;
            paymentStatus?: PaymentStatus;
            paymentMethod?: PaymentMethod;
            createdAt?: {
                gte?: Date;
                lte?: Date;
            };
        } = { userId };

        if (status) {
            where.paymentStatus = status;
        }

        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        // Get payments
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy as string]: sortOrder },
                include: {
                    transaction: {
                        select: {
                            id: true,
                            book: {
                                select: {
                                    title: true,
                                    author: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.payment.count({ where }),
        ]);

        return {
            success: true,
            data: {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async findByTransaction(
        transactionId: string,
        requestingUserId: string,
        role: UserRole,
    ) {
        // Verify transaction exists
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        // Authorization: Users can only view payments for their own transactions
        if (
            role === UserRole.USER &&
            transaction.userId !== requestingUserId
        ) {
            throw new ForbiddenException(
                'You can only view payments for your own transactions',
            );
        }

        const payments = await this.prisma.payment.findMany({
            where: { transactionId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // Calculate totals
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalRefunded = payments.reduce(
            (sum, p) => sum + (p.refundAmount || 0),
            0,
        );
        const netAmount = totalPaid - totalRefunded;

        return {
            success: true,
            data: {
                payments,
                summary: {
                    totalPaid,
                    totalRefunded,
                    netAmount,
                    paymentCount: payments.length,
                },
            },
        };
    }

    async processRefund(id: string, dto: RefundPaymentDto) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        // Validate refund amount
        const alreadyRefunded = payment.refundAmount || 0;
        const maxRefundable = payment.amount - alreadyRefunded;

        if (dto.refundAmount > maxRefundable) {
            throw new BadRequestException(
                `Refund amount cannot exceed ${maxRefundable.toFixed(2)}`,
            );
        }

        // Calculate new status
        const totalRefunded = alreadyRefunded + dto.refundAmount;
        let newStatus = payment.paymentStatus;

        if (totalRefunded >= payment.amount) {
            newStatus = PaymentStatus.REFUNDED;
        } else if (totalRefunded > 0) {
            newStatus = PaymentStatus.PARTIALLY_REFUNDED;
        }

        // Update payment
        const updatedPayment = await this.prisma.payment.update({
            where: { id },
            data: {
                refundAmount: totalRefunded,
                refundDate: new Date(),
                refundReason: dto.refundReason,
                paymentStatus: newStatus,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Refund processed successfully',
            data: { payment: updatedPayment },
        };
    }

    async calculatePaymentBreakdown(transactionId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                payments: true,
                book: {
                    select: {
                        finePerDay: true,
                        securityDeposit: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new NotFoundException('Transaction not found');
        }

        // Calculate total already paid
        const totalPaid = transaction.payments.reduce(
            (sum, p) => sum + p.amount - (p.refundAmount || 0),
            0,
        );

        // Calculate breakdown
        const breakdown = {
            fineAmount: transaction.fineAmount,
            damageCharge: transaction.damageCharge,
            securityDeposit: transaction.book.securityDeposit,
            totalDue: transaction.fineAmount + transaction.damageCharge,
            totalPaid,
            pendingAmount: Math.max(
                0,
                transaction.fineAmount + transaction.damageCharge - totalPaid,
            ),
        };

        return {
            success: true,
            data: breakdown,
        };
    }
}
