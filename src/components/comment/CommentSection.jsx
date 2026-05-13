import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import CommentItem from './CommentItem';
import { getCommentsByPost, addComment } from '../../api/commentApi';
import { useToast } from '../common/Toast';
import './CommentSection.css';

const CommentSection = ({ postId }) => {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage]           = useState(0);
  const [hasMore, setHasMore]     = useState(false);

  useEffect(() => {
    loadComments(0, true);
  }, [postId]);

  const loadComments = async (pageNum = 0, reset = false) => {
    setLoading(pageNum === 0);
    try {
      const res  = await getCommentsByPost(postId, pageNum, 5);
      const data = res.data.data;
      const list = data?.content || [];
      setComments((prev) => reset ? list : [...prev, ...list]);
      setHasMore(!data?.last);
      setPage(pageNum);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment({ postId, content: newComment.trim() });
      setComments((prev) => [res.data.data, ...prev]);
      setNewComment('');
      addToast('Comment posted!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="comment-section">
      {/* Input */}
      {user && (
        <form className="comment-section__form" onSubmit={handleSubmit}>
          <Avatar
            src={user.profilePicUrl}
            username={user.username}
            size={36}
          />
          <div className="comment-section__input-wrap">
            <input
              className="comment-section__input"
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
            />
            <button
              type="submit"
              className="comment-section__send-btn"
              disabled={submitting || !newComment.trim()}
              aria-label="Post comment"
            >
              {submitting
                ? <Loader2 size={16} className="spinner-icon" />
                : <Send size={16} />}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="comment-section__list">
        {loading ? (
          <p className="comment-section__empty">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="comment-section__empty">No comments yet. Be the first!</p>
        ) : (
          <>
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={postId}
                onDeleted={(id) =>
                  setComments((prev) => prev.filter((x) => x.id !== id))
                }
              />
            ))}
            {hasMore && (
              <button
                className="comment-section__load-more"
                onClick={() => loadComments(page + 1)}
              >
                Load more comments
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentSection;