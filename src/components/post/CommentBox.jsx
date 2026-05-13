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
      <p className="comment-login-prompt">
        <button
          onClick={() => navigate('/login')}
          className="link-button"
        >
          Log in
        </button>{' '}
        to comment
      </p>
    );
  }

  return (
    <div className="comment-form">
      <Avatar
        src={user?.profilePicUrl}
        name={user?.username}
        size={9}
        className="comment-form__avatar"
      />
      <div className="comment-form__body">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment…"
          className="comment-form__input"
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
          className="primary-button primary-button--pill"
        >
          Post
        </button>
      </div>
    </div>
  );
}
