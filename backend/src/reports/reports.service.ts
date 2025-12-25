import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { QueryReportsDto, GroupByPeriod } from './dto/query-reports.dto';

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get dashboard overview statistics
     */
    async getDashboardStats() {
        const [
            totalBooks,
            totalUsers,
            totalTransactions,
            activeTransactions,
            overdueTransactions,
            pendingFines,
            todayIssued,
            todayReturned,
        ] = await Promise.all([
            this.prisma.book.count({ where: { isActive: true } }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.transaction.count(),
            this.prisma.transaction.count({ where: { status: 'ISSUED' } }),
            this.prisma.transaction.count({
                where: {
                    status: 'ISSUED',
                    dueDate: { lt: new Date() },
                },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    finePaid: false,
                    fineAmount: { gt: 0 },
                },
                _sum: { fineAmount: true },
            }),
            this.prisma.transaction.count({
                where: {
                    issueDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            this.prisma.transaction.count({
                where: {
                    returnDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                    status: 'RETURNED',
                },
            }),
        ]);

        const availableBooks = await this.prisma.book.aggregate({
            where: { isActive: true },
            _sum: { availableCopies: true },
        });

        return {
            success: true,
            data: {
                overview: {
                    totalBooks,
                    totalUsers,
                    totalTransactions,
                    activeTransactions,
                    overdueTransactions,
                    availableBooks: availableBooks._sum.availableCopies || 0,
                },
                financial: {
                    pendingFines: pendingFines._sum.fineAmount || 0,
                },
                today: {
                    booksIssued: todayIssued,
                    booksReturned: todayReturned,
                },
            },
        };
    }

    /**
     * Get most active users (by transaction count)
     */
    async getActiveUsers(queryDto: QueryReportsDto) {
        const { startDate, endDate, limit = 10 } = queryDto;

        const where: any = {};
        if (startDate || endDate) {
            where.issueDate = {};
            if (startDate) where.issueDate.gte = new Date(startDate);
            if (endDate) where.issueDate.lte = new Date(endDate);
        }

        const activeUsers = await this.prisma.transaction.groupBy({
            by: ['userId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });

        const usersWithDetails = await Promise.all(
            activeUsers.map(async (item) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: item.userId },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        membershipType: true,
                    },
                });
                return {
                    ...user,
                    transactionCount: item._count.id,
                };
            }),
        );

        return {
            success: true,
            data: {
                users: usersWithDetails,
            },
        };
    }

    /**
     * Get users with overdue books
     */
    async getOverdueUsers() {
        const overdueTransactions = await this.prisma.transaction.findMany({
            where: {
                status: 'ISSUED',
                dueDate: { lt: new Date() },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                    },
                },
                book: {
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });

        const usersMap = new Map();
        overdueTransactions.forEach((transaction) => {
            if (!usersMap.has(transaction.userId)) {
                usersMap.set(transaction.userId, {
                    user: transaction.user,
                    overdueBooks: [],
                    totalFines: 0,
                });
            }
            const userData = usersMap.get(transaction.userId);
            const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(transaction.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            userData.overdueBooks.push({
                book: transaction.book,
                dueDate: transaction.dueDate,
                daysOverdue,
                fine: transaction.fineAmount,
            });
            userData.totalFines += transaction.fineAmount || 0;
        });

        return {
            success: true,
            data: {
                overdueUsers: Array.from(usersMap.values()),
                totalOverdueCount: usersMap.size,
            },
        };
    }

    /**
     * Get most popular (borrowed) books
     */
    async getPopularBooks(queryDto: QueryReportsDto) {
        const { startDate, endDate, limit = 10, category, genre } = queryDto;

        const where: any = {};
        if (startDate || endDate) {
            where.issueDate = {};
            if (startDate) where.issueDate.gte = new Date(startDate);
            if (endDate) where.issueDate.lte = new Date(endDate);
        }

        const popularBooks = await this.prisma.transaction.groupBy({
            by: ['bookId'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });

        const booksWithDetails = await Promise.all(
            popularBooks.map(async (item) => {
                const book = await this.prisma.book.findUnique({
                    where: { id: item.bookId },
                    select: {
                        id: true,
                        title: true,
                        author: true,
                        isbn: true,
                        category: true,
                        genre: true,
                        coverImageUrl: true,
                        availableCopies: true,
                        totalCopies: true,
                    },
                });

                // Filter by category/genre if specified
                if (category && book?.category !== category) return null;
                if (genre && book?.genre !== genre) return null;

                return {
                    ...book,
                    borrowCount: item._count.id,
                };
            }),
        );

        return {
            success: true,
            data: {
                books: booksWithDetails.filter((b) => b !== null),
            },
        };
    }

    /**
     * Get book circulation statistics
     */
    async getCirculationStats(queryDto: QueryReportsDto) {
        const { startDate, endDate, groupBy = GroupByPeriod.MONTH } = queryDto;

        const where: any = {};
        if (startDate || endDate) {
            where.issueDate = {};
            if (startDate) where.issueDate.gte = new Date(startDate);
            if (endDate) where.issueDate.lte = new Date(endDate);
        }

        const transactions = await this.prisma.transaction.findMany({
            where,
            select: {
                issueDate: true,
                returnDate: true,
                status: true,
            },
        });

        // Group by period
        const circulationMap = new Map();
        transactions.forEach((transaction) => {
            const date = new Date(transaction.issueDate);
            let key: string;

            switch (groupBy) {
                case GroupByPeriod.DAY:
                    key = date.toISOString().split('T')[0];
                    break;
                case GroupByPeriod.WEEK: {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                }
                case GroupByPeriod.MONTH:
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case GroupByPeriod.YEAR:
                    key = String(date.getFullYear());
                    break;
            }

            if (!circulationMap.has(key)) {
                circulationMap.set(key, {
                    period: key,
                    issued: 0,
                    returned: 0,
                    active: 0,
                });
            }

            const data = circulationMap.get(key);
            data.issued++;
            if (transaction.status === 'RETURNED') {
                data.returned++;
            } else {
                data.active++;
            }
        });

        return {
            success: true,
            data: {
                circulation: Array.from(circulationMap.values()).sort((a, b) =>
                    a.period.localeCompare(b.period),
                ),
            },
        };
    }

    /**
     * Get financial summary
     */
    async getFinancialSummary(queryDto: QueryReportsDto) {
        const { startDate, endDate } = queryDto;

        const where: any = {};
        if (startDate || endDate) {
            where.paymentDate = {};
            if (startDate) where.paymentDate.gte = new Date(startDate);
            if (endDate) where.paymentDate.lte = new Date(endDate);
        }

        const [totalCollected, finesPaid, payments] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { ...where, paymentStatus: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: { ...where, paymentStatus: 'COMPLETED' },
                _sum: { lateFee: true },
            }),
            this.prisma.payment.groupBy({
                by: ['paymentMethod'],
                where: { ...where, paymentStatus: 'COMPLETED' },
                _count: { id: true },
                _sum: { amount: true },
            }),
        ]);

        const pendingFines = await this.prisma.transaction.aggregate({
            where: {
                finePaid: false,
                fineAmount: { gt: 0 },
            },
            _sum: { fineAmount: true },
            _count: { id: true },
        });

        return {
            success: true,
            data: {
                totalRevenue: totalCollected._sum.amount || 0,
                totalFinesCollected: finesPaid._sum.lateFee || 0,
                pendingFines: pendingFines._sum.fineAmount || 0,
                pendingFineCount: pendingFines._count.id,
                paymentsByMethod: payments.map((p) => ({
                    method: p.paymentMethod,
                    count: p._count.id,
                    amount: p._sum.amount || 0,
                })),
            },
        };
    }

    /**
     * Get category-wise book distribution
     */
    async getCategoryDistribution() {
        const distribution = await this.prisma.book.groupBy({
            by: ['category'],
            where: { isActive: true },
            _count: { id: true },
            _sum: { totalCopies: true, availableCopies: true },
        });

        return {
            success: true,
            data: {
                categories: distribution.map((item) => ({
                    category: item.category,
                    bookCount: item._count.id,
                    totalCopies: item._sum.totalCopies || 0,
                    availableCopies: item._sum.availableCopies || 0,
                })),
            },
        };
    }

    /**
     * Get low circulation books (least borrowed)
     */
    async getLowCirculationBooks(limit: number = 10) {
        // Get all books with their transaction counts
        const allBooks = await this.prisma.book.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                category: true,
                genre: true,
                totalCopies: true,
                availableCopies: true,
                _count: {
                    select: { transactions: true },
                },
            },
            orderBy: {
                transactions: { _count: 'asc' },
            },
            take: limit,
        });

        return {
            success: true,
            data: {
                books: allBooks.map((book) => ({
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn,
                    category: book.category,
                    genre: book.genre,
                    totalCopies: book.totalCopies,
                    availableCopies: book.availableCopies,
                    borrowCount: book._count.transactions,
                })),
            },
        };
    }
}
