'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import api from '@/services/api';
import { ArrowRight, BookOpen, Search, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Book {
  id: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  averageRating?: number;
}
import { useAppSelector } from '@/store/hooks';

export default function HomePage() {
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchPopularBooks = async () => {
      try {
        // Fetch books for everyone (public home page)
        const response = await api.get('/books?limit=4');
        setPopularBooks(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch books', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopularBooks();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-900 to-primary-700 py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight mb-6"
          >
            Discover Your Next <br className="hidden sm:block" />
            <span className="text-primary-200">Great Adventure</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto mb-10"
          >
            Access thousands of books, research papers, and periodicals from the comfort of your home.
            Join our community of readers today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-4"
          >
            <Link href="/books">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Browse Collection
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Become a Member
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Popular Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Popular Books</h2>
            <p className="mt-2 text-gray-600">The most borrowed books this month.</p>
          </div>
          <Link href="/books">
            <Button variant="ghost" className="text-primary-600 hover:text-primary-700">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="bg-gray-200 h-64 rounded-xl w-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : popularBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {popularBooks.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:-translate-y-1">
                  <div className="aspect-[2/3] relative bg-gray-100 overflow-hidden">
                    {book.coverImageUrl ? (
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white font-medium text-sm">View Details</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary-600 truncate transition-colors">{book.title}</h3>
                    <p className="text-sm text-gray-500 truncate">{book.author}</p>
                    <div className="mt-2 flex items-center text-amber-500 text-sm">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      <span>{book.averageRating || 4.5}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features/Stats Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Extensive Collection</h3>
              <p className="text-gray-600">Access thousands of physical and digital books across various genres.</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Easy Search</h3>
              <p className="text-gray-600">Find exactly what you&apos;re looking for with our advanced search filters.</p>
            </div>
            <div className="p-6">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Premium Experience</h3>
              <p className="text-gray-600">Enjoy seamless borrowing, renewals, and delivery services.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
