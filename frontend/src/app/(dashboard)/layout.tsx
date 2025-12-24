import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <main className="ml-64 p-8">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
