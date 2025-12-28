'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks'; // Assuming dispatch is needed for updates
import api from '@/services/api'; // For update API calls
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from 'lucide-react';

export default function ProfilePage() {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await api.patch('/users/me', formData);
            // We need to update the redux state with new user data
            // Since we don't have a specific 'updateUser' action yet, 
            // we might need to rely on re-fetching or manually updating local storage/state if the auth slice allows it.
            // For now, let's just alert success and maybe reload to be safe or just toggle view.

            // Ideally: dispatch(setCredentials({ ...authData, user: response.data.data.user }));
            // But let's assume valid token persists.

            // Updating LocalStorage manually to keep consistency on refresh
            const updatedUser = response.data.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert('Profile updated successfully! Please refresh to see changes fully applied.');
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone || ''
            });
        }
        setIsEditing(false);
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">Manage your personal information.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                        {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-10 h-10" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                        <p className="text-gray-500">{user.email}</p>
                        <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {user.role}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!isEditing}
                        />
                        <Input
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!isEditing}
                        />
                        <Input label="Email" defaultValue={user.email} disabled />
                        <Input label="Role" defaultValue={user.role} disabled />
                    </div>

                    <div className="flex justify-end pt-4">
                        {isEditing ? (
                            <div className="space-x-4">
                                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                                <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
