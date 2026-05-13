import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import PostCard from '../components/post/PostCard';
import StoryReel from '../components/story/StoryReel';
import Spinner from '../components/common/Spinner';
import { getPublicFeed, getPersonalFeed } from '../api/postApi';
import { getFollowingIds } from '../api/followApi';
import './Feed.css';

const Feed = () => {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const normalizePosts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.content)) return data.data.content;
    return [];
  };

  const isLastPage = (data) => {
    const pageData = data?.data || data;
    return pageData?.last ?? true;
  };

  const loadFeed = useCallback(
    async (pageNum = 0, reset = false) => {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        let res;

        if (user?.id) {
          try {
            const followingRes = await getFollowingIds(user.id);

            const followingIds =
              followingRes?.data?.data ||
              followingRes?.data ||
              [];

            const feedUserIds = [
              user.id,
              ...followingIds,
            ];

            res = await getPersonalFeed(feedUserIds, pageNum, 10);
          } catch {
            res = await getPublicFeed(pageNum, 10);
          }
        } else {
          res = await getPublicFeed(pageNum, 10);
        }

        const pageData = res?.data?.data || res?.data;
        const list = normalizePosts(res?.data);

        setPosts((prev) => (reset ? list : [...prev, ...list]));
        setHasMore(!isLastPage(pageData));
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to load feed:', error);

        if (reset) {
          setPosts([]);
        }

        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadFeed(0, true);
  }, [loadFeed]);

  useEffect(() => {
    const refreshFeed = () => {
      loadFeed(0, true);
    };

    window.addEventListener('cs:postCreated', refreshFeed);

    return () => {
      window.removeEventListener('cs:postCreated', refreshFeed);
    };
  }, [loadFeed]);

  const handlePostDeleted = useCallback((deletedId) => {
    setPosts((prev) => prev.filter((post) => post.id !== deletedId));
  }, []);

  const handlePostUpdated = useCallback((updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  }, []);

  return (
    <div className="feed-page">
      {user && <StoryReel />}

      {user && (
        <div
          className="feed-create-prompt card"
          role="button"
          tabIndex={0}
          onClick={() => {
            document.dispatchEvent(new CustomEvent('openCreatePost'));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              document.dispatchEvent(new CustomEvent('openCreatePost'));
            }
          }}
        >
          <span className="feed-create-prompt__text">
            What&apos;s on your mind, <strong>{user.username}</strong>?
          </span>

          <span className="feed-create-prompt__cta btn btn-primary btn-sm">
            Post
          </span>
        </div>
      )}

      <div className="feed-posts">
        {loading ? (
          <div className="feed-loading">
            <Spinner size={36} />
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty card">
            <span className="feed-empty__icon">📭</span>
            <h3>No posts yet</h3>
            <p>Follow people or create the first post!</p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDeleted={handlePostDeleted}
                onUpdated={handlePostUpdated}
              />
            ))}

            {hasMore && (
              <button
                type="button"
                className="feed-load-more btn btn-outline btn-full"
                onClick={() => loadFeed(page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Spinner size={16} /> Loading...
                  </>
                ) : (
                  'Load more posts'
                )}
              </button>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        className="feed-refresh-fab"
        onClick={() => loadFeed(0, true)}
        title="Refresh feed"
        aria-label="Refresh feed"
      >
        <RefreshCw size={18} />
      </button>
    </div>
  );
};

export default Feed;