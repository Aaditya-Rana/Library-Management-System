import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { BooksService } from '../books/books.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IssueBookDto } from './dto/issue-book.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { RenewTransactionDto } from './dto/renew-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { PayFineDto } from './dto/pay-fine.dto';
import { TransactionStatus, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private booksService: BooksService,
        private notificationsService: NotificationsService,
    ) { }

    async issueBook(issueBookDto: IssueBookDto, librarianId?: string) {
        const { bookId, userId, dueDate, isHomeDelivery, notes } = issueBookDto;

        // Validate user exists and is eligible
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        if (user.status !== 'ACTIVE') {
            throw new ForbiddenException('User account is not active');
        }

        // Check for pending fines
        const pendingFines = await this.prisma.transaction.findFirst({
            where: {
                userId,
                finePaid: false,
                fineAmount: { gt: 0 },
            },
        });

        if (pendingFines) {
            throw new ForbiddenException('User has pending fines. Please clear them before borrowing');
        }

        // Validate book exists and is available
        const book = await this.booksService.findOne(bookId);

        if (!book.isActive) {
            throw new BadRequestException('Book is not available for borrowing');
        }

        if (book.availableCopies <= 0) {
            throw new BadRequestException('No copies available for this book');
        }

        // Find an available book copy
        const availableCopy = await this.prisma.bookCopy.findFirst({
            where: {
                bookId,
                status: 'AVAILABLE',
            },
        });

        if (!availableCopy) {
            throw new BadRequestException('No physical copies available');
        }

        // Calculate due date if not provided
        const issueDateObj = new Date();
        const dueDateObj = dueDate
            ? new Date(dueDate)
            : new Date(issueDateObj.getTime() + book.loanPeriodDays * 24 * 60 * 60 * 1000);

        // Create transaction
        const transaction = await this.prisma.transaction.create({
            data: {
                userId,
                bookId,
                bookCopyId: availableCopy.id,
                librarianId,
                issueDate: issueDateObj,
                dueDate: dueDateObj,
                status: TransactionStatus.ISSUED,
                isHomeDelivery: isHomeDelivery || false,
                notes,
            },
            include: {
                book: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                bookCopy: true,
            },
        });

        // Update book copy status
        await this.prisma.bookCopy.update({
            where: { id: availableCopy.id },
            data: {
                status: 'ISSUED',
                lastIssuedDate: issueDateObj,
            },
        });

        // Update book inventory
        await this.prisma.book.update({
            where: { id: bookId },
            data: {
                availableCopies: { decrement: 1 },
            },
        });

        // Send notification to user
        try {
            await this.notificationsService.sendBookIssuedNotification(
                transaction.id,
                transaction.userId,
                transaction.book.title,
            );
        } catch (error) {
            // Log error but don't fail the transaction
            console.error('Failed to send book issued notification:', error);
        }

        return transaction;
    }

    async returnBook(transactionId: string, returnBookDto: ReturnBookDto) {
        const { returnCondition, damageCharge, notes } = returnBookDto;

        // Find transaction
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                book: true,
                bookCopy: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
        }

        if (transaction.status === TransactionStatus.RETURNED) {
            throw new BadRequestException('Book has already been returned');
        }

        const returnDate = new Date();

        // Calculate fine if overdue
        let fineAmount = 0;
        if (returnDate > transaction.dueDate) {
            const daysOverdue = Math.ceil(
                (returnDate.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            fineAmount = daysOverdue * transaction.book.finePerDay;
        }

        // Add damage charge if any
        const totalFine = fineAmount + (damageCharge || 0);

        // Update transaction
        const updatedTransaction = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                returnDate,
                status: TransactionStatus.RETURNED,
                fineAmount: totalFine,
                damageCharge: damageCharge || 0,
                returnCondition: returnCondition as Prisma.InputJsonValue,
                notes: notes || transaction.notes,
            },
            include: {
                book: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                bookCopy: true,
            },
        });

        // Update book copy status
        await this.prisma.bookCopy.update({
            where: { id: transaction.bookCopyId },
            data: {
                status: 'AVAILABLE',
                condition: returnCondition?.condition || transaction.bookCopy.condition,
            },
        });

        // Update book inventory
        await this.prisma.book.update({
            where: { id: transaction.bookId },
            data: {
                availableCopies: { increment: 1 },
            },
        });

        // Send notification to user
        try {
            await this.notificationsService.sendBookReturnedNotification(
                updatedTransaction.id,
                updatedTransaction.userId,
                updatedTransaction.book.title,
            );
        } catch (error) {
            // Log error but don't fail the transaction
            console.error('Failed to send book returned notification:', error);
        }

        return updatedTransaction;
    }

    async renewTransaction(transactionId: string, renewDto: RenewTransactionDto, userId: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { book: true },
        });

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
        }

        // Verify user owns this transaction
        if (transaction.userId !== userId) {
            throw new ForbiddenException('You can only renew your own transactions');
        }

        if (transaction.status !== TransactionStatus.ISSUED) {
            throw new BadRequestException('Only issued transactions can be renewed');
        }

        // Check renewal limit
        if (transaction.renewalCount >= transaction.book.maxRenewals) {
            throw new BadRequestException(`Maximum renewal limit (${transaction.book.maxRenewals}) reached`);
        }

        // Check if overdue
        if (new Date() > transaction.dueDate) {
            throw new BadRequestException('Cannot renew overdue transactions. Please return the book and pay fines.');
        }

        // Calculate new due date
        const newDueDate = renewDto.newDueDate
            ? new Date(renewDto.newDueDate)
            : new Date(transaction.dueDate.getTime() + transaction.book.loanPeriodDays * 24 * 60 * 60 * 1000);

        // Update transaction
        const renewed = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                dueDate: newDueDate,
                renewalCount: { increment: 1 },
                status: TransactionStatus.RENEWED,
            },
            include: {
                book: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return renewed;
    }

    async findAll(queryDto: QueryTransactionsDto) {
        const {
            page = 1,
            limit = 10,
            status,
            userId,
            bookId,
            overdue,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = queryDto;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.TransactionWhereInput = {};

        if (status) where.status = status as TransactionStatus;
        if (userId) where.userId = userId;
        if (bookId) where.bookId = bookId;

        if (queryDto.search) {
            where.OR = [
                // Search by User
                { user: { firstName: { contains: queryDto.search, mode: 'insensitive' } } },
                { user: { lastName: { contains: queryDto.search, mode: 'insensitive' } } },
                { user: { email: { contains: queryDto.search, mode: 'insensitive' } } },
                // Search by Book
                { book: { title: { contains: queryDto.search, mode: 'insensitive' } } },
                { book: { isbn: { contains: queryDto.search, mode: 'insensitive' } } },
                { bookCopy: { barcode: { contains: queryDto.search, mode: 'insensitive' } } }, // Assuming we want to support barcode scan here too
            ];
        }

        if (overdue) {
            where.dueDate = { lt: new Date() };
            where.status = TransactionStatus.ISSUED;
        }

        if (startDate || endDate) {
            where.issueDate = {};
            if (startDate) where.issueDate.gte = new Date(startDate);
            if (endDate) where.issueDate.lte = new Date(endDate);
        }

        // Execute query
        const [transactions, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    book: {
                        select: {
                            id: true,
                            title: true,
                            author: true,
                            isbn: true,
                            coverImageUrl: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    bookCopy: {
                        select: {
                            id: true,
                            copyNumber: true,
                            barcode: true,
                        },
                    },
                },
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return {
            data: transactions,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                book: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                bookCopy: true,
            },
        });

        if (!transaction) {
            throw new NotFoundException(`Transaction with ID ${id} not found`);
        }

        return transaction;
    }

    async findByUser(userId: string, queryDto: QueryTransactionsDto) {
        return this.findAll({ ...queryDto, userId });
    }

    async findByBook(bookId: string, queryDto: QueryTransactionsDto) {
        return this.findAll({ ...queryDto, bookId });
    }

    async calculateFine(transactionId: string) {
        const transaction = await this.findOne(transactionId);

        if (transaction.status === TransactionStatus.RETURNED) {
            return {
                transactionId,
                fineAmount: transaction.fineAmount,
                finePaid: transaction.finePaid,
                message: 'Book already returned',
            };
        }

        const currentDate = new Date();

        if (currentDate <= transaction.dueDate) {
            return {
                transactionId,
                fineAmount: 0,
                daysOverdue: 0,
                message: 'Book is not overdue',
            };
        }

        const daysOverdue = Math.ceil(
            (currentDate.getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const fineAmount = daysOverdue * transaction.book.finePerDay;

        // Update transaction with calculated fine
        await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                fineAmount,
                status: TransactionStatus.OVERDUE,
            },
        });

        return {
            transactionId,
            daysOverdue,
            finePerDay: transaction.book.finePerDay,
            fineAmount,
            finePaid: transaction.finePaid,
        };
    }

    async payFine(transactionId: string, payFineDto: PayFineDto) {
        const transaction = await this.findOne(transactionId);

        if (transaction.finePaid) {
            throw new BadRequestException('Fine has already been paid');
        }

        if (transaction.fineAmount === 0) {
            throw new BadRequestException('No fine to pay for this transaction');
        }

        if (payFineDto.amount < transaction.fineAmount) {
            throw new BadRequestException(`Payment amount (${payFineDto.amount}) is less than fine amount (${transaction.fineAmount})`);
        }

        // Update transaction
        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                finePaid: true,
            },
            include: {
                book: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        // Create payment record
        await this.prisma.payment.create({
            data: {
                userId: transaction.userId,
                transactionId,
                amount: payFineDto.amount,
                paymentMethod: payFineDto.paymentMethod,
                paymentStatus: 'COMPLETED',
                lateFee: transaction.fineAmount,
                paymentDate: new Date(),
                notes: payFineDto.transactionId ? `Transaction ID: ${payFineDto.transactionId}` : undefined,
            },
        });

        return {
            success: true,
            message: 'Fine paid successfully',
            transaction: updated,
            amountPaid: payFineDto.amount,
        };
    }

    async getOverdueTransactions() {
        const overdueTransactions = await this.prisma.transaction.findMany({
            where: {
                status: {
                    in: [TransactionStatus.ISSUED, TransactionStatus.RENEWED],
                },
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        finePerDay: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'asc',
            },
        });

        // Calculate fines for each
        const withFines = overdueTransactions.map(transaction => {
            const daysOverdue = Math.ceil(
                (new Date().getTime() - transaction.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const calculatedFine = daysOverdue * transaction.book.finePerDay;

            return {
                ...transaction,
                daysOverdue,
                calculatedFine,
            };
        });

        return {
            count: withFines.length,
            transactions: withFines,
        };
    }

    async getTransactionStats(userId?: string) {
        const where = userId ? { userId } : {};

        const [
            totalTransactions,
            activeTransactions,
            returnedTransactions,
            overdueTransactions,
            totalFines,
            unpaidFines,
        ] = await Promise.all([
            this.prisma.transaction.count({ where }),
            this.prisma.transaction.count({
                where: {
                    ...where,
                    status: {
                        in: [TransactionStatus.ISSUED, TransactionStatus.RENEWED],
                    },
                },
            }),
            this.prisma.transaction.count({
                where: {
                    ...where,
                    status: TransactionStatus.RETURNED,
                },
            }),
            this.prisma.transaction.count({
                where: {
                    ...where,
                    status: {
                        in: [TransactionStatus.ISSUED, TransactionStatus.RENEWED],
                    },
                    dueDate: { lt: new Date() },
                },
            }),
            this.prisma.transaction.aggregate({
                where,
                _sum: { fineAmount: true },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    ...where,
                    finePaid: false,
                    fineAmount: { gt: 0 },
                },
                _sum: { fineAmount: true },
            }),
        ]);

        return {
            totalTransactions,
            activeTransactions,
            returnedTransactions,
            overdueTransactions,
            totalFines: totalFines._sum.fineAmount || 0,
            unpaidFines: unpaidFines._sum.fineAmount || 0,
        };
    }

    async cancelTransaction(transactionId: string) {
        const transaction = await this.findOne(transactionId);

        if (transaction.status === TransactionStatus.RETURNED) {
            throw new BadRequestException('Cannot cancel a returned transaction');
        }

        // Update book copy status back to available
        await this.prisma.bookCopy.update({
            where: { id: transaction.bookCopyId },
            data: { status: 'AVAILABLE' },
        });

        // Update book inventory
        await this.prisma.book.update({
            where: { id: transaction.bookId },
            data: {
                availableCopies: { increment: 1 },
            },
        });

        // Delete transaction
        await this.prisma.transaction.delete({
            where: { id: transactionId },
        });

        return {
            success: true,
            message: 'Transaction cancelled successfully',
        };
    }
}
