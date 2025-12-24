'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, ArrowLeft, BookOpen, RotateCcw } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function LibrarianDashboardPage() {
    return (
        <AuthGuard allowedRoles={['LIBRARIAN', 'ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Librarian Desk</h1>
                    <p className="text-gray-600">Manage daily book circulation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center space-y-4 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Issue Book</h2>
                        <p className="text-gray-500">Assign a book copy to a user.</p>
                        <Link href="/dashboard/librarian/issue">
                            <Button className="w-full">Go to Issue</Button>
                        </Link>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center space-y-4 hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <RotateCcw className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Return Book</h2>
                        <p className="text-gray-500">Process returned books and collect fines.</p>
                        <Link href="/dashboard/librarian/return">
                            <Button variant="outline" className="w-full">Go to Return</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
