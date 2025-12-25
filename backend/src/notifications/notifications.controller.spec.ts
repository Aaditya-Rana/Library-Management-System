import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationCategory, UserRole } from '@prisma/client';

describe('NotificationsController', () => {
    let controller: NotificationsController;
    let service: NotificationsService;

    const mockNotificationsService = {
        getUserNotifications: jest.fn(),
        getUnreadCount: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        deleteNotification: jest.fn(),
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: UserRole.USER,
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
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        controller = module.get<NotificationsController>(NotificationsController);
        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserNotifications', () => {
        it('should return paginated notifications', async () => {
            const queryDto = { page: 1, limit: 10 };
            const expectedResult = {
                success: true,
                data: {
                    notifications: [mockNotification],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                    },
                },
            };

            mockNotificationsService.getUserNotifications.mockResolvedValue(expectedResult);

            const result = await controller.getUserNotifications(queryDto, mockUser.id, mockUser.role);

            expect(result).toEqual(expectedResult);
            expect(service.getUserNotifications).toHaveBeenCalledWith('user-1', queryDto, 'user-1', UserRole.USER);
        });

        it('should handle filtering by read status', async () => {
            const queryDto = { page: 1, limit: 10, read: false };
            const expectedResult = {
                success: true,
                data: {
                    notifications: [mockNotification],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                    },
                },
            };

            mockNotificationsService.getUserNotifications.mockResolvedValue(expectedResult);

            const result = await controller.getUserNotifications(queryDto, mockUser.id, mockUser.role);

            expect(result.success).toBe(true);
            expect(service.getUserNotifications).toHaveBeenCalledWith('user-1', queryDto, 'user-1', UserRole.USER);
        });

        it('should handle filtering by category', async () => {
            const queryDto = { page: 1, limit: 10, category: NotificationCategory.BOOK_ISSUED };
            const expectedResult = {
                success: true,
                data: {
                    notifications: [mockNotification],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 1,
                        totalPages: 1,
                    },
                },
            };

            mockNotificationsService.getUserNotifications.mockResolvedValue(expectedResult);

            await controller.getUserNotifications(queryDto, mockUser.id, mockUser.role);

            expect(service.getUserNotifications).toHaveBeenCalledWith('user-1', queryDto, 'user-1', UserRole.USER);
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread notification count', async () => {
            const expectedResult = {
                success: true,
                data: { unreadCount: 5 },
            };

            mockNotificationsService.getUnreadCount.mockResolvedValue(expectedResult);

            const result = await controller.getUnreadCount(mockUser.id, mockUser.role);

            expect(result).toEqual(expectedResult);
            expect(service.getUnreadCount).toHaveBeenCalledWith('user-1', 'user-1', UserRole.USER);
        });

        it('should return 0 when no unread notifications', async () => {
            const expectedResult = {
                success: true,
                data: { unreadCount: 0 },
            };

            mockNotificationsService.getUnreadCount.mockResolvedValue(expectedResult);

            const result = await controller.getUnreadCount(mockUser.id, mockUser.role);

            expect(result.data.unreadCount).toBe(0);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const readNotification = { ...mockNotification, read: true, readAt: new Date() };
            const expectedResult = {
                success: true,
                message: 'Notification marked as read',
                data: {
                    notification: readNotification,
                },
            };

            mockNotificationsService.markAsRead.mockResolvedValue(expectedResult);

            const result = await controller.markAsRead('notif-1', mockUser.id, mockUser.role);

            expect(result.success).toBe(true);
            expect(result.message).toContain('marked as read');
            expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1', UserRole.USER);
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            const expectedResult = {
                success: true,
                message: 'All notifications marked as read',
                data: { count: 3 },
            };

            mockNotificationsService.markAllAsRead.mockResolvedValue(expectedResult);

            const result = await controller.markAllAsRead(mockUser.id, mockUser.role);

            expect(result.success).toBe(true);
            expect(result.data.count).toBe(3);
            expect(service.markAllAsRead).toHaveBeenCalledWith('user-1', 'user-1', UserRole.USER);
        });

        it('should handle when no notifications are marked', async () => {
            const expectedResult = {
                success: true,
                message: 'All notifications marked as read',
                data: { count: 0 },
            };

            mockNotificationsService.markAllAsRead.mockResolvedValue(expectedResult);

            const result = await controller.markAllAsRead(mockUser.id, mockUser.role);

            expect(result.data.count).toBe(0);
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification successfully', async () => {
            const expectedResult = {
                success: true,
                message: 'Notification deleted successfully'
            };

            mockNotificationsService.deleteNotification.mockResolvedValue(expectedResult);

            const result = await controller.deleteNotification('notif-1', mockUser.id, mockUser.role);

            expect(result.success).toBe(true);
            expect(result.message).toContain('deleted successfully');
            expect(service.deleteNotification).toHaveBeenCalledWith('notif-1', 'user-1', UserRole.USER);
        });
    });
});
