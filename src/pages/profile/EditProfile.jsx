import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Name is required', 'error'); return; }
    updateProfile({ displayName: name.trim(), phone: phone.trim() });
    showToast('Profile updated!', 'success');
    navigate('/profile');
  };

  return (
    <AppLayout userName={user?.displayName || 'User'}>
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/profile')} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar name={name || 'User'} size="xl" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} icon="👤" />
          <Input label="Email" value={user?.email || ''} disabled icon="✉️" />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" icon="📱" />
          <Input label="Default Currency" value="INR - Indian Rupee (₹)" disabled icon="💰" />
          <div className="pt-4 space-y-3">
            <Button type="submit" fullWidth>Save Changes</Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => navigate('/profile')}>Cancel</Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
