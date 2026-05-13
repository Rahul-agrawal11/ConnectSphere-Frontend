import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, MoreHorizontal, Trash2, Edit3, Globe, Lock, Users,
  Share2,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import ReactionBar from './ReactionBar';
import CommentSection from '../comment/CommentSection';
import EditPostModal from './EditPostModal';
import {
  getReactionSummary, react, unreact, getMyReaction, changeReaction,
} from '../../api/likeApi';
import { deletePost } from '../../api/postApi';
import { getProfileById } from '../../api/authApi';
import { useToast } from '../common/Toast';
import './PostCard.css';

const VISIBILITY_ICONS = {
  PUBLIC:           <Globe    size={12} />,
  FOLLOWERS_ONLY:   <Users    size={12} />,
  PRIVATE:          <Lock     size={12} />,
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60)    return 'just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const PostCard = ({ post, onDeleted, onUpdated }) => {
  const { user }     = useAuth();
  const { addToast } = useToast();

  const [author, setAuthor]             = useState(null);
  const [summary, setSummary]           = useState({});
  const [totalCount, setTotalCount]     = useState(post.likesCount || 0);
  const [userReaction, setUserReaction] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const isOwner = user && user.id === post.authorId;

  useEffect(() => {
    loadAuthor();
    loadReactions();
    if (user) loadMyReaction();
  }, [post.id, user]);

  const loadAuthor = async () => {
    try {
      const res = await getProfileById(post.authorId);
      setAuthor(res.data?.data || null);
    } catch { /* author display is non-critical */ }
  };

  const loadReactions = async () => {
    try {
      const res = await getReactionSummary(post.id, 'POST');
      const s   = res.data?.data;
      if (s) {
        setSummary(s.reactions || {});
        setTotalCount(s.totalCount || 0);
      }
    } catch { /* silent — reaction bar shows 0 */ }
  };

  /**
   * Load the current user's reaction on this post.
   *
   * FIX: Backend now returns 200 with data=null when user has not reacted.
   * No more 404 noise in the console — just clean null handling.
   */
  const loadMyReaction = async () => {
    try {
      const res = await getMyReaction(post.id, 'POST');
      setUserReaction(res.data?.data?.reactionType || null);
    } catch { /* if auth fails, user reaction stays null */ }
  };

  /**
   * Handle reaction selection from the ReactionBar picker.
   *
   * Cases:
   *   1. No existing reaction   → react()        → totalCount + 1
   *   2. Same reaction selected → unreact()       → totalCount - 1 (toggle off)
   *   3. Different reaction     → changeReaction() → totalCount unchanged, summary updated
   */
  const handleReact = useCallback(async (reactionType) => {
    if (!user) {
      addToast('Please log in to react', 'info');
      return;
    }

    try {
      if (!userReaction) {
        // Case 1: Fresh reaction
        await react({ targetId: post.id, targetType: 'POST', reactionType });

        // Optimistic update
        setTotalCount((c) => c + 1);
        setSummary((prev) => ({
          ...prev,
          [reactionType]: (prev[reactionType] || 0) + 1,
        }));
        setUserReaction(reactionType);

      } else if (userReaction === reactionType) {
        // Case 2: Same reaction clicked → toggle off (unreact)
        await unreact(post.id, 'POST');

        // Optimistic update
        setTotalCount((c) => Math.max(c - 1, 0));
        setSummary((prev) => ({
          ...prev,
          [reactionType]: Math.max((prev[reactionType] || 1) - 1, 0),
        }));
        setUserReaction(null);

      } else {
        // Case 3: Change to a different reaction type
        await changeReaction(post.id, 'POST', reactionType);

        // Optimistic update — swap old type for new type, total count unchanged
        setSummary((prev) => {
          const next = { ...prev };
          next[userReaction] = Math.max((next[userReaction] || 1) - 1, 0);
          next[reactionType] = (next[reactionType] || 0) + 1;
          return next;
        });
        setUserReaction(reactionType);
        // totalCount unchanged
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to react', 'error');
      // Reload actual server state to fix any optimistic update drift
      loadReactions();
      loadMyReaction();
    }
  }, [user, userReaction, post.id]);

  const handleUnreact = useCallback(async () => {
    if (!user || !userReaction) return;
    try {
      await unreact(post.id, 'POST');

      // Optimistic update
      setSummary((prev) => ({
        ...prev,
        [userReaction]: Math.max((prev[userReaction] || 1) - 1, 0),
      }));
      setTotalCount((c) => Math.max(c - 1, 0));
      setUserReaction(null);
    } catch (err) {
      addToast('Failed to remove reaction', 'error');
      loadReactions();
      loadMyReaction();
    }
  }, [user, userReaction, post.id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await deletePost(post.id);
      addToast('Post deleted', 'success');
      onDeleted?.(post.id);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const renderContent = (content = '') => {
    // Render hashtags and mentions as styled/linked text
    return content.split(/(\s)/).map((word, i) => {
      if (word.startsWith('#')) {
        return (
          <Link key={i} to={`/search?tag=${word.slice(1)}`} className="post-card__hashtag">
            {word}
          </Link>
        );
      }
      if (word.startsWith('@')) {
        return <span key={i} className="post-card__mention">{word}</span>;
      }
      return word;
    });
  };

  return (
    <article className="post-card card animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="post-card__header">
        <Link to={`/profile/${post.authorId}`} className="post-card__author-link">
          <Avatar
            src={author?.profilePicUrl}
            username={author?.username || String(post.authorId)}
            size={42}
          />
          <div className="post-card__author-info">
            <span className="post-card__author-name">
              {author?.fullName || author?.username || `User #${post.authorId}`}
            </span>
            <span className="post-card__meta">
              <span className="post-card__time">{timeAgo(post.createdAt)}</span>
              <span className="post-card__visibility">
                {VISIBILITY_ICONS[post.visibility] || <Globe size={12} />}
                {post.visibility?.toLowerCase().replace('_', '-')}
              </span>
            </span>
          </div>
        </Link>

        {isOwner && (
          <div className="post-card__menu-wrap">
            <button
              className="post-card__menu-btn"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Post options"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="post-card__menu animate-scale-in">
                <button
                  className="post-card__menu-item"
                  onClick={() => { setEditOpen(true); setMenuOpen(false); }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  className="post-card__menu-item post-card__menu-item--danger"
                  onClick={() => { handleDelete(); setMenuOpen(false); }}
                  disabled={deleting}
                >
                  <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="post-card__content">
        <p className="post-card__text">{renderContent(post.content)}</p>

        {/* Media grid */}
        {post.mediaUrls?.length > 0 && (
          <div className={`post-card__media post-card__media--${Math.min(post.mediaUrls.length, 4)}`}>
            {post.mediaUrls.slice(0, 4).map((url, i) => {
              const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
              return isVideo ? (
                <video key={i} src={url} controls className="post-card__media-item" />
              ) : (
                <img key={i} src={url} alt="" className="post-card__media-item" loading="lazy" />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {(totalCount > 0 || post.commentsCount > 0) && (
        <div className="post-card__stats">
          {totalCount > 0 && (
            <span className="post-card__stat">{totalCount} reactions</span>
          )}
          {post.commentsCount > 0 && (
            <span className="post-card__stat">{post.commentsCount} comments</span>
          )}
        </div>
      )}

      <hr className="divider" />

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="post-card__actions">
        <ReactionBar
          targetId={post.id}
          targetType="POST"
          summary={summary}
          totalCount={totalCount}
          userReaction={userReaction}
          onReact={handleReact}
          onUnreact={handleUnreact}
        />
        <button
          className={`post-card__action-btn ${showComments ? 'post-card__action-btn--active' : ''}`}
          onClick={() => setShowComments((p) => !p)}
        >
          <MessageCircle size={16} />
          Comment
        </button>
        <button className="post-card__action-btn">
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* ── Comments ───────────────────────────────────────────────────── */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}

      {/* ── Edit modal ─────────────────────────────────────────────────── */}
      {editOpen && (
        <EditPostModal
          post={post}
          onClose={() => setEditOpen(false)}
          onUpdated={(updated) => {
            onUpdated?.(updated);
            setEditOpen(false);
          }}
        />
      )}
    </article>
  );
};

export default PostCard;