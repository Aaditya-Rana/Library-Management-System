'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AuthGuard from '@/components/auth/AuthGuard';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function AddBookPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        publicationYear: new Date().getFullYear(),
        genre: '',
        category: '',
        totalCopies: 1,
        bookValue: 0,
        description: ''
    });
    const [coverImage, setCoverImage] = useState<File | null>(null);

    const handleChange = (e: any) => {
        const val = e.target.type === 'number'
            ? (e.target.value === '' ? '' : parseFloat(e.target.value))
            : e.target.value;
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleDescriptionChange = (value: string) => {
        setFormData({ ...formData, description: value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCoverImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, String(value));
        });
        if (coverImage) {
            data.append('coverImage', coverImage);
        }

        try {
            const response = await api.post('/books', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newBook = response.data.data;

            // Add initial copies if specified (Still a separate call as copies are inventory logic)
            // Note: If backend could handle copies in creation, this would be better, but sticking to existing logic for safety.
            if (formData.totalCopies > 0 && newBook?.id) {
                try {
                    await api.post(`/books/${newBook.id}/copies`, {
                        numberOfCopies: Number(formData.totalCopies)
                    });
                } catch (copyError) {
                    console.error('Failed to add initial copies', copyError);
                    alert('Book created, but failed to add initial copies.');
                }
            }

            router.push('/dashboard/admin/books');
        } catch (error) {
            console.error('Failed to add book', error);
            alert('Failed to add book');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Book</h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic Details */}
                        <div className="space-y-6">
                            <Input label="ISBN" name="isbn" required value={formData.isbn} onChange={handleChange} />
                            <Input label="Title" name="title" required value={formData.title} onChange={handleChange} />
                            <Input label="Author" name="author" required value={formData.author} onChange={handleChange} />
                            <Input label="Publisher" name="publisher" required value={formData.publisher} onChange={handleChange} />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Publication Year"
                                    name="publicationYear"
                                    type="number"
                                    required
                                    value={formData.publicationYear}
                                    onChange={handleChange}
                                />
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
                        </div>

                        {/* Right Column: Categorization & Copies */}
                        <div className="space-y-6">
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
                                label="Total Copies (Initial Stock)"
                                name="totalCopies"
                                type="number"
                                min="1"
                                required
                                value={formData.totalCopies}
                                onChange={handleChange}
                                p-text="This will automatically create physical copies in the system."
                            />

                            {/* Cover Image Upload */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <ImageIcon className="w-4 h-4 mr-2" />
                                    Cover Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-primary-50 file:text-primary-700
                                        hover:file:bg-primary-100
                                        cursor-pointer"
                                />
                                <p className="text-xs text-gray-500 mt-1">Optional. Max 5MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* Full Width: Description */}
                    <div>
                        <RichTextEditor
                            label="Description"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            placeholder="Write a detailed description of the book..."
                        />
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Add Book</Button>
                    </div>
                </form>
            </div>
        </AuthGuard>
    );
}
