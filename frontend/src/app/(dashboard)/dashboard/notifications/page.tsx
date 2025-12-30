'use client';

import { useRouter } from 'next/navigation';
import {
    useGetNotificationsQuery,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
    useDeleteNotificationMutation,
    useDeleteAllNotificationsMutation
} from '@/features/notifications/notificationsApi';
import { Button } from '@/components/ui/Button';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
    const router = useRouter();
    const { data, isLoading, error } = useGetNotificationsQuery();
    const [markAsRead] = useMarkNotificationReadMutation();
    const [markAllAsRead] = useMarkAllNotificationsReadMutation();
    const [deleteNotification] = useDeleteNotificationMutation();
    const [deleteAllNotifications] = useDeleteAllNotificationsMutation();

    const notifications = data?.data?.notifications || [];

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Navigate based on category
        switch (notification.category) {
            case 'BOOK_ISSUED':
            case 'BOOK_RETURNED':
            case 'DUE_REMINDER':
            case 'OVERDUE_NOTICE':
                router.push('/dashboard/books');
                break;
            case 'BORROW_REQUEST_CREATED':
                // For librarian
                router.push('/dashboard/librarian/requests');
                break;
            case 'BORROW_REQUEST_APPROVED':
            case 'BORROW_REQUEST_REJECTED':
                router.push('/dashboard/my-requests');
                break;
            case 'FINE_NOTICE':
            case 'PAYMENT_CONFIRMATION':
                router.push('/dashboard/books'); // Or maybe a payments history page if exists
                break;
            default:
                break;
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteNotification(id).unwrap();
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const handleClearAll = async () => {
        if (confirm('Are you sure you want to delete all notifications?')) {
            try {
                await deleteAllNotifications().unwrap();
                toast.success('All notifications cleared');
            } catch (error) {
                toast.error('Failed to clear notifications');
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead().unwrap();
            toast.success('All notifications marked as read');
        } catch (error) {
            toast.error('Failed to update notifications');
        }
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
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600">Stay updated with your library activity</p>
                </div>
                <div className="flex gap-2">
                    {notifications.length > 0 && (
                        <Button onClick={handleClearAll} variant="danger" size="sm">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                    {notifications.some((n: any) => !n.read) && (
                        <Button onClick={handleMarkAllRead} variant="outline" size="sm">
                            <Check className="w-4 h-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    Error loading notifications
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading notifications...</div>
                ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification: any) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 transition-colors cursor-pointer group relative ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
                                                {notification.category.replace(/_/g, ' ')}
                                            </span>
                                            {!notification.read && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                            )}
                                        </div>
                                        <h3 className={`font-bold text-gray-900 mb-1 ${!notification.read ? 'text-blue-900' : ''}`}>
                                            {notification.title}
                                        </h3>
                                        <p className="text-gray-600 mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                < Clock className="w-3 h-3" />
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
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
