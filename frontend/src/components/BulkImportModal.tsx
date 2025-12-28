'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface BulkImportResult {
    imported: number;
    failed: number;
    successfulBooks: any[];
    failedBooks: { book: any; error: string }[];
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
    const [jsonContent, setJsonContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<BulkImportResult | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                // Validate JSON
                JSON.parse(content);
                setJsonContent(content);
                toast.success('File loaded successfully');
            } catch (error) {
                toast.error('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setResult(null);

            const books = JSON.parse(jsonContent);

            if (!Array.isArray(books)) {
                toast.error('JSON must be an array of books');
                return;
            }

            const response = await api.post('/books/bulk-import', { books });
            const importResult = response.data.data;

            setResult(importResult);

            if (importResult.failed === 0) {
                toast.success(`Successfully imported ${importResult.imported} books!`);
                setTimeout(() => {
                    onSuccess();
                    handleClose();
                }, 2000);
            } else {
                toast.success(`Imported ${importResult.imported} books, ${importResult.failed} failed`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import books');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setJsonContent('');
        setResult(null);
        onClose();
    };

    const sampleFormat = [
        {
            isbn: '9780123456789',
            title: 'Sample Book',
            author: 'Author Name',
            publisher: 'Publisher Name',
            publicationYear: 2024,
            category: 'Fiction',
            genre: 'Mystery',
            language: 'English',
            bookValue: 500,
            description: 'Book description',
        },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Bulk Import Books</h2>
                        <p className="text-gray-500 mt-1">Upload a JSON file with book data</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload JSON File
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100
                                    cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* JSON Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or Paste JSON Data
                        </label>
                        <textarea
                            value={jsonContent}
                            onChange={(e) => setJsonContent(e.target.value)}
                            placeholder='[{"isbn": "9780123456789", "title": "Book Title", ...}]'
                            className="w-full h-48 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Sample Format */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <h3 className="font-medium text-gray-900">Sample Format</h3>
                        </div>
                        <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                            {JSON.stringify(sampleFormat, null, 2)}
                        </pre>
                        <p className="text-xs text-gray-500 mt-2">
                            Note: ISBN must be 10 or 13 digits. Language defaults to English if not specified.
                        </p>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-green-900">Successful</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                        {result.imported}
                                    </p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        <span className="font-medium text-red-900">Failed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-600 mt-2">
                                        {result.failed}
                                    </p>
                                </div>
                            </div>

                            {result.failedBooks.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="font-medium text-red-900 mb-2">Failed Books:</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {result.failedBooks.map((failed, idx) => (
                                            <div key={idx} className="text-sm bg-white p-2 rounded border border-red-100">
                                                <p className="font-medium text-gray-900">
                                                    {failed.book.title} (ISBN: {failed.book.isbn})
                                                </p>
                                                <p className="text-red-600">{failed.error}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!jsonContent || isSubmitting}
                        className="flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Import Books
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
