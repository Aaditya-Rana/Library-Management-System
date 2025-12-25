import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../common/services/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationCategory, UserRole } from '@prisma/client';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let _prisma: PrismaService;

    const mockPrismaService = {
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockNotification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'IN_APP',
        category: NotificationCategory.BOOK_ISSUED,
        title: 'Book Issued',
        message: 'Your book has been issued',
        read: false,
        sentAt: new Date(),
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        _prisma = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotification', () => {
        it('should create a notification successfully', async () => {
            const createDto = {
                userId: 'user-1',
                category: NotificationCategory.BOOK_ISSUED,
                title: 'Book Issued',
                message: 'Your book has been issued',
            };

            mockPrismaService.notification.create.mockResolvedValue(mockNotification);

            const result = await service.createNotification(createDto);

            expect(result).toEqual(mockNotification);
            expect(mockPrismaService.notification.create).toHaveBeenCalled();
        });
    });

    describe('getUserNotifications', () => {
        it('should return paginated notifications for user', async () => {
            const queryDto = { page: 1, limit: 10 };
            const notifications = [mockNotification];

            mockPrismaService.notification.findMany.mockResolvedValue(notifications);
            mockPrismaService.notification.count.mockResolvedValue(1);

            const result = await service.getUserNotifications('user-1', queryDto, 'user-1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.data.notifications).toEqual(notifications);
            expect(result.data.pagination.total).toBe(1);
        });

        it('should allow admin to view any user notifications', async () => {
            mockPrismaService.notification.findMany.mockResolvedValue([mockNotification]);
            mockPrismaService.notification.count.mockResolvedValue(1);

            const result = await service.getUserNotifications('user-1', { page: 1, limit: 10 }, 'admin-1', UserRole.ADMIN);

            expect(result.success).toBe(true);
        });

        it('should throw ForbiddenException if user tries to access another user notifications', async () => {
            await expect(
                service.getUserNotifications('user-1', { page: 1, limit: 10 }, 'user-2', UserRole.USER)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread notification count', async () => {
            mockPrismaService.notification.count.mockResolvedValue(5);

            const result = await service.getUnreadCount('user-1', 'user-1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.data.unreadCount).toBe(5);
        });

        it('should allow admin to get unread count for any user', async () => {
            mockPrismaService.notification.count.mockResolvedValue(3);

            const result = await service.getUnreadCount('user-1', 'admin-1', UserRole.ADMIN);

            expect(result.success).toBe(true);
            expect(result.data.unreadCount).toBe(3);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read for owner', async () => {
            const readNotification = { ...mockNotification, read: true, readAt: new Date() };

            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.update.mockResolvedValue(readNotification);

            const result = await service.markAsRead('notif-1', 'user-1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.data.notification.read).toBe(true);
        });

        it('should throw NotFoundException if notification not found', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(null);

            await expect(service.markAsRead('invalid-id', 'user-1', UserRole.USER)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if user tries to mark another user notification', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

            await expect(service.markAsRead('notif-1', 'user-2', UserRole.USER)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should allow admin to mark any notification as read', async () => {
            const readNotification = { ...mockNotification, read: true, readAt: new Date() };
            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.update.mockResolvedValue(readNotification);

            const result = await service.markAsRead('notif-1', 'admin-1', UserRole.ADMIN);

            expect(result.success).toBe(true);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all user notifications as read', async () => {
            mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

            const result = await service.markAllAsRead('user-1', 'user-1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.data.count).toBe(3);
        });

        it('should throw ForbiddenException if user tries to mark all for another user', async () => {
            await expect(service.markAllAsRead('user-1', 'user-2', UserRole.USER)).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

            const result = await service.deleteNotification('notif-1', 'user-1', UserRole.USER);

            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted successfully');
        });

        it('should throw NotFoundException if notification not found', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(null);

            await expect(service.deleteNotification('invalid-id', 'user-1', UserRole.USER)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ForbiddenException if user tries to delete another user notification', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

            await expect(service.deleteNotification('notif-1', 'user-2', UserRole.USER)).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should allow admin to delete any notification', async () => {
            mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

            const result = await service.deleteNotification('notif-1', 'admin-1', UserRole.ADMIN);

            expect(result.success).toBe(true);
        });
    });

    describe('Helper Methods', () => {
        describe('sendBookIssuedNotification', () => {
            it('should create book issued notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendBookIssuedNotification('trans-1', 'user-1', 'The Great Gatsby');

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });

        describe('sendBookReturnedNotification', () => {
            it('should create book returned notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendBookReturnedNotification('trans-1', 'user-1', 'The Great Gatsby');

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });

        describe('sendPaymentConfirmationNotification', () => {
            it('should create payment confirmation notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendPaymentConfirmationNotification('user-1', 150, 'CASH');

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });

        describe('sendBookDueReminderNotification', () => {
            it('should create book due reminder notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendBookDueReminderNotification('trans-1', 'user-1', 'Book Title', new Date());

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });

        describe('sendBookOverdueNotification', () => {
            it('should create book overdue notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendBookOverdueNotification('trans-1', 'user-1', 'Book Title', 100);

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });

        describe('sendFineNoticeNotification', () => {
            it('should create fine notice notification', async () => {
                mockPrismaService.notification.create.mockResolvedValue(mockNotification);

                await service.sendFineNoticeNotification('user-1', 50, 'Book Title');

                expect(mockPrismaService.notification.create).toHaveBeenCalled();
            });
        });
    });
});
