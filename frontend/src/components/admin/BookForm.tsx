'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';

const bookSchema = z.object({
    isbn: z.string().min(10, 'ISBN must be at least 10 characters').max(13, 'ISBN must be at most 13 characters'),
    title: z.string().min(1, 'Title is required'),
    author: z.string().min(1, 'Author is required'),
    publisher: z.string().min(1, 'Publisher is required'),
    publicationYear: z.coerce.number().min(1000, 'Invalid year').max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
    genre: z.string().min(1, 'Genre is required'),
    category: z.string().min(1, 'Category is required'),
    bookValue: z.coerce.number().min(0, 'Value cannot be negative'),
    totalCopies: z.coerce.number().int().min(0, 'Copies cannot be negative'),
    description: z.string().optional(),
    coverImage: z.any().optional(), // File object
});

export type BookFormData = z.infer<typeof bookSchema>;



interface BookFormProps {
    initialData?: Partial<BookFormData> & { coverImageUrl?: string };
    onSubmit: (data: BookFormData) => Promise<void>;
    isLoading: boolean;
    submitLabel: string;
    onCancel: () => void;
    isEditMode?: boolean;
}

export default function BookForm({ initialData, onSubmit, isLoading, submitLabel, onCancel, isEditMode = false }: BookFormProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.coverImageUrl || null);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema) as any,
        defaultValues: {
            isbn: initialData?.isbn || '',
            title: initialData?.title || '',
            author: initialData?.author || '',
            publisher: initialData?.publisher || '',
            publicationYear: initialData?.publicationYear || new Date().getFullYear(),
            genre: initialData?.genre || '',
            category: initialData?.category || '',
            bookValue: initialData?.bookValue || 0,
            totalCopies: initialData?.totalCopies || (isEditMode ? 0 : 1),
            description: initialData?.description || '',
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('coverImage', file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleRemoveImage = () => {
        setValue('coverImage', null);
        setPreviewUrl(null);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image Upload */}
                <div className="lg:col-span-1 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Cover Image</label>

                    <div className="relative group w-full aspect-[2/3] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden transition-colors hover:bg-gray-100 hover:border-primary-400">
                        {previewUrl ? (
                            <>
                                <img
                                    src={previewUrl}
                                    alt="Cover Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                        title="Remove Image"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <div className="p-3 bg-primary-50 text-alert-50 rounded-full inline-block mb-2">
                                    <Upload className="w-6 h-6 text-primary-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">Upload Cover</p>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                            </div>
                        )}

                        {!previewUrl && (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        )}
                    </div>
                    {/* Hidden input to facilitate re-upload if removed */}
                    {previewUrl && (
                        <div className="text-center">
                            <label htmlFor="re-upload" className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer font-medium hover:underline">
                                Change Image
                            </label>
                            <input
                                id="re-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <Input
                                label="ISBN"
                                {...register('isbn')}
                                error={errors.isbn?.message}
                                placeholder="978-3-16-148410-0"
                            />
                        </div>
                        <div className="space-y-1">
                            <Input
                                label="Title"
                                {...register('title')}
                                error={errors.title?.message}
                                placeholder="The Great Gatsby"
                            />
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Author"
                                {...register('author')}
                                error={errors.author?.message}
                                placeholder="F. Scott Fitzgerald"
                            />
                        </div>
                        <div className="space-y-1">
                            <Input
                                label="Publisher"
                                {...register('publisher')}
                                error={errors.publisher?.message}
                                placeholder="Scribner"
                            />
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Publication Year"
                                type="number"
                                {...register('publicationYear')}
                                error={errors.publicationYear?.message}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                            <select
                                {...register('genre')}
                                className={`w-full rounded-md border shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2 text-sm ${errors.genre ? 'border-red-300' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Select Genre</option>
                                <option value="Fiction">Fiction</option>
                                <option value="Non-Fiction">Non-Fiction</option>
                                <option value="Science">Science</option>
                                <option value="History">History</option>
                                <option value="Technology">Technology</option>
                                <option value="Arts">Arts</option>
                            </select>
                            {errors.genre && <p className="text-xs text-red-500 mt-1">{errors.genre.message}</p>}
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Category"
                                {...register('category')}
                                error={errors.category?.message}
                                placeholder="Classic Literature"
                            />
                        </div>

                        <div className="space-y-1">
                            <Input
                                label="Book Value (₹)"
                                type="number"
                                step="0.01"
                                {...register('bookValue')}
                                error={errors.bookValue?.message}
                            />
                        </div>

                        {!isEditMode && (
                            <div className="space-y-1">
                                <Input
                                    label="Initial Copies"
                                    type="number"
                                    min="1"
                                    {...register('totalCopies')}
                                    error={errors.totalCopies?.message}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value || ''}
                                    onChange={field.onChange}
                                    placeholder="Write a detailed description..."
                                />
                            )}
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                submitLabel
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}
