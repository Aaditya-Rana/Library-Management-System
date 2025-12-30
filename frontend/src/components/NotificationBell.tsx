'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/features/notifications/notificationsApi';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Notification } from '@/types';

export function NotificationBell() {
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);
    const { data, isLoading } = useGetNotificationsQuery(undefined, {
        pollingInterval: 30000, // Poll every 30 seconds
    });
    const [markAsRead] = useMarkNotificationReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsReadMutation();
    const [isOpen, setIsOpen] = useState(false);

    const notifications = data?.data?.notifications || [];
    const unreadCount = notifications.filter((n: Notification) => !n.read).length;

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);

        // Redirect logic based on notification category
        switch (notification.category) {
            // Transaction related - go to history/transactions
            case 'BOOK_ISSUED':
            case 'BOOK_RETURNED':
                router.push('/dashboard/history');
                break;

            // Fines/Overdue - go to payments
            case 'FINE_NOTICE':
            case 'OVERDUE_NOTICE':
            case 'PAYMENT_CONFIRMATION':
                router.push('/dashboard/payments');
                break;

            // Borrow Requests
            case 'BORROW_REQUEST_CREATED':
                if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'LIBRARIAN') {
                    router.push('/dashboard/librarian/requests');
                } else {
                    router.push('/dashboard/my-requests');
                }
                break;
            case 'BORROW_REQUEST_APPROVED':
            case 'BORROW_REQUEST_REJECTED':
                router.push('/dashboard/my-requests');
                break;

            // Delivery
            case 'DELIVERY_UPDATE':
                // If we had a delivery page, we'd go there. For now history is best guess
                router.push('/dashboard/history');
                break;

            default:
                // Fallback
                break;
        }
    };

    const recentNotifications = notifications.slice(0, 5);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {isLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading...</div>
                            ) : recentNotifications.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {recentNotifications.map((notification: Notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                        className="text-primary-600 hover:text-primary-700 flex-shrink-0"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p>No notifications</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 5 && (
                            <div className="p-3 border-t border-gray-200">
                                <Link
                                    href="/dashboard/notifications"
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View all notifications
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
