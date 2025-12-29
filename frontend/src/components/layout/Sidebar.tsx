'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
    LayoutDashboard,
    Book,
    Users,
    FileText,
    Settings,
    History,
    BookOpen,
    RotateCcw,
    ClipboardList,
    DollarSign,
    Menu,
    X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAppSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);

    const role = user?.role || 'USER';

    const commonLinks = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Books', href: '/dashboard/books', icon: BookOpen },
        { name: 'My Requests', href: '/dashboard/my-requests', icon: ClipboardList },
        { name: 'Payments', href: '/dashboard/payments', icon: DollarSign },
        { name: 'History', href: '/dashboard/history', icon: History },
        { name: 'Profile', href: '/dashboard/profile', icon: Settings },
    ];

    const adminLinks = [
        { name: 'Manage Users', href: '/dashboard/admin/users', icon: Users },
        { name: 'Manage Books', href: '/dashboard/admin/books', icon: Book },
        { name: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    ];

    const librarianLinks = [
        { name: 'Librarian Desk', href: '/dashboard/librarian', icon: LayoutDashboard },
        { name: 'Issue Book', href: '/dashboard/librarian/issue', icon: BookOpen },
        { name: 'Return Book', href: '/dashboard/librarian/return', icon: RotateCcw },
        { name: 'Requests', href: '/dashboard/librarian/requests', icon: ClipboardList },
        { name: 'Record Payment', href: '/dashboard/librarian/record-payment', icon: DollarSign },
    ];

    let links = commonLinks;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        links = [...commonLinks, ...adminLinks];
    } else if (role === 'LIBRARIAN') {
        links = [...commonLinks, ...librarianLinks];
    }

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors"
                aria-label="Toggle menu"
            >
                {isOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={clsx(
                    'flex flex-col w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto',
                    'fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out',
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-center h-16 border-b border-gray-200">
                    <Link href="/" className="flex items-center space-x-2" onClick={closeSidebar}>
                        <div className="bg-primary-600 rounded-lg p-1.5 text-white">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                            LMS
                        </span>
                    </Link>
                </div>

                <div className="flex-grow p-4 space-y-2">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeSidebar}
                                className={clsx(
                                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                    'active:scale-95',
                                    isActive
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex-col">
                            <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
