'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchBooks } from '@/features/books/booksSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BookOpen, Star, Filter, Search, Loader2 } from 'lucide-react';
import Pagination from '@/components/Pagination';

function BookListingContent() {
    const dispatch = useAppDispatch();
    const { books, isLoading, pagination } = useAppSelector((state) => state.books);
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const searchParams = useSearchParams();

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        genre: searchParams.get('genre') || '',
        availability: searchParams.get('availability') || '',
    });
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
    const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit') || '20'));

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [filters.search]);

    useEffect(() => {
        // Fetch books when filters change (with debounced search)
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
        };
        if (debouncedSearch) params.search = debouncedSearch;
        if (filters.genre) params.genre = filters.genre;
        if (filters.availability) params.availability = filters.availability;
        dispatch(fetchBooks(params));
    }, [dispatch, debouncedSearch, filters.genre, filters.availability, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleItemsPerPageChange = (limit: number) => {
        setItemsPerPage(limit);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filter changes
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Browse Books</h1>
                    <p className="text-gray-600 mt-1">Found {books.length} results</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Filter className="w-4 h-4 mr-2" /> Filters
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Title or Author..."
                                        value={filters.search}
                                        onChange={(e) => handleFilterChange('search', e.target.value)}
                                        className="pl-8"
                                    />
                                    <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Genre</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-2 px-3 border"
                                    value={filters.genre}
                                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                                >
                                    <option value="">All Genres</option>
                                    <option value="Fiction">Fiction</option>
                                    <option value="Non-Fiction">Non-Fiction</option>
                                    <option value="Science">Science</option>
                                    <option value="History">History</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Availability</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-2 px-3 border"
                                    value={filters.availability}
                                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                                >
                                    <option value="">Any Status</option>
                                    <option value="available">Available Now</option>
                                    <option value="unavailable">Out of Stock</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-gray-100">
                                    <div className="bg-gray-200 h-48 rounded-lg mb-4 w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : books.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {books.map((book) => (
                                <Link key={book.id} href={`/books/${book.id}`}>
                                    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="aspect-[2/3] relative bg-gray-100">
                                            {book.coverImage ? (
                                                <img
                                                    src={book.coverImage}
                                                    alt={book.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <BookOpen className="w-12 h-12" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                                {book.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center text-amber-500">
                                                    <Star className="w-4 h-4 fill-current mr-1" />
                                                    <span>N/A</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${book.availableCopies > 0
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No books found</h3>
                            <p className="text-gray-500">Try adjusting your search criteria</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.total}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BookListingPage() {
    return (
        <Suspense fallback={<div>Loading books...</div>}>
            <BookListingContent />
        </Suspense>
    );
}
