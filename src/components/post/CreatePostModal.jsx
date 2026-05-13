import { useState, useRef } from 'react';
import { X, Image, Globe, Users, Lock, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { createPost } from '../../api/postApi';
import { uploadMedia } from '../../api/mediaApi';
import { useToast } from '../common/Toast';
import './CreatePostModal.css';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC',          label: 'Everyone',     icon: <Globe  size={14} /> },
  { value: 'FOLLOWERS_ONLY',  label: 'Followers',    icon: <Users  size={14} /> },
  { value: 'PRIVATE',         label: 'Only me',      icon: <Lock   size={14} /> },
];

const CreatePostModal = ({ onClose, onCreated }) => {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [content, setContent]       = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [files, setFiles]           = useState([]);
  const [previews, setPreviews]     = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef                     = useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles((prev) => [...prev, ...selected]);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      addToast('Please add some content or media', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let mediaUrls = [];

      // Upload files first
      if (files.length > 0) {
        setUploading(true);
        const uploads = await Promise.all(files.map((f) => uploadMedia(f)));
        mediaUrls = uploads.map((r) => r.data.data.url);
        setUploading(false);
      }

      const res = await createPost({ content: content.trim(), mediaUrls, visibility });
      addToast('Post created!', 'success');
      onCreated?.(res.data.data);
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create post', 'error');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const charCount = content.length;
  const maxChars  = 5000;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="create-post-modal card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create Post"
      >
        {/* Header */}
        <div className="create-post-modal__header">
          <h2 className="create-post-modal__title">Create Post</h2>
          <button className="create-post-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <hr className="divider" />

        <form onSubmit={handleSubmit}>
          {/* Author row */}
          <div className="create-post-modal__author">
            <Avatar
              src={user?.profilePicUrl}
              username={user?.username}
              size={44}
            />
            <div>
              <p className="create-post-modal__username">
                {user?.fullName || user?.username}
              </p>
              {/* Visibility picker */}
              <select
                className="create-post-modal__vis-select"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                {VISIBILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            className="create-post-modal__textarea"
            placeholder={`What's on your mind, ${user?.username || 'you'}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={maxChars}
            rows={5}
            autoFocus
          />
          <div className="create-post-modal__char-count">
            <span className={charCount > maxChars * 0.9 ? 'create-post-modal__char-count--warn' : ''}>
              {charCount}/{maxChars}
            </span>
          </div>

          {/* Media previews */}
          {previews.length > 0 && (
            <div className="create-post-modal__previews">
              {previews.map((url, i) => (
                <div key={i} className="create-post-modal__preview-item">
                  {files[i]?.type.startsWith('video/') ? (
                    <video src={url} className="create-post-modal__preview-img" />
                  ) : (
                    <img src={url} alt="" className="create-post-modal__preview-img" />
                  )}
                  <button
                    type="button"
                    className="create-post-modal__remove-media"
                    onClick={() => removeFile(i)}
                    aria-label="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <hr className="divider" />

          {/* Footer */}
          <div className="create-post-modal__footer">
            <div className="create-post-modal__media-btn">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                title="Add media"
              >
                <Image size={18} />
                Photo/Video
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                multiple
                style={{ display: 'none' }}
                onChange={handleFiles}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (!content.trim() && files.length === 0)}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinner-icon" />
                  {uploading ? 'Uploading...' : 'Posting...'}
                </>
              ) : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;