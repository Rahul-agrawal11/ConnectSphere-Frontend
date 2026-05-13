import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Camera, Lock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';
import { updateProfile, changePassword } from '../api/authApi';
import { uploadMedia } from '../api/mediaApi';
import { useToast } from '../components/common/Toast';
import './EditProfile.css';

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const { addToast }          = useToast();
  const navigate              = useNavigate();

  const [form, setForm] = useState({
    username:      user?.username    || '',
    fullName:      user?.fullName    || '',
    bio:           user?.bio         || '',
    profilePicUrl: user?.profilePicUrl || '',
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword:     '',
  });

  const [saving, setSaving]       = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [errors, setErrors]       = useState({});
  const [passErrors, setPassErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile');

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePassChange = (e) =>
    setPassForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const res = await uploadMedia(file);
      const url = res.data.data.url;
      setForm((p) => ({ ...p, profilePicUrl: url }));
      addToast('Photo uploaded!', 'success');
    } catch {
      addToast('Failed to upload photo', 'error');
    } finally {
      setUploadingPic(false);
      e.target.value = '';
    }
  };

  const validateProfile = () => {
    const e = {};
    if (form.username.length < 3) e.username = 'Username too short';
    if (form.bio.length > 500)    e.bio       = 'Bio too long (max 500)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSaving(true);
    try {
      await updateProfile({
        username:      form.username,
        fullName:      form.fullName,
        bio:           form.bio,
        profilePicUrl: form.profilePicUrl,
      });
      await refreshUser();
      addToast('Profile updated!', 'success');
      navigate(`/profile/${user.id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!passForm.currentPassword)    e2.currentPassword = 'Required';
    if (passForm.newPassword.length < 8) e2.newPassword  = 'At least 8 characters';
    if (Object.keys(e2).length > 0) { setPassErrors(e2); return; }
    setChangingPw(true);
    try {
      await changePassword(passForm);
      addToast('Password changed. Please log in again.', 'success');
      navigate('/login');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="edit-profile-page animate-fade-in">
      <div className="edit-profile-page__header">
        <h1 className="edit-profile-page__title">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="edit-profile-tabs">
        <button
          className={`edit-profile-tab ${activeTab === 'profile' ? 'edit-profile-tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`edit-profile-tab ${activeTab === 'password' ? 'edit-profile-tab--active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          <Lock size={14} /> Security
        </button>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="card edit-profile-card">
          {/* Avatar upload */}
          <div className="edit-profile-avatar-section">
            <div className="edit-profile-avatar-wrap">
              <Avatar
                src={form.profilePicUrl}
                username={user?.username}
                size={88}
              />
              <label className="edit-profile-avatar-btn" title="Change photo">
                {uploadingPic ? '…' : <Camera size={16} />}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarUpload}
                  disabled={uploadingPic}
                />
              </label>
            </div>
            <div>
              <p className="edit-profile-avatar-hint">
                Upload a profile photo (JPEG, PNG, WebP)
              </p>
            </div>
          </div>

          <hr className="divider" />

          <form onSubmit={handleSaveProfile} className="edit-profile-form">
            <div className="edit-profile-row">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  name="username"
                  className={`form-input ${errors.username ? 'form-input--error' : ''}`}
                  value={form.username}
                  onChange={handleChange}
                  minLength={3}
                  maxLength={50}
                />
                {errors.username && <span className="form-error">{errors.username}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="fullName"
                  className="form-input"
                  value={form.fullName}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                name="bio"
                className={`form-input edit-profile-bio ${errors.bio ? 'form-input--error' : ''}`}
                value={form.bio}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Tell people about yourself…"
              />
              <span className="form-hint">{form.bio.length}/500</span>
              {errors.bio && <span className="form-error">{errors.bio}</span>}
            </div>

            <div className="edit-profile-form__footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate(`/profile/${user.id}`)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><Loader2 size={16} className="spinner-icon" /> Saving…</>
                  : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password tab */}
      {activeTab === 'password' && (
        <div className="card edit-profile-card">
          <h3 className="edit-profile-section-title">Change Password</h3>
          <form onSubmit={handleChangePassword} className="edit-profile-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                name="currentPassword"
                type="password"
                className={`form-input ${passErrors.currentPassword ? 'form-input--error' : ''}`}
                value={passForm.currentPassword}
                onChange={handlePassChange}
                autoComplete="current-password"
              />
              {passErrors.currentPassword && (
                <span className="form-error">{passErrors.currentPassword}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                name="newPassword"
                type="password"
                className={`form-input ${passErrors.newPassword ? 'form-input--error' : ''}`}
                value={passForm.newPassword}
                onChange={handlePassChange}
                placeholder="Min. 8 chars with A-Z, 0-9, @#$"
                autoComplete="new-password"
              />
              {passErrors.newPassword && (
                <span className="form-error">{passErrors.newPassword}</span>
              )}
              <span className="form-hint">
                Must contain uppercase, lowercase, number &amp; special character
              </span>
            </div>
            <div className="edit-profile-form__footer">
              <button type="submit" className="btn btn-primary" disabled={changingPw}>
                {changingPw
                  ? <><Loader2 size={16} className="spinner-icon" /> Changing…</>
                  : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditProfile;