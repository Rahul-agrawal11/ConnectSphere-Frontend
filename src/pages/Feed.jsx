import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { followApi } from '../api/followApi';
import { postApi } from '../api/postApi';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/post/PostCard';
import StoryReel from '../components/story/StoryReel';
import Sidebar from '../components/layout/Sidebar';
import CreatePostInline from '../components/post/CreatePostInline';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { Link } from 'react-router-dom';

export default function Feed() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [allPosts, setAllPosts] = useState([]);

  // ── Get following IDs ────────────────────────────────────────────────────
  // Backend: GET /api/v1/follows/internal/following-ids/{userId}
  // Returns: plain List<Long> (NOT wrapped in ApiResponse)
  // axios wraps it in res.data → so followingData.data = List<Long>
  const { data: followingData } = useQuery({
    queryKey: ['followingIds', user?.userId],
    queryFn: () => followApi.getFollowingIds(user.userId),
    enabled: !!user?.userId,
  });
  // The /internal/following-ids endpoint returns a raw List<Long>, not ApiResponse
  const followedUserIds = followingData?.data || [];

  // ── Fetch personalised feed ──────────────────────────────────────────────
  // Backend: GET /api/v1/posts/feed?followedUserIds=1&followedUserIds=2&page=0&size=10
  // Returns: ApiResponse<Page<PostResponse>>
  const { data: feedData, isLoading, isFetching } = useQuery({
    queryKey: ['feed', JSON.stringify(followedUserIds), page],
    queryFn: () => postApi.getFeed(followedUserIds, page),
    enabled: true,
    keepPreviousData: true,
  });

  useEffect(() => {
    // axios response: res.data → ApiResponse
    // ApiResponse.data → Page<PostResponse>
    // Page.content → PostResponse[]
    const newPosts = feedData?.data?.data?.content || [];
    if (page === 0) {
      setAllPosts(newPosts);
    } else {
      setAllPosts(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...newPosts.filter(p => !ids.has(p.id))];
      });
    }
  }, [feedData, page]);

  const totalPages = feedData?.data?.data?.totalPages || 1;
  const hasMore    = page < totalPages - 1;

  const handleDelete = (postId) => {
    setAllPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Stories */}
        <StoryReel followedUserIds={followedUserIds} />

        {/* Inline post creator */}
        <CreatePostInline onCreated={(post) => setAllPosts(prev => [post, ...prev])} />

        {/* Posts */}
        {isLoading && page === 0 ? (
          <Spinner center />
        ) : allPosts.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Your feed is empty"
            subtitle="Follow people to see their posts here"
            action={
              <Link
                to="/suggestions"
                className="px-5 py-2 bg-blue-600 text-white rounded-xl
                           hover:bg-blue-700 transition text-sm font-medium"
              >
                Find People
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {allPosts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} />
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={isFetching}
                  className="px-6 py-2 border border-gray-300 text-gray-600
                             rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  {isFetching ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Sidebar />
    </div>
  );
}