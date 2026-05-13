import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postApi } from '../../api/postApi';
import { searchApi } from '../../api/searchApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

const VISIBILITIES = [
  { value: 'PUBLIC',          icon: '🌍', label: 'Public' },
  { value: 'FOLLOWERS_ONLY',  icon: '👥', label: 'Followers' },
  { value: 'PRIVATE',         icon: '🔒', label: 'Private' },
];

export default function CreatePostInline({ onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [expanded, setExpanded] = useState(false);

  const mutation = useMutation({
    mutationFn: () => postApi.createPost({ content, visibility }),
    onSuccess: async (res) => {
      const post = res.data.data;
      setContent('');
      setExpanded(false);
      toast.success('Post created!');
      onCreated?.(post);

      // Index hashtags in search-service
      if (content.includes('#')) {
        try {
          await searchApi.indexPost(post.id, content);
        } catch {}
      }
    },
    onError: () => toast.error('Failed to create post'),
  });

  return (
    <div className="post-composer-card">
      <div className="post-composer-card__row">
        <Avatar
          src={user?.profilePicUrl}
          name={user?.username}
          size={10}
          className="post-composer-card__avatar"
        />
        <div className="post-composer-card__body">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind? Use #hashtags"
            rows={expanded ? 3 : 1}
            className="post-composer-card__textarea"
          />

          {expanded && (
            <div className="post-composer-card__footer">
              <div className="visibility-toggle-group">
                {VISIBILITIES.map(v => (
                  <button
                    key={v.value}
                    onClick={() => setVisibility(v.value)}
                    className={`visibility-toggle ${visibility === v.value ? 'visibility-toggle--active' : ''}`.trim()}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <div className="post-composer-card__actions">
                <button
                  onClick={() => { setExpanded(false); setContent(''); }}
                  className="ghost-button"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (content.trim()) mutation.mutate(); }}
                  disabled={!content.trim() || mutation.isPending}
                  className="primary-button"
                >
                  {mutation.isPending ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
