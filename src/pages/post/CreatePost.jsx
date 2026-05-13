import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { postApi } from '../../api/postApi';
import { searchApi } from '../../api/searchApi';
import toast from 'react-hot-toast';

const VISIBILITIES = [
  { value: 'PUBLIC',         icon: '🌍', label: 'Public', desc: 'Everyone can see this' },
  { value: 'FOLLOWERS_ONLY', icon: '👥', label: 'Followers', desc: 'Only followers can see' },
  { value: 'PRIVATE',        icon: '🔒', label: 'Private', desc: 'Only you can see this' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent]       = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [charCount, setCharCount]   = useState(0);
  const MAX = 5000;

  const mutation = useMutation({
    mutationFn: () => postApi.createPost({ content, visibility }),
    onSuccess: async (res) => {
      const post = res.data.data;
      toast.success('Post created!');

      if (content.includes('#')) {
        try { await searchApi.indexPost(post.id, content); } catch {}
      }
      navigate(`/posts/${post.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create post');
    },
  });

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setCharCount(e.target.value.length);
  };

  return (
    <div className="page-container page-container--narrow">
      <div className="section-card section-card--spacious">
        <h2 className="section-card__heading">
          Create Post
        </h2>

        {/* Content */}
        <div className="form-group form-group--loose">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={`What's on your mind? Use #hashtags to tag your post.`}
            rows={6}
            maxLength={MAX}
            className="form-textarea"
          />
          <div className={`character-count ${charCount > MAX * 0.9 ? 'character-count--danger' : ''}`.trim()}>
            {charCount} / {MAX}
          </div>
        </div>

        {/* Visibility */}
        <div className="form-group form-group--loose">
          <label className="form-label">
            Who can see this?
          </label>
          <div className="visibility-card-grid">
            {VISIBILITIES.map(v => (
              <button
                key={v.value}
                onClick={() => setVisibility(v.value)}
                className={`visibility-card ${visibility === v.value ? 'visibility-card--active' : ''}`.trim()}
              >
                <div className="visibility-card__icon">{v.icon}</div>
                <div className="visibility-card__label">{v.label}</div>
                <div className="visibility-card__description">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hashtag hints */}
        {(content.match(/#\w+/g) || []).length > 0 && (
          <div className="hashtag-hints">
            <span className="hashtag-hints__label">Hashtags:</span>
            {(content.match(/#[\w]+/g) || []).map(tag => (
              <span
                key={tag}
                className="hashtag-pill"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            onClick={() => navigate('/feed')}
            className="secondary-button"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!content.trim() || mutation.isPending}
            className="primary-button"
          >
            {mutation.isPending ? 'Publishing…' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
