'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function BulkImportPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [importResult, setImportResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setImportResult(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/books/bulk-import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(res.data);
            setFile(null);
        } catch (error: any) {
            console.error('Import failed', error);
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Failed to import books'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Books</h1>
                        <p className="text-gray-600">Upload a CSV or JSON file to add multiple books at once.</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-8">

                    {/* Instructions */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" /> Format Instructions
                        </h3>
                        <p className="text-sm text-blue-800 mb-2">
                            Supported formats: <strong>.csv, .json</strong>.
                            Ensure your file headers match the required fields:
                        </p>
                        <ul className="list-disc list-inside text-xs text-blue-700 space-y-1 font-mono">
                            <li>isbn (required, unique)</li>
                            <li>title (required)</li>
                            <li>author (required)</li>
                            <li>category (required)</li>
                            <li>bookValue (required, numeric)</li>
                            <li>publisher, publicationYear, genre, etc. (optional)</li>
                        </ul>
                        <div className="mt-4">
                            <Button size="sm" variant="outline" onClick={() => {
                                // Mock download
                                const csvContent = "data:text/csv;charset=utf-8,"
                                    + "isbn,title,author,category,bookValue,totalCopies\n"
                                    + "9781234567890,Example Book,John Doe,Fiction,500,5";
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", "books_template.csv");
                                document.body.appendChild(link);
                                link.click();
                            }}>
                                <Download className="w-4 h-4 mr-2" /> Download Template
                            </Button>
                        </div>
                    </div>

                    {/* Upload Section */}
                    {importResult ? (
                        <div className={`p-6 rounded-lg text-center ${importResult.success ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                            {importResult.success ? (
                                <>
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-green-900 mb-2">Import Successful!</h3>
                                    <p className="text-green-800">{importResult.message}</p>
                                    {importResult.data && (
                                        <p className="text-sm text-green-700 mt-2">
                                            Processed: {importResult.data.processed || 0} |
                                            Success: {importResult.data.successCount || 0} |
                                            Failed: {importResult.data.failedCount || 0}
                                        </p>
                                    )}
                                    <Button className="mt-4" onClick={() => setImportResult(null)}>Import More</Button>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertTriangle className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-red-900 mb-2">Import Failed</h3>
                                    <p className="text-red-800">{importResult.message}</p>
                                    <Button className="mt-4" variant="outline" onClick={() => setImportResult(null)}>Try Again</Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors bg-gray-50">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <label className="block">
                                    <span className="sr-only">Choose file</span>
                                    <input
                                        type="file"
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-primary-50 file:text-primary-700
                                            hover:file:bg-primary-100
                                            cursor-pointer"
                                        accept=".csv,.json"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="text-xs text-gray-400 mt-2">Max file size: 10MB</p>
                            </div>

                            {file && (
                                <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-gray-500" />
                                        <span className="font-medium text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">×</button>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button size="lg" disabled={!file || isLoading} isLoading={isLoading}>
                                    Start Import
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
