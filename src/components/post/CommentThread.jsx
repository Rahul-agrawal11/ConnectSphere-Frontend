import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TimeAgo from 'react-timeago';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentApi } from '../../api/commentApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

export default function CommentThread({ comment, postId }) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = user?.userId === comment.authorId;

  // Author profile
  const { data: authorData } = useQuery({
    queryKey: ['profile', comment.authorId],
    queryFn: () => authApi.getProfileById(comment.authorId),
    staleTime: 1000 * 60 * 5,
  });
  const author = authorData?.data?.data;

  // Replies
  const { data: repliesData } = useQuery({
    queryKey: ['replies', comment.id],
    queryFn: () => commentApi.getReplies(comment.id),
    enabled: showReplies,
  });
  const replies = repliesData?.data?.data?.content || [];

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: () => commentApi.addComment({
      postId,
      parentCommentId: comment.id,
      content: replyText,
    }),
    onSuccess: () => {
      setReplyText('');
      setShowReplyBox(false);
      setShowReplies(true);
      qc.invalidateQueries({ queryKey: ['replies', comment.id] });
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: () => toast.error('Reply failed'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => commentApi.deleteComment(comment.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="comment-thread">
      <Link to={`/profile/${comment.authorId}`} className="comment-thread__avatar">
        <Avatar src={author?.profilePicUrl} name={author?.username} size={8} />
      </Link>

      <div className="comment-thread__content">
        {/* Comment bubble */}
        <div className="comment-bubble">
          <div className="comment-bubble__meta">
            <Link
              to={`/profile/${comment.authorId}`}
              className="comment-bubble__author"
            >
              {author?.username || `User #${comment.authorId}`}
            </Link>
            <TimeAgo
              date={comment.createdAt}
              className="comment-bubble__time"
            />
          </div>
          <p className="comment-bubble__text">
            {comment.content}
          </p>
        </div>

        {/* Comment actions */}
        <div className="comment-actions">
          <span className="comment-actions__count">
            👍 {comment.likesCount}
          </span>
          {isAuthenticated && !comment.isReply && (
            <button
              onClick={() => setShowReplyBox(v => !v)}
              className="comment-actions__button"
            >
              Reply
            </button>
          )}
          {comment.isReply === false && (
            <button
              onClick={() => setShowReplies(v => !v)}
              className="comment-actions__button comment-actions__button--muted"
            >
              {showReplies ? 'Hide replies' : 'View replies'}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => {
                if (window.confirm('Delete comment?')) deleteMutation.mutate();
              }}
              className="comment-actions__button comment-actions__button--danger"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply Box */}
        {showReplyBox && (
          <div className="reply-form">
            <Avatar
              src={user?.profilePicUrl}
              name={user?.username}
              size={7}
              className="reply-form__avatar"
            />
            <div className="reply-form__body">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Reply to ${author?.username}…`}
                className="reply-form__input"
                onKeyDown={e => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    e.preventDefault();
                    replyMutation.mutate();
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Replies list */}
        {showReplies && replies.length > 0 && (
          <div className="replies-list">
            {replies.map(reply => (
              <CommentThread
                key={reply.id}
                comment={{ ...reply, isReply: true }}
                postId={postId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
