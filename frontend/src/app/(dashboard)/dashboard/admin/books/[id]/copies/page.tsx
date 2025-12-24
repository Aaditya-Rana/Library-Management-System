'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Plus, Trash2, Tag, Archive } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import Barcode from 'react-barcode';

interface BookCopy {
    id: string;
    copyNumber: string;
    barcode: string;
    status: 'AVAILABLE' | 'ISSUED' | 'MAINTENANCE' | 'LOST' | 'DAMAGED';
    condition: string;
    shelfLocation: string;
}

interface BookDetails {
    id: string;
    title: string;
    author: string;
    isbn: string;
}

export default function ManageCopiesPage() {
    const router = useRouter();
    const params = useParams();
    const bookId = params.id as string;

    const [book, setBook] = useState<BookDetails | null>(null);
    const [copies, setCopies] = useState<BookCopy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state for adding copies
    const [addForm, setAddForm] = useState({
        numberOfCopies: 1,
        shelfLocation: '',
        section: ''
    });

    useEffect(() => {
        fetchData();
    }, [bookId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch book details
            const bookRes = await api.get(`/books/${bookId}`);
            setBook(bookRes.data.data.book || bookRes.data.data); // Adjust based on API structure variety

            // Fetch copies
            const copiesRes = await api.get(`/books/${bookId}/copies`);
            setCopies(copiesRes.data.data.copies || []);
        } catch (error) {
            console.error('Failed to fetch data', error);
            alert('Failed to load book data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddCopies = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            await api.post(`/books/${bookId}/copies`, addForm);
            alert('Copies added successfully!');
            setAddForm({ numberOfCopies: 1, shelfLocation: '', section: '' });
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Failed to add copies', error);
            alert(error.response?.data?.message || 'Failed to add copies');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteCopy = async (copyId: string) => {
        if (!confirm('Are you sure you want to delete this copy? This cannot be undone.')) return;
        try {
            await api.delete(`/books/${bookId}/copies/${copyId}`);
            setCopies(copies.filter(c => c.id !== copyId));
        } catch (error: any) {
            console.error('Failed to delete copy', error);
            alert('Failed to delete copy. It might be issued mostly.');
        }
    };

    const handleUpdateStatus = async (copyId: string, newStatus: string) => {
        const reason = prompt('Enter reason for status change (optional):');
        try {
            await api.patch(`/books/${bookId}/copies/${copyId}/status`, {
                status: newStatus,
                reason: reason,
                notes: 'Status updated via Admin Dashboard'
            });
            fetchData();
        } catch (error: any) {
            alert('Failed to update status');
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN', 'LIBRARIAN']}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Copies</h1>
                        {book && <p className="text-gray-600">{book.title} (ISBN: {book.isbn})</p>}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* List Copies */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="font-semibold text-gray-900">Physical Copies ({copies.length})</h2>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {copies.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No copies found. Add some!</div>
                                ) : copies.map((copy) => (
                                    <div key={copy.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div>
                                            <div className="flex flex-col gap-2 mb-1">
                                                <div className="bg-white p-2 rounded border border-gray-200 w-fit">
                                                    <Barcode value={copy.barcode} width={1.5} height={40} fontSize={12} margin={0} />
                                                </div>
                                                <span className={`w-fit px-2 py-0.5 rounded-full text-xs font-bold ${copy.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                    copy.status === 'ISSUED' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {copy.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 flex gap-4">
                                                <span>Copy #{copy.copyNumber}</span>
                                                <span>Loc: {copy.shelfLocation || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Status Dropdown Logic can be complex, simplifying to basic actions for now */}
                                            {copy.status !== 'ISSUED' && (
                                                <select
                                                    className="text-xs border rounded p-1 bg-white"
                                                    value={copy.status}
                                                    onChange={(e) => handleUpdateStatus(copy.id, e.target.value)}
                                                >
                                                    <option value="AVAILABLE">Available</option>
                                                    <option value="MAINTENANCE">Maintenance</option>
                                                    <option value="LOST">Lost</option>
                                                    <option value="DAMAGED">Damaged</option>
                                                </select>
                                            )}
                                            <button
                                                onClick={() => handleDeleteCopy(copy.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete Copy"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Add Copies Form */}
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add New Copies
                            </h2>
                            <form onSubmit={handleAddCopies} className="space-y-4">
                                <Input
                                    label="Number of Copies"
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={addForm.numberOfCopies}
                                    onChange={(e) => setAddForm({ ...addForm, numberOfCopies: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                    required
                                />
                                <Input
                                    label="Shelf Location"
                                    placeholder="e.g., A-12, Floor 2"
                                    value={addForm.shelfLocation}
                                    onChange={(e) => setAddForm({ ...addForm, shelfLocation: e.target.value })}
                                />
                                <Input
                                    label="Section"
                                    placeholder="e.g., Fiction"
                                    value={addForm.section}
                                    onChange={(e) => setAddForm({ ...addForm, section: e.target.value })}
                                />
                                <Button
                                    type="submit"
                                    className="w-full"
                                    isLoading={isAdding}
                                >
                                    Add Copies
                                </Button>
                            </form>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                            <h3 className="font-bold flex items-center gap-2 mb-2">
                                <Tag className="w-4 h-4" /> Tip
                            </h3>
                            <p>Barcodes are automatically generated based on the Book ISBN and copy number scheme.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
