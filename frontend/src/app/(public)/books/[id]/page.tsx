'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BorrowRequestButton } from '@/components/BorrowRequestButton';
import { useAppSelector } from '@/store/hooks';
import { BookOpen, Calendar, Star, Info, Layers, Book as BookIcon } from 'lucide-react';
import { useGetBookQuery } from '@/features/books/booksApi';

export default function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data, isLoading } = useGetBookQuery(id);
    const book = data?.data;

    const { isAuthenticated } = useAppSelector((state) => state.auth);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-96 bg-gray-200 rounded-xl mb-8"></div>
                <div className="h-8 bg-gray-200 w-1/3 mb-4 rounded"></div>
                <div className="h-4 bg-gray-200 w-full mb-2 rounded"></div>
                <div className="h-4 bg-gray-200 w-2/3 rounded"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Book not found</h2>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
                    {/* Cover Image */}
                    <div className="md:col-span-1">
                        <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-md bg-gray-100">
                            {book.coverImage ? (
                                <img
                                    src={book.coverImage}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <BookOpen className="w-20 h-20" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            <BorrowRequestButton
                                bookId={book.id}
                                bookTitle={book.title}
                                availableCopies={book.availableCopies}
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <div className="flex items-center mb-2">
                                <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">{book.category || 'General'}</span>
                                <div className="ml-3 flex items-center text-amber-500 text-sm font-medium">
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    4.5
                                </div>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
                            <p className="text-xl text-gray-600">by {book.author}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Layers className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Copies</p>
                                <p className="font-semibold text-gray-900">{book.availableCopies} / {book.totalCopies}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Calendar className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 uppercase tracking-wide">ISBN</p>
                                <p className="font-semibold text-gray-900">{book.isbn}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <BookIcon className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Publisher</p>
                                <p className="font-semibold text-gray-900 truncate">{book.publisher || 'N/A'}</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <Info className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                                <p className="text-xs text-gray-500 uppercase tracking-wide">ID</p>
                                <p className="font-semibold text-gray-900 truncate max-w-[100px] mx-auto" title={book.id}>{book.id.substring(0, 8)}...</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                            <div
                                className="text-gray-600 leading-relaxed prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: book.description || 'No description available.' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
