'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSettings, updateSetting } from '@/features/settings/settingsSlice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function SettingsPage() {
    const dispatch = useAppDispatch();
    const { settings, isLoading, error } = useAppSelector((state) => state.settings);
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        dispatch(fetchSettings({}));
    }, [dispatch]);

    const handleEdit = (key: string, currentValue: string) => {
        setEditingKey(key);
        setEditValue(currentValue);
    };

    const handleSave = async (key: string) => {
        try {
            await dispatch(updateSetting({ key, value: editValue })).unwrap();
            setEditingKey(null);
            alert('Setting updated successfully!');
        } catch (error: any) {
            alert(error || 'Failed to update setting');
        }
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const filteredSettings = categoryFilter === 'ALL'
        ? settings
        : settings.filter(s => s.category === categoryFilter);

    const categories = ['ALL', 'LIBRARY', 'FINES', 'MEMBERSHIP', 'LOANS', 'SYSTEM'];

    const groupedSettings = filteredSettings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
            acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
    }, {} as Record<string, typeof settings>);

    return (
        <AuthGuard allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-600">Configure library system parameters</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setCategoryFilter(category)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${categoryFilter === category
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading settings...</div>
                    ) : Object.keys(groupedSettings).length > 0 ? (
                        Object.entries(groupedSettings).map(([category, categorySettings]) => (
                            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h2 className="font-bold text-gray-900">{category}</h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {categorySettings.map((setting) => (
                                        <div key={setting.id} className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-gray-900">{setting.key}</h3>
                                                        {!setting.isEditable && (
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                                Read-only
                                                            </span>
                                                        )}
                                                    </div>
                                                    {setting.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Type:</span>
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                            {setting.dataType}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 min-w-[300px]">
                                                    {editingKey === setting.key ? (
                                                        <>
                                                            <Input
                                                                type={setting.dataType === 'NUMBER' ? 'number' : 'text'}
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1"
                                                            />
                                                            <Button size="sm" onClick={() => handleSave(setting.key)}>
                                                                <Save className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={handleCancel}>
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                                                {setting.value}
                                                            </div>
                                                            {setting.isEditable && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleEdit(setting.key, setting.value)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-100">
                            <SettingsIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-lg font-medium text-gray-900">No settings found</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
