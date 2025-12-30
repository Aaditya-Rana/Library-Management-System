'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGetBooksQuery, useDeleteBookMutation } from '@/features/books/booksApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, ChevronRight, Plus, Search, Edit2, Trash2, Copy, Upload } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import BulkImportModal from '@/components/BulkImportModal';
import toast from 'react-hot-toast';

export default function AdminBooksPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounced(search);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // RTK Query hooks
    const { data, isLoading, refetch } = useGetBooksQuery({
        search: searchDebounced,
        page,
        limit: 10
    });

    const [deleteBook] = useDeleteBookMutation();

    const books = data?.data || [];

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this book?')) {
            try {
                await deleteBook(id).unwrap();
                toast.success('Book deleted successfully');
            } catch (error: any) {
                toast.error(error?.data?.message || 'Failed to delete book');
            }
        }
    };

    const handleBulkImportSuccess = () => {
        refetch(); // Manually refetch after bulk import since it might be outside RTK Query cache invalidation
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
                        <Button variant="outline" onClick={() => setShowBulkImport(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Bulk Import
                        </Button>
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

                    {/* Pagination Controls */}
                    {data?.meta && data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                                    disabled={page === data.meta.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data.meta.total)}</span> of{' '}
                                        <span className="font-medium">{data.meta.total}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => setPage(Math.max(1, page - 1))}
                                            disabled={page === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                            Page {page} of {data.meta.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                                            disabled={page === data.meta.totalPages}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <BulkImportModal
                isOpen={showBulkImport}
                onClose={() => setShowBulkImport(false)}
                onSuccess={handleBulkImportSuccess}
            />
        </AuthGuard>
    );
}
