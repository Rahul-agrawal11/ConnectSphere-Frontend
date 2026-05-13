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
    <div className="page-container page-container--compact page-stack">
      {/* Profile Card */}
      <div className="section-card section-card--spacious">
        <h2 className="section-card__heading">Edit Profile</h2>

        {/* Avatar Preview */}
        <div className="profile-edit-avatar-row">
          <Avatar
            src={form.profilePicUrl}
            name={form.username}
            size={16}
          />
          <div className="profile-edit-avatar-row__field">
            <label className="form-label form-label--small">
              Profile picture URL
            </label>
            <input
              type="url"
              value={form.profilePicUrl}
              onChange={e => setForm(p => ({ ...p, profilePicUrl: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
              className="form-input"
            />
          </div>
        </div>

        {[
          ['username',      'Username',   'text',  'johndoe'],
          ['fullName',      'Full Name',  'text',  'John Doe'],
          ['profilePicUrl', null],  // rendered above
        ].filter(([, label]) => label !== null).map(([key, label, type, ph]) => (
          <div key={key} className="form-group">
            <label className="form-label">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={ph}
              className="form-input"
            />
          </div>
        ))}

        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            placeholder="Tell people about yourself…"
            className="form-textarea"
          />
        </div>

        <div className="form-actions">
          <button
            onClick={() => navigate(-1)}
            className="secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="primary-button"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="section-card section-card--spacious">
        <h3 className="section-card__title">Change Password</h3>
        <div className="form-stack">
          <input
            type="password"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Current password"
            className="form-input"
          />
          <input
            type="password"
            value={pwForm.newPassword}
            onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="New password (min 8 characters)"
            className="form-input"
          />
          <button
            onClick={() => pwMutation.mutate()}
            disabled={pwMutation.isPending || !pwForm.currentPassword || !pwForm.newPassword}
            className="danger-outline-button danger-outline-button--full"
          >
            {pwMutation.isPending ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
