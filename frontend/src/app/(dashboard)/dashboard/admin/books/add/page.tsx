'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft } from 'lucide-react';
import BookForm, { BookFormData } from '@/components/admin/BookForm';
import toast from 'react-hot-toast';

export default function AddBookPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (formData: BookFormData) => {
        setIsLoading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (key === 'coverImage') {
                if (value instanceof File) {
                    data.append('coverImage', value);
                }
            } else {
                data.append(key, String(value));
            }
        });

        try {
            const response = await api.post('/books', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newBook = response.data.data;

            // Add initial copies if specified
            if (formData.totalCopies > 0 && newBook?.id) {
                try {
                    await api.post(`/books/${newBook.id}/copies`, {
                        numberOfCopies: Number(formData.totalCopies)
                    });
                } catch (copyError) {
                    console.error('Failed to add initial copies', copyError);
                    toast.error('Book created, but failed to add initial copies.');
                }
            }

            toast.success('Book created successfully');
            router.push('/dashboard/admin/books');
        } catch (error) {
            console.error('Failed to add book', error);
            toast.error('Failed to add book');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-5xl mx-auto space-y-6 pb-12">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Book</h1>
                </div>

                <BookForm
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    submitLabel="Create Book"
                    onCancel={() => router.back()}
                />
            </div>
        </AuthGuard>
    );
}
