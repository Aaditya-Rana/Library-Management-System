'use client';

import { useState } from 'react';
import { useGetSettingsQuery, useUpdateSettingMutation } from '@/features/settings/settingsApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings as SettingsIcon, Save, X, Check, Edit2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const { data, isLoading, error } = useGetSettingsQuery({});
    const [updateSetting] = useUpdateSettingMutation();

    const settings = data?.data?.settings || [];

    const handleEdit = (key: string, currentValue: string | number | boolean) => {
        setEditingKey(key);
        setEditValue(String(currentValue));
    };

    const handleSave = async (key: string, dataType: string) => {
        try {
            let finalValue: string | number | boolean = editValue;
            if (dataType === 'NUMBER') {
                finalValue = Number(editValue);
            }
            // For boolean, we might be receiving string 'true'/'false' from toggle or input
            // But if it's a toggle, we usually handle it separately. 
            // This function handles the text input save mainly.

            await updateSetting({ key, value: finalValue }).unwrap();
            setEditingKey(null);
            toast.success('Setting updated successfully!');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to update setting');
        }
    };

    const handleToggle = async (key: string, currentValue: any) => {
        try {
            // Backend returns boolean primitive for BOOLEAN types
            const newValue = !currentValue;
            await updateSetting({ key, value: newValue }).unwrap();
            toast.success('Setting updated!');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to toggle setting');
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
            <div className="space-y-8 max-w-6xl mx-auto pb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                        <p className="text-gray-500 mt-1">Configure global library parameters and behaviors</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
                        <X className="w-5 h-5" />
                        Error loading settings: {JSON.stringify(error)}
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto no-scrollbar">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setCategoryFilter(category)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${categoryFilter === category
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {category.charAt(0) + category.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <SettingsIcon className="w-8 h-8 animate-spin mb-4 text-primary-400" />
                            Loading settings...
                        </div>
                    ) : Object.keys(groupedSettings).length > 0 ? (
                        Object.entries(groupedSettings).map(([category, categorySettings]) => (
                            <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50/50 px-8 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                                        {category.charAt(0) + category.slice(1).toLowerCase()}
                                    </h2>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {categorySettings.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {categorySettings.map((setting) => (
                                        <div key={setting.id} className="px-8 py-6 hover:bg-gray-50/30 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex-1 max-w-2xl">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-gray-900 text-base">{setting.key}</h3>
                                                        {!setting.isEditable && (
                                                            <span className="text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                                Read-only
                                                            </span>
                                                        )}
                                                    </div>
                                                    {setting.description && (
                                                        <p className="text-sm text-gray-500 leading-relaxed">{setting.description}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 min-w-[200px] justify-end">
                                                    {setting.dataType === 'BOOLEAN' ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-sm font-medium ${setting.value === true ? 'text-primary-700' : 'text-gray-400'}`}>
                                                                {setting.value === true ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                            <button
                                                                onClick={() => setting.isEditable && handleToggle(setting.key, setting.value)}
                                                                disabled={!setting.isEditable}
                                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${setting.value === true ? 'bg-primary-600' : 'bg-gray-200'
                                                                    } ${!setting.isEditable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            >
                                                                <span
                                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${setting.value === true ? 'translate-x-6' : 'translate-x-1'
                                                                        }`}
                                                                />
                                                            </button>
                                                        </div>
                                                    ) : editingKey === setting.key ? (
                                                        <div className="flex items-center gap-2 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                                                            <Input
                                                                type={setting.dataType === 'NUMBER' ? 'number' : 'text'}
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="flex-1 h-9 text-sm"
                                                                autoFocus
                                                            />
                                                            <Button size="sm" onClick={() => handleSave(setting.key, setting.dataType)} className="h-9 w-9 p-0">
                                                                <Check className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="sm" variant="outline" onClick={handleCancel} className="h-9 w-9 p-0 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-mono text-sm text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md min-w-[3rem] text-center">
                                                                {setting.value}
                                                            </span>
                                                            {setting.isEditable && (
                                                                <button
                                                                    onClick={() => handleEdit(setting.key, setting.value)}
                                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all"
                                                                    title="Edit Value"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <SettingsIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-xl font-semibold text-gray-900">No settings found</p>
                            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
