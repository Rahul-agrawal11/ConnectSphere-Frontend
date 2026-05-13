import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { updatePost } from '../../api/postApi';
import { useToast } from '../common/Toast';
import './EditPostModal.css';

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC',         label: 'Everyone'  },
  { value: 'FOLLOWERS_ONLY', label: 'Followers' },
  { value: 'PRIVATE',        label: 'Only me'   },
];

const EditPostModal = ({ post, onClose, onUpdated }) => {
  const { addToast } = useToast();

  const [content, setContent]       = useState(post.content || '');
  const [visibility, setVisibility] = useState(post.visibility || 'PUBLIC');
  const [saving, setSaving]         = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('Content cannot be empty', 'warning');
      return;
    }
    setSaving(true);
    try {
      const res = await updatePost(post.id, {
        content:    content.trim(),
        visibility,
        mediaUrls:  post.mediaUrls || [],
      });
      addToast('Post updated!', 'success');
      onUpdated?.(res.data.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="edit-post-modal card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit Post"
      >
        <div className="edit-post-modal__header">
          <h2 className="edit-post-modal__title">Edit Post</h2>
          <button className="create-post-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <hr className="divider" />

        <form onSubmit={handleSave}>
          <textarea
            className="edit-post-modal__textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            maxLength={5000}
            autoFocus
          />

          <div className="edit-post-modal__footer">
            <select
              className="create-post-modal__vis-select"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="edit-post-modal__actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Loader2 size={16} className="spinner-icon" /> Saving...</> : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;