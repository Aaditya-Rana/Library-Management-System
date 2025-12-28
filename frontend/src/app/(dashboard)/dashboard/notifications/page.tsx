'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNotifications, markAsRead, markAllAsRead } from '@/features/notifications/notificationsSlice';
import { Button } from '@/components/ui/Button';
import { Bell, Check } from 'lucide-react';

export default function NotificationsPage() {
    const dispatch = useAppDispatch();
    const { notifications, isLoading, error } = useAppSelector((state) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    const handleMarkAsRead = async (id: string) => {
        await dispatch(markAsRead(id));
    };

    const handleMarkAllAsRead = async () => {
        await dispatch(markAllAsRead());
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            BOOK_ISSUED: 'bg-green-100 text-green-800',
            BOOK_RETURNED: 'bg-blue-100 text-blue-800',
            DUE_REMINDER: 'bg-yellow-100 text-yellow-800',
            OVERDUE_NOTICE: 'bg-red-100 text-red-800',
            BORROW_REQUEST_APPROVED: 'bg-green-100 text-green-800',
            BORROW_REQUEST_REJECTED: 'bg-red-100 text-red-800',
            PAYMENT_CONFIRMATION: 'bg-purple-100 text-purple-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600">Stay updated with your library activity</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button onClick={handleMarkAllAsRead} variant="outline">
                        Mark all as read
                    </Button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-6 transition-colors ${!notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
                                                {notification.category.replace(/_/g, ' ')}
                                            </span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-1">
                                            {notification.title}
                                        </h3>
                                        <p className="text-gray-600 mb-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            <Check className="w-4 h-4 mr-1" />
                                            Mark as read
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-900">No notifications</p>
                        <p>You&apos;re all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
