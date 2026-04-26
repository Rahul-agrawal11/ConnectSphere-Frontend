import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TimeAgo from 'react-timeago';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '../../api/postApi';
import { likeApi } from '../../api/likeApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import EmojiBar from './EmojiBar';
import toast from 'react-hot-toast';

// FIX: Hoist EMOJI_MAP BEFORE the component so it is accessible inside
// PostCard AND exported for EmojiBar without forward-reference issues
export const EMOJI_MAP = {
  LIKE:  '👍',
  LOVE:  '❤️',
  HAHA:  '😂',
  WOW:   '😮',
  SAD:   '😢',
  ANGRY: '😡',
};

const VISIBILITY_ICON = {
  PUBLIC:          '🌍',
  FOLLOWERS_ONLY:  '👥',
  PRIVATE:         '🔒',
};

export default function PostCard({ post, onDelete }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isOwner = user?.userId === post.authorId;

  // ── Fetch author profile ─────────────────────────────────────────────────
  // Backend: GET /api/v1/auth/profile/{userId} → ApiResponse<UserProfileResponse>
  const { data: authorData } = useQuery({
    queryKey: ['profile', post.authorId],
    queryFn: () => authApi.getProfileById(post.authorId),
    staleTime: 1000 * 60 * 5,
  });
  const author = authorData?.data?.data;

  // ── Fetch reaction summary ───────────────────────────────────────────────
  // Backend: GET /api/v1/likes/summary?targetId=&targetType=POST
  // Returns: ApiResponse<ReactionSummaryResponse>
  // ReactionSummaryResponse: { targetId, targetType, totalCount, reactions: Map<String,Long> }
  const { data: reactionData, refetch: refetchReactions } = useQuery({
    queryKey: ['reactions', post.id, 'POST'],
    queryFn: () => likeApi.getReactionSummary(post.id, 'POST'),
    staleTime: 1000 * 30,
  });
  const reactionSummary = reactionData?.data?.data;

  // ── Fetch user's own reaction ────────────────────────────────────────────
  // Backend: GET /api/v1/likes/my-reaction?targetId=&targetType=POST
  // Returns: ApiResponse<LikeResponse>
  // LikeResponse: { id, userId, targetId, targetType, reactionType, createdAt, updatedAt }
  const { data: myReactionData, refetch: refetchMyReaction } = useQuery({
    queryKey: ['myReaction', post.id, 'POST'],
    queryFn: () => likeApi.getUserReaction(post.id, 'POST'),
    enabled: isAuthenticated,
    retry: false, // 404 is expected when user hasn't reacted
  });
  const myReaction = myReactionData?.data?.data;

  // ── React / Unreact / Change reaction ───────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: (reactionType) => {
      if (myReaction) {
        // Already reacted
        if (myReaction.reactionType === reactionType) {
          // Same reaction → unreact (toggle off)
          // Backend: DELETE /api/v1/likes?targetId=&targetType=POST
          return likeApi.unreact(post.id, 'POST');
        }
        // Different reaction → change type
        // Backend: PUT /api/v1/likes/change?targetId=&targetType=POST&newReactionType=
        return likeApi.changeReaction(post.id, 'POST', reactionType);
      }
      // New reaction
      // Backend: POST /api/v1/likes  body: { targetId, targetType, reactionType }
      return likeApi.react({ targetId: post.id, targetType: 'POST', reactionType });
    },
    onSuccess: () => {
      refetchReactions();
      refetchMyReaction();
    },
    onError: () => toast.error('Could not react'),
  });

  // ── Delete post ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => postApi.deletePost(post.id),
    onSuccess: () => {
      toast.success('Post deleted');
      onDelete?.(post.id);
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Link
          to={`/profile/${post.authorId}`}
          className="flex items-center gap-2 group"
        >
          <Avatar
            src={author?.profilePicUrl}
            name={author?.username || `User ${post.authorId}`}
            size={9}
          />
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">
              {author?.fullName || author?.username || `User #${post.authorId}`}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>@{author?.username || post.authorId}</span>
              <span>·</span>
              <TimeAgo date={post.createdAt} />
              <span>·</span>
              <span title={post.visibility}>
                {VISIBILITY_ICON[post.visibility] || '🌍'}
              </span>
            </div>
          </div>
        </Link>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={() => navigate(`/posts/${post.id}`)}
              className="p-1.5 text-gray-400 hover:text-blue-500
                         hover:bg-blue-50 rounded-lg text-xs transition"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this post?')) {
                  deleteMutation.mutate();
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-500
                         hover:bg-red-50 rounded-lg text-xs transition"
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={`/posts/${post.id}`}>
        <p className="text-gray-800 text-sm leading-relaxed mb-3 whitespace-pre-wrap
                       hover:text-gray-900 transition line-clamp-3">
          {post.content}
        </p>
      </Link>

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div className={`grid gap-1 mb-3 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-full rounded-lg object-cover max-h-64"
            />
          ))}
        </div>
      )}

      {/* Hashtags */}
      {post.content && /#\w+/.test(post.content) && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(post.content.match(/#[\w]+/g) || []).map(tag => (
            <Link
              key={tag}
              to={`/hashtags/${tag.slice(1)}`}
              className="text-xs text-blue-500 hover:text-blue-700
                         bg-blue-50 px-2 py-0.5 rounded-full transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}

      {/* Reaction Summary — shows emoji counts e.g. 👍 10 ❤️ 5 */}
      {reactionSummary?.totalCount > 0 && (
        <div className="flex gap-2 mb-2 text-xs text-gray-500">
          {Object.entries(reactionSummary.reactions || {}).map(([type, count]) => (
            <span key={type}>
              {EMOJI_MAP[type]} {count}
            </span>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-gray-400
                       border-t border-gray-100 pt-2 mt-2">
        <span>{post.likesCount ?? 0} reactions</span>
        <Link to={`/posts/${post.id}`} className="hover:text-blue-500 transition">
          {post.commentsCount ?? 0} comments
        </Link>
        <span>{post.sharesCount ?? 0} shares</span>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
        {/* Reaction Button + Emoji Picker */}
        <div className="relative">
          <button
            onClick={() => {
              if (!isAuthenticated) { navigate('/login'); return; }
              setShowEmojiPicker(v => !v);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        text-sm transition font-medium
                        ${myReaction
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <span>{myReaction ? EMOJI_MAP[myReaction.reactionType] : '👍'}</span>
            <span>{myReaction ? myReaction.reactionType : 'Like'}</span>
          </button>

          {showEmojiPicker && (
            <EmojiBar
              onSelect={(type) => {
                reactMutation.mutate(type);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Comment Button */}
        <Link
          to={`/posts/${post.id}#comments`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     text-sm text-gray-600 hover:bg-gray-100 transition"
        >
          <span>💬</span>
          <span>Comment</span>
        </Link>

        {/* Share — copy link to clipboard */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `${window.location.origin}/posts/${post.id}`
            );
            toast.success('Link copied!');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                     text-sm text-gray-600 hover:bg-gray-100 transition ml-auto"
        >
          <span>🔗</span>
          <span className="hidden sm:block">Share</span>
        </button>
      </div>
    </article>
  );
}