import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../../api/commentApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

export default function CommentBox({ postId }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const mutation = useMutation({
    mutationFn: () => commentApi.addComment({ postId, content: text }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      toast.success('Comment posted!');
    },
    onError: () => toast.error('Failed to post comment'),
  });

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-gray-500 text-center py-3">
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:underline"
        >
          Log in
        </button>{' '}
        to comment
      </p>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar
        src={user?.profilePicUrl}
        name={user?.username}
        size={9}
        className="flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm
                     border-transparent focus:outline-none focus:ring-2
                     focus:ring-blue-300 focus:bg-white transition"
          onKeyDown={e => {
            if (e.key === 'Enter' && text.trim()) {
              e.preventDefault();
              mutation.mutate();
            }
          }}
        />
        <button
          onClick={() => { if (text.trim()) mutation.mutate(); }}
          disabled={!text.trim() || mutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full
                     hover:bg-blue-700 transition disabled:opacity-50
                     disabled:cursor-not-allowed font-medium"
        >
          Post
        </button>
      </div>
    </div>
  );
}