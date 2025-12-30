'use client';

import { useState, useEffect } from 'react';
import { useGetMeQuery, useUpdateMeMutation } from '@/features/users/usersApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { data: userData, isLoading } = useGetMeQuery();
    const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();
    const [isEditing, setIsEditing] = useState(false);

    const user = userData?.data?.user;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => {
                if (prev.firstName === user.firstName &&
                    prev.lastName === user.lastName &&
                    prev.phone === (user.phone || '')) {
                    return prev;
                }
                return {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone || ''
                };
            });
        }
    }, [user?.firstName, user?.lastName, user?.phone]);

    const handleSave = async () => {
        try {
            await updateMe(formData).unwrap();
            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (error: any) {
            console.error('Failed to update profile', error);
            toast.error(error?.data?.message || 'Failed to update profile');
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

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;

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
