import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import Spinner from '../common/Spinner';
import { viewStory, getStoryViewers } from '../../api/mediaApi';
import { getProfileById } from '../../api/authApi';
import './StoryViewer.css';

const IMAGE_STORY_DURATION = 5000;

// ── Seen-By Modal ─────────────────────────────────────────────────────────

const SeenByModal = ({ storyId, onClose }) => {
  const [data, setData]         = useState(null);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res     = await getStoryViewers(storyId);
        const viewers = res.data?.data;
        setData(viewers);
        if (viewers?.viewers?.length) {
          const fetched = {};
          await Promise.all(
            viewers.viewers.map(async ({ viewerId }) => {
              try {
                const pr = await getProfileById(viewerId);
                fetched[viewerId] = pr.data?.data;
              } catch { /* unavailable */ }
            })
          );
          setProfiles(fetched);
        }
      } catch {
        setData({ totalViewers: 0, viewers: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storyId]);

  const timeAgo = (iso) => {
    if (!iso) return '';
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="seenby-overlay" onClick={onClose}>
      <div className="seenby-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="seenby-modal__header">
          <div className="seenby-modal__title">
            <Eye size={16} />
            Seen by
            {data && (
              <span className="seenby-modal__count">{data.totalViewers}</span>
            )}
          </div>
          <button className="seenby-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="seenby-modal__body">
          {loading ? (
            <div className="seenby-modal__loading"><Spinner size={24} /></div>
          ) : !data?.viewers?.length ? (
            <div className="seenby-modal__empty">
              <Eye size={28} color="var(--cs-text-muted)" />
              <p>No views yet</p>
            </div>
          ) : (
            <ul className="seenby-list">
              {data.viewers.map(({ viewerId, viewedAt }) => {
                const profile = profiles[viewerId];
                return (
                  <li key={viewerId} className="seenby-list__item">
                    <Avatar
                      src={profile?.profilePicUrl}
                      username={profile?.username || String(viewerId)}
                      size={36}
                    />
                    <div className="seenby-list__info">
                      <span className="seenby-list__name">
                        {profile?.fullName || profile?.username || `User #${viewerId}`}
                      </span>
                      <span className="seenby-list__time">{timeAgo(viewedAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main StoryViewer ──────────────────────────────────────────────────────

const StoryViewer = ({ stories, authorUser, onClose }) => {
  const { user } = useAuth();

  const [index, setIndex]           = useState(0);
  const [progress, setProgress]     = useState(0);
  const [paused, setPaused]         = useState(false);
  const [showSeenBy, setShowSeenBy] = useState(false);

  const progressRef = useRef(null);
  const videoRef    = useRef(null);
  const startRef    = useRef(null);
  const pausedAtRef = useRef(0);

  const story   = stories[index];
  const isVideo = story?.mediaType === 'VIDEO';
  const isOwner =
    user?.id != null &&
    story?.authorId != null &&
    Number(user.id) === Number(story.authorId);

  const goNext = useCallback(() => {
    if (index < stories.length - 1) setIndex((i) => i + 1);
    else onClose();
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  useEffect(() => {
    const onKey = (e) => {
      if (showSeenBy) return;
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goNext, goPrev, showSeenBy]);

  useEffect(() => {
    setProgress(0);
    setPaused(false);
    pausedAtRef.current = 0;
    setShowSeenBy(false);
    if (story?.id && !isOwner) viewStory(story.id).catch(() => {});
    if (!isVideo) startImageTimer();
    return () => stopTimer();
  }, [index, story?.id]); // eslint-disable-line

  const startImageTimer = () => {
    stopTimer();
    startRef.current = Date.now() - pausedAtRef.current;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min((elapsed / IMAGE_STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { stopTimer(); goNext(); }
    }, 50);
  };

  const stopTimer = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const handlePause = () => {
    if (isVideo && videoRef.current) videoRef.current.pause();
    else {
      stopTimer();
      pausedAtRef.current = Date.now() - (startRef.current ?? Date.now());
    }
    setPaused(true);
  };

  const handleResume = () => {
    if (showSeenBy) return;
    if (isVideo && videoRef.current) videoRef.current.play();
    else startImageTimer();
    setPaused(false);
  };

  const onVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) setProgress((currentTime / duration) * 100);
  };

  const onVideoEnded = () => { setProgress(100); goNext(); };

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [index, isVideo]);

  const openSeenBy = (e) => {
    e.stopPropagation();
    handlePause();
    setShowSeenBy(true);
  };

  const closeSeenBy = () => {
    setShowSeenBy(false);
    handleResume();
  };

  const timeLeft = () => {
    if (!story?.secondsUntilExpiry) return null;
    const h = Math.floor(story.secondsUntilExpiry / 3600);
    const m = Math.floor((story.secondsUntilExpiry % 3600) / 60);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  if (!story) return null;

  return (
    <>
      <div className="story-viewer" onClick={onClose} role="dialog"
           aria-modal="true" aria-label="Story viewer">
        <div className="story-viewer__box" onClick={(e) => e.stopPropagation()}>

          {/* Progress */}
          <div className="story-viewer__progress" aria-hidden="true">
            {stories.map((_, i) => (
              <div key={i} className="story-viewer__prog-track">
                <div className="story-viewer__prog-fill"
                     style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="story-viewer__header">
            <div className="story-viewer__author">
              <Avatar src={authorUser?.profilePicUrl} username={authorUser?.username} size={34} />
              <div>
                <span className="story-viewer__author-name">{authorUser?.username}</span>
                {timeLeft() && <span className="story-viewer__time-left">{timeLeft()}</span>}
              </div>
            </div>
            {paused && <span className="story-viewer__paused-badge">⏸</span>}
            <button type="button" className="story-viewer__close" onClick={onClose}
                    aria-label="Close">
              <X size={20} />
            </button>
          </div>

          {/* Media */}
          <div className="story-viewer__media">
            {isVideo ? (
              <video ref={videoRef} key={story.id} src={story.mediaUrl}
                     className="story-viewer__img" autoPlay playsInline
                     onTimeUpdate={onVideoTimeUpdate} onEnded={onVideoEnded}
                     onPause={() => setPaused(true)} onPlay={() => setPaused(false)} />
            ) : (
              <img src={story.mediaUrl} alt="Story" className="story-viewer__img" />
            )}

            {story.caption && (
              <div className="story-viewer__caption">{story.caption}</div>
            )}

            {/* ── Seen-By Button (owner only) ─────────────────────── */}
            {isOwner && (
              <button type="button" className="story-viewer__seenby-btn"
                      onClick={openSeenBy} aria-label="See who viewed this story">
                <Eye size={14} />
                <span>{story.viewsCount ?? 0} views</span>
                <Users size={13} />
              </button>
            )}

            {/* Tap zones */}
            <div className="story-viewer__tap-zone story-viewer__tap-zone--left"
                 onClick={(e) => { e.stopPropagation(); goPrev(); }}
                 onMouseDown={handlePause} onMouseUp={handleResume}
                 onTouchStart={handlePause} onTouchEnd={handleResume}
                 role="button" tabIndex={-1} aria-label="Previous" />
            <div className="story-viewer__tap-zone story-viewer__tap-zone--right"
                 onClick={(e) => { e.stopPropagation(); goNext(); }}
                 onMouseDown={handlePause} onMouseUp={handleResume}
                 onTouchStart={handlePause} onTouchEnd={handleResume}
                 role="button" tabIndex={-1} aria-label="Next" />
          </div>

          {index > 0 && (
            <button type="button" className="story-viewer__nav story-viewer__nav--prev"
                    onClick={goPrev} aria-label="Previous story">
              <ChevronLeft size={24} />
            </button>
          )}
          <button type="button" className="story-viewer__nav story-viewer__nav--next"
                  onClick={goNext} aria-label="Next story">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {showSeenBy && <SeenByModal storyId={story.id} onClose={closeSeenBy} />}
    </>
  );
};

export default StoryViewer;