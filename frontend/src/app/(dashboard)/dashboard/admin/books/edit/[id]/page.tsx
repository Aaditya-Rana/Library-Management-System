'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function EditBookPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        genre: '',
        category: '',
        bookValue: 0,
        description: '',
        coverImageUrl: ''
    });

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const response = await api.get(`/books/${params.id}`);
                const book = response.data.data;
                setFormData({
                    isbn: book.isbn || '',
                    title: book.title || '',
                    author: book.author || '',
                    publisher: book.publisher || '',
                    publicationYear: book.publicationYear || new Date().getFullYear(),
                    genre: book.genre || '',
                    category: book.category || '',
                    bookValue: book.bookValue || 0,
                    description: book.description || '',
                    coverImageUrl: book.coverImageUrl || ''
                });
            } catch (error) {
                console.error('Failed to fetch book', error);
                alert('Failed to load book details');
                router.push('/dashboard/admin/books');
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchBook();
        }
    }, [params.id, router]);

    const handleChange = (e: any) => {
        const val = e.target.type === 'number'
            ? (e.target.value === '' ? '' : parseFloat(e.target.value))
            : e.target.value;
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.patch(`/books/${params.id}`, formData);
            router.push('/dashboard/admin/books');
        } catch (error) {
            console.error('Failed to update book', error);
            alert('Failed to update book');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Book</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="ISBN" name="isbn" required value={formData.isbn} onChange={handleChange} />
                        <Input label="Title" name="title" required value={formData.title} onChange={handleChange} />
                        <Input label="Author" name="author" required value={formData.author} onChange={handleChange} />
                        <Input label="Publisher" name="publisher" required value={formData.publisher} onChange={handleChange} />

                        <Input
                            label="Publication Year"
                            name="publicationYear"
                            type="number"
                            required
                            value={formData.publicationYear}
                            onChange={handleChange}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                            <select
                                name="genre"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 border px-3 py-2 text-sm"
                                value={formData.genre}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Genre</option>
                                <option value="Fiction">Fiction</option>
                                <option value="Non-Fiction">Non-Fiction</option>
                                <option value="Science">Science</option>
                                <option value="History">History</option>
                            </select>
                        </div>

                        <Input label="Category" name="category" required value={formData.category} onChange={handleChange} />

                        <Input
                            label="Book Value (₹)"
                            name="bookValue"
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={formData.bookValue}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <RichTextEditor
                            label="Description"
                            value={formData.description}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Book Cover</h3>
                        <div className="flex items-start gap-6">
                            <div className="w-32 h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                {formData.coverImageUrl ? (
                                    <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Update Cover Image</label>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const uploadData = new FormData();
                                        uploadData.append('coverImage', file);

                                        try {
                                            const res = await api.post(`/books/${params.id}/cover`, uploadData, {
                                                headers: { 'Content-Type': 'multipart/form-data' }
                                            });
                                            alert('Cover image uploaded successfully!');
                                            setFormData(prev => ({ ...prev, coverImageUrl: res.data.data.coverImageUrl || res.data.data.url }));
                                        } catch (error) {
                                            console.error('Upload failed', error);
                                            alert('Failed to upload cover image');
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500">Supported formats: JPEG, PNG, WebP. Max size: 5MB.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" isLoading={isSaving}>Save Changes</Button>
                    </div>
                </form>
            </div>
        </AuthGuard>
    );
}
