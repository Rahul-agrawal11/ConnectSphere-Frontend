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
    <div className="flex gap-3">
      <Link to={`/profile/${comment.authorId}`} className="flex-shrink-0 mt-0.5">
        <Avatar src={author?.profilePicUrl} name={author?.username} size={8} />
      </Link>

      <div className="flex-1 min-w-0">
        {/* Comment bubble */}
        <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              to={`/profile/${comment.authorId}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600"
            >
              {author?.username || `User #${comment.authorId}`}
            </Link>
            <TimeAgo
              date={comment.createdAt}
              className="text-xs text-gray-400"
            />
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {comment.content}
          </p>
        </div>

        {/* Comment actions */}
        <div className="flex items-center gap-3 mt-1 ml-2">
          <span className="text-xs text-gray-400">
            👍 {comment.likesCount}
          </span>
          {isAuthenticated && !comment.isReply && (
            <button
              onClick={() => setShowReplyBox(v => !v)}
              className="text-xs text-gray-500 hover:text-blue-600 transition font-medium"
            >
              Reply
            </button>
          )}
          {comment.isReply === false && (
            <button
              onClick={() => setShowReplies(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              {showReplies ? 'Hide replies' : 'View replies'}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => {
                if (window.confirm('Delete comment?')) deleteMutation.mutate();
              }}
              className="text-xs text-red-400 hover:text-red-600 transition ml-auto"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply Box */}
        {showReplyBox && (
          <div className="mt-2 flex gap-2">
            <Avatar
              src={user?.profilePicUrl}
              name={user?.username}
              size={7}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={`Reply to ${author?.username}…`}
                className="w-full px-3 py-1.5 text-sm bg-gray-100 rounded-full
                           border-transparent focus:outline-none focus:ring-2
                           focus:ring-blue-300 focus:bg-white transition"
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
          <div className="mt-2 ml-3 space-y-2 border-l-2 border-gray-100 pl-3">
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