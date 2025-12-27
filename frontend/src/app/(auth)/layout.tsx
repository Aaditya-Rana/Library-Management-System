import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Authentication',
    description: 'Sign in or create an account to access the Library Management System.',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {children}
        </div>
    );
}
