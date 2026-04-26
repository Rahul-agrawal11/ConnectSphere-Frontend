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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Create Post
        </h2>

        {/* Content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder={`What's on your mind? Use #hashtags to tag your post.`}
            rows={6}
            maxLength={MAX}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300 transition
                       resize-none"
          />
          <div className={`text-right text-xs mt-1
            ${charCount > MAX * 0.9 ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount} / {MAX}
          </div>
        </div>

        {/* Visibility */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Who can see this?
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITIES.map(v => (
              <button
                key={v.value}
                onClick={() => setVisibility(v.value)}
                className={`p-3 rounded-xl border text-left transition
                  ${visibility === v.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="text-xl mb-1">{v.icon}</div>
                <div className="text-sm font-medium text-gray-800">{v.label}</div>
                <div className="text-xs text-gray-400">{v.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Hashtag hints */}
        {(content.match(/#\w+/g) || []).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            <span className="text-xs text-gray-500 mr-1">Hashtags:</span>
            {(content.match(/#[\w]+/g) || []).map(tag => (
              <span
                key={tag}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate('/feed')}
            className="px-5 py-2 border border-gray-200 rounded-xl text-sm
                       text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!content.trim() || mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm
                       font-medium hover:bg-blue-700 transition
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Publishing…' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}