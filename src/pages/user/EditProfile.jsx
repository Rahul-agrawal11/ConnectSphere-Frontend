import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', fullName: '', bio: '', profilePicUrl: '',
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '', newPassword: '',
  });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: () => authApi.getProfileById(user.userId),
  });

  useEffect(() => {
    const p = profileData?.data?.data;
    if (p) {
      setForm({
        username: p.username || '',
        fullName: p.fullName || '',
        bio: p.bio || '',
        profilePicUrl: p.profilePicUrl || '',
      });
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: () => {
      updateUser({ username: form.username, profilePicUrl: form.profilePicUrl });
      toast.success('Profile updated!');
      navigate(`/profile/${user.userId}`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Update failed'),
  });

  const pwMutation = useMutation({
    mutationFn: () => authApi.changePassword(pwForm),
    onSuccess: () => {
      toast.success('Password changed! Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '' });
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Password change failed'),
  });

  if (isLoading) return <Spinner center />;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-5">Edit Profile</h2>

        {/* Avatar Preview */}
        <div className="flex items-center gap-4 mb-5">
          <Avatar
            src={form.profilePicUrl}
            name={form.username}
            size={16}
          />
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Profile picture URL
            </label>
            <input
              type="url"
              value={form.profilePicUrl}
              onChange={e => setForm(p => ({ ...p, profilePicUrl: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>
        </div>

        {[
          ['username',      'Username',   'text',  'johndoe'],
          ['fullName',      'Full Name',  'text',  'John Doe'],
          ['profilePicUrl', null],  // rendered above
        ].filter(([, label]) => label !== null).map(([key, label, type, ph]) => (
          <div key={key} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={ph}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            />
          </div>
        ))}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            placeholder="Tell people about yourself…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       resize-none focus:outline-none focus:ring-2
                       focus:ring-blue-300 transition"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl
                       hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-xl
                       hover:bg-blue-700 transition font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
        <div className="space-y-3">
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Current password"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="New password (min 8 characters)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
          />
          <button
            onClick={() => pwMutation.mutate()}
            disabled={pwMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword}
            className="w-full py-2 border border-red-300 text-red-600 text-sm
                       rounded-xl hover:bg-red-50 transition font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}