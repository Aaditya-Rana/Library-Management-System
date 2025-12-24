'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBooks, deleteBook } from '@/features/books/booksSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Edit2, Trash2, Copy, Upload } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AdminBooksPage() {
    const dispatch = useAppDispatch();
    const { books, isLoading } = useAppSelector((state) => state.books);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(fetchBooks({ search, limit: 50 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [search, dispatch]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this book?')) {
            await dispatch(deleteBook(id));
        }
    };

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Books</h1>
                        <p className="text-gray-600">Add, edit, or remove books from territory.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dashboard/admin/books/import">
                            <Button variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Import
                            </Button>
                        </Link>
                        <Link href="/dashboard/admin/books/add">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Book
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="relative max-w-md">
                        <Input
                            placeholder="Search by title, author, or ISBN..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading books...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Author</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Copies (Avail/Total)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {books.map((book) => (
                                    <tr key={book.id}>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{book.title}</div>
                                            <div className="text-sm text-gray-500">{book.author}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                                            {book.isbn}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {book.availableCopies} / {book.totalCopies}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center">
                                                <Link href={`/dashboard/admin/books/${book.id}/copies`} className="text-primary-600 hover:text-primary-900 mr-3" title="Manage Copies">
                                                    <Copy className="w-4 h-4" />
                                                </Link>
                                                <Link href={`/dashboard/admin/books/edit/${book.id}`} className="text-blue-600 hover:text-blue-900 mr-3" title="Edit">
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(book.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
