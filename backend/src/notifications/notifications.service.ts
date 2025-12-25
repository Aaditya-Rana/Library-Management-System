import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { UserRole, NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async createNotification(dto: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: dto.userId,
                type: dto.type,
                category: dto.category,
                title: dto.title,
                message: dto.message,
                sentAt: new Date(),
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

        return notification;
    }

    async getUserNotifications(
        userId: string,
        queryDto: QueryNotificationsDto,
        requestingUserId: string,
        role: UserRole,
    ) {
        // Authorization: Users can only view their own notifications
        // Librarians and admins can view any user's notifications
        if (
            role === UserRole.USER &&
            userId !== requestingUserId
        ) {
            throw new ForbiddenException(
                'You can only view your own notifications',
            );
        }

        const { page = 1, limit = 20, read, category, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: {
            userId: string;
            read?: boolean;
            category?: NotificationCategory;
        } = { userId };

        if (read !== undefined) {
            where.read = read;
        }

        if (category) {
            where.category = category;
        }

        // Get notifications
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy as string]: sortOrder },
            }),
            this.prisma.notification.count({ where }),
        ]);

        return {
            success: true,
            data: {
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        };
    }

    async getUnreadCount(
        userId: string,
        requestingUserId: string,
        role: UserRole,
    ) {
        // Authorization check
        if (
            role === UserRole.USER &&
            userId !== requestingUserId
        ) {
            throw new ForbiddenException(
                'You can only view your own notifications',
            );
        }

        const count = await this.prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });

        return {
            success: true,
            data: { unreadCount: count },
        };
    }

    async markAsRead(
        notificationId: string,
        userId: string,
        role: UserRole,
    ) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        // Authorization: Users can only mark their own notifications as read
        if (
            role === UserRole.USER &&
            notification.userId !== userId
        ) {
            throw new ForbiddenException(
                'You can only mark your own notifications as read',
            );
        }

        const updatedNotification = await this.prisma.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });

        return {
            success: true,
            message: 'Notification marked as read',
            data: { notification: updatedNotification },
        };
    }

    async markAllAsRead(
        userId: string,
        requestingUserId: string,
        role: UserRole,
    ) {
        // Authorization check
        if (
            role === UserRole.USER &&
            userId !== requestingUserId
        ) {
            throw new ForbiddenException(
                'You can only mark your own notifications as read',
            );
        }

        const result = await this.prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
            },
        });

        return {
            success: true,
            message: `${result.count} notifications marked as read`,
            data: { count: result.count },
        };
    }

    async deleteNotification(
        notificationId: string,
        userId: string,
        role: UserRole,
    ) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        // Authorization: Users can only delete their own notifications
        // Admins can delete any notification
        if (
            role === UserRole.USER &&
            notification.userId !== userId
        ) {
            throw new ForbiddenException(
                'You can only delete your own notifications',
            );
        }

        await this.prisma.notification.delete({
            where: { id: notificationId },
        });

        return {
            success: true,
            message: 'Notification deleted successfully',
        };
    }

    // Helper method for transaction notifications
    async sendBookIssuedNotification(transactionId: string, userId: string, bookTitle: string) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.BOOK_ISSUED,
            title: 'Book Issued',
            message: `Your book "${bookTitle}" has been issued successfully. Please return it by the due date to avoid fines.`,
        });
    }

    async sendBookReturnedNotification(transactionId: string, userId: string, bookTitle: string) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.BOOK_RETURNED,
            title: 'Book Returned',
            message: `Your book "${bookTitle}" has been returned successfully. Thank you!`,
        });
    }

    async sendBookDueReminderNotification(transactionId: string, userId: string, bookTitle: string, dueDate: Date) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.DUE_REMINDER,
            title: 'Book Due Soon',
            message: `Reminder: Your book "${bookTitle}" is due on ${dueDate.toDateString()}. Please return it on time to avoid fines.`,
        });
    }

    async sendBookOverdueNotification(transactionId: string, userId: string, bookTitle: string, fineAmount: number) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.OVERDUE_NOTICE,
            title: 'Book Overdue',
            message: `Your book "${bookTitle}" is overdue. Current fine: ₹${fineAmount}. Please return the book as soon as possible.`,
        });
    }

    async sendPaymentConfirmationNotification(userId: string, amount: number, paymentMethod: string) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.PAYMENT_CONFIRMATION,
            title: 'Payment Received',
            message: `Your payment of ₹${amount} via ${paymentMethod} has been recorded successfully.`,
        });
    }

    async sendFineNoticeNotification(userId: string, amount: number, bookTitle: string) {
        return this.createNotification({
            userId,
            type: NotificationType.IN_APP,
            category: NotificationCategory.FINE_NOTICE,
            title: 'Fine Assessed',
            message: `A fine of ₹${amount} has been assessed for the book "${bookTitle}". Please pay at the library counter.`,
        });
    }
}
