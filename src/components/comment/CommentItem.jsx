import { useState, useEffect } from 'react';
import { Trash2, Edit3, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { getProfileById } from '../../api/authApi';
import { deleteComment, updateComment, getReplies, addComment } from '../../api/commentApi';
import { react, unreact, getMyReaction } from '../../api/likeApi';
import { useToast } from '../common/Toast';
import './CommentItem.css';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const CommentItem = ({ comment, postId, onDeleted, depth = 0 }) => {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [author, setAuthor]         = useState(null);
  const [editing, setEditing]       = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [liked, setLiked]           = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies]       = useState([]);
  const [replying, setReplying]     = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [saving, setSaving]         = useState(false);

  const isOwner = user?.id === comment.authorId;

  useEffect(() => {
    getProfileById(comment.authorId)
      .then((r) => setAuthor(r.data.data))
      .catch(() => {});

    if (user) {
      getMyReaction(comment.id, 'COMMENT')
        .then((r) => setLiked(!!r.data.data?.reactionType))
        .catch(() => {});
    }
  }, [comment.id, comment.authorId, user]);

  const handleLike = async () => {
    if (!user) { addToast('Login to like comments', 'info'); return; }
    try {
      if (liked) {
        await unreact(comment.id, 'COMMENT');
        setLiked(false);
        setLikesCount((c) => Math.max(c - 1, 0));
      } else {
        await react({ targetId: comment.id, targetType: 'COMMENT', reactionType: 'LIKE' });
        setLiked(true);
        setLikesCount((c) => c + 1);
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(comment.id);
      addToast('Comment deleted', 'success');
      onDeleted?.(comment.id);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await updateComment(comment.id, { content: editContent.trim() });
      comment.content = editContent.trim();
      setEditing(false);
      addToast('Comment updated', 'success');
    } catch {
      addToast('Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    try {
      const res = await getReplies(comment.id);
      setReplies(res.data.data?.content || []);
      setShowReplies(true);
    } catch {}
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setReplyLoading(true);
    try {
      const res = await addComment({
        postId,
        parentCommentId: comment.id,
        content: replyContent.trim(),
      });
      setReplies((prev) => [...prev, res.data.data]);
      setShowReplies(true);
      setReplying(false);
      setReplyContent('');
      addToast('Reply added', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reply', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const isDeleted = comment.content === '[deleted]';

  return (
    <div className={`comment-item ${depth > 0 ? 'comment-item--reply' : ''}`}>
      <Link to={`/profile/${comment.authorId}`}>
        <Avatar
          src={author?.profilePicUrl}
          username={author?.username || '?'}
          size={depth > 0 ? 30 : 36}
        />
      </Link>

      <div className="comment-item__body">
        <div className="comment-item__bubble">
          <div className="comment-item__header">
            <Link to={`/profile/${comment.authorId}`} className="comment-item__author">
              {author?.fullName || author?.username || `User #${comment.authorId}`}
            </Link>
            <span className="comment-item__time">{timeAgo(comment.createdAt)}</span>
          </div>

          {editing ? (
            <div className="comment-item__edit">
              <textarea
                className="form-input comment-item__edit-input"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                autoFocus
              />
              <div className="comment-item__edit-actions">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  Save
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`comment-item__text ${isDeleted ? 'comment-item__text--deleted' : ''}`}>
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isDeleted && (
          <div className="comment-item__actions">
            <button
              className={`comment-item__action ${liked ? 'comment-item__action--liked' : ''}`}
              onClick={handleLike}
            >
              👍 {likesCount > 0 ? likesCount : ''} Like
            </button>
            {depth === 0 && user && (
              <button
                className="comment-item__action"
                onClick={() => setReplying((p) => !p)}
              >
                <CornerDownRight size={12} /> Reply
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button className="comment-item__action" onClick={() => setEditing(true)}>
                  <Edit3 size={12} /> Edit
                </button>
                <button
                  className="comment-item__action comment-item__action--danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {replying && (
          <form className="comment-item__reply-form" onSubmit={handleReply}>
            <input
              className="form-input comment-item__reply-input"
              placeholder="Write a reply…"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={replyLoading || !replyContent.trim()}
            >
              Reply
            </button>
          </form>
        )}

        {/* Toggle replies */}
        {depth === 0 && (
          <button className="comment-item__replies-toggle" onClick={loadReplies}>
            {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {showReplies ? 'Hide replies' : 'View replies'}
          </button>
        )}

        {/* Replies list */}
        {showReplies && replies.length > 0 && (
          <div className="comment-item__replies">
            {replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
                postId={postId}
                onDeleted={(id) => setReplies((prev) => prev.filter((x) => x.id !== id))}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;