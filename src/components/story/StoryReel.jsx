import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import StoryViewer from './StoryViewer';
import {
  getStoriesFeed,
  getStoriesByUser,
  createStory,
} from '../../api/mediaApi';
import { getFollowingIds } from '../../api/followApi';
import { getProfileById } from '../../api/authApi';
import { useToast } from '../common/Toast';
import './StoryReel.css';

const StoryReel = () => {
  const { user }        = useAuth();
  const { addToast }    = useToast();

  const [storyGroups, setStoryGroups]   = useState([]);   // [{ user, stories }]
  const [myStories, setMyStories]       = useState([]);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [uploading, setUploading]       = useState(false);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (user) loadStories();
  }, [user]);

  const loadStories = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ── My stories ────────────────────────────────────────────────────
      let myList = [];
      try {
        const myRes = await getStoriesByUser(user.id);
        myList = myRes.data?.data || [];
      } catch {
        // My stories failing is non-fatal — continue loading others
      }
      setMyStories(myList);

      // ── Following IDs ─────────────────────────────────────────────────
      // FollowController returns ResponseEntity<List<Long>> directly (no ApiResponse wrapper)
      // so idsRes.data IS the array, not idsRes.data.data
      let ids = [];
      try {
        const idsRes = await getFollowingIds(user.id);
        // Handle both wrapped { data: [...] } and bare [...] responses
        ids = Array.isArray(idsRes.data)
          ? idsRes.data
          : (Array.isArray(idsRes.data?.data) ? idsRes.data.data : []);
      } catch {
        // User not following anyone yet — treat as empty list
      }

      if (ids.length === 0) {
        setStoryGroups([]);
        return;
      }

      // ── Stories feed ──────────────────────────────────────────────────
      let allStories = [];
      try {
        const feedRes  = await getStoriesFeed(ids);
        allStories = feedRes.data?.data || [];
      } catch {
        // Feed failing is non-fatal
      }

      if (allStories.length === 0) {
        setStoryGroups([]);
        return;
      }

      // Group by authorId
      const grouped = {};
      allStories.forEach((s) => {
        if (!grouped[s.authorId]) grouped[s.authorId] = [];
        grouped[s.authorId].push(s);
      });

      // Fetch user profiles for each story group
      const groups = await Promise.all(
        Object.entries(grouped).map(async ([authorId, stories]) => {
          try {
            const profileRes = await getProfileById(Number(authorId));
            return { user: profileRes.data?.data, stories };
          } catch {
            return null;
          }
        })
      );

      setStoryGroups(groups.filter(Boolean));
    } catch (err) {
      // Top-level failure — show toast only for unexpected errors
      console.error('Story reel load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleCreateStory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await createStory(file, '');
      addToast('Story created!', 'success');
      loadStories();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create story', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleBubbleKeyDown = (e, group) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setViewingGroup(group);
    }
  };

  // Don't render if not logged in
  if (!user) return null;

  return (
    <>
      <div className="story-reel" aria-label="Stories">
        {/* ── Add my story ─────────────────────────────────────────── */}
        <div className="story-bubble story-bubble--add">
          <label
            className="story-bubble__add-label"
            title={uploading ? 'Uploading…' : 'Add story'}
            aria-label="Create a new story"
          >
            <div className="story-bubble__ring story-bubble__ring--add">
              <Avatar
                src={user.profilePicUrl}
                username={user.username}
                size={56}
              />
              <div className="story-bubble__add-icon">
                {uploading ? '…' : <Plus size={14} />}
              </div>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              style={{ display: 'none' }}
              onChange={handleCreateStory}
              disabled={uploading}
            />
          </label>
          <span className="story-bubble__name">Your Story</span>
        </div>

        {/* ── My existing stories ───────────────────────────────────── */}
        {myStories.length > 0 && (
          <div
            className="story-bubble"
            onClick={() => setViewingGroup({ user, stories: myStories })}
            onKeyDown={(e) => handleBubbleKeyDown(e, { user, stories: myStories })}
            role="button"
            tabIndex={0}
            aria-label={`View your stories (${myStories.length})`}
          >
            <div className="story-bubble__ring story-bubble__ring--active">
              <Avatar src={user.profilePicUrl} username={user.username} size={56} />
            </div>
            <span className="story-bubble__name">My Stories</span>
          </div>
        )}

        {/* ── Other users' stories ──────────────────────────────────── */}
        {storyGroups.map((group) => (
          <div
            key={group.user?.id ?? group.stories[0]?.authorId}
            className="story-bubble"
            onClick={() => setViewingGroup(group)}
            onKeyDown={(e) => handleBubbleKeyDown(e, group)}
            role="button"
            tabIndex={0}
            aria-label={`View ${group.user?.username ?? 'user'}'s stories`}
          >
            <div className="story-bubble__ring story-bubble__ring--active">
              <Avatar
                src={group.user?.profilePicUrl}
                username={group.user?.username}
                size={56}
              />
            </div>
            <span className="story-bubble__name">
              {(group.user?.username ?? 'User').slice(0, 10)}
            </span>
          </div>
        ))}

        {/* ── Loading placeholder ───────────────────────────────────── */}
        {loading && storyGroups.length === 0 && myStories.length === 0 && (
          <div className="story-bubble story-bubble--loading" aria-hidden="true">
            <div className="story-bubble__ring story-bubble__ring--skeleton" />
            <span className="story-bubble__name story-bubble__name--skeleton" />
          </div>
        )}
      </div>

      {/* ── Story viewer modal ────────────────────────────────────────── */}
      {viewingGroup && (
        <StoryViewer
          stories={viewingGroup.stories}
          authorUser={viewingGroup.user}
          onClose={() => setViewingGroup(null)}
        />
      )}
    </>
  );
};

export default StoryReel;