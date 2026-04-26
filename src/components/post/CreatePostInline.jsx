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
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar
          src={user?.profilePicUrl}
          name={user?.username}
          size={10}
          className="flex-shrink-0"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind? Use #hashtags"
            rows={expanded ? 3 : 1}
            className="w-full px-4 py-2 bg-gray-100 rounded-2xl text-sm
                       border-transparent focus:outline-none focus:ring-2
                       focus:ring-blue-300 focus:bg-white transition resize-none"
          />

          {expanded && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {VISIBILITIES.map(v => (
                  <button
                    key={v.value}
                    onClick={() => setVisibility(v.value)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition
                      ${visibility === v.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setExpanded(false); setContent(''); }}
                  className="px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100
                             rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { if (content.trim()) mutation.mutate(); }}
                  disabled={!content.trim() || mutation.isPending}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm
                             rounded-lg hover:bg-blue-700 transition
                             disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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