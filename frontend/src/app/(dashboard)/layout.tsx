import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Manage your books, borrowing requests, payments, and profile in the Library Management System.',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <DashboardHeader />
                <main className="lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
