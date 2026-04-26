import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postApi } from '../api/postApi';
import { searchApi } from '../api/searchApi';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['publicFeed'],
    queryFn: () => postApi.getPublicFeed(0, 10),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchApi.getTrending(10),
  });

  const posts = feedData?.data?.data?.content || [];
  const trending = trendingData?.data?.data || [];

  if (isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Link
          to="/feed"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl
                     hover:bg-blue-700 transition font-medium"
        >
          Go to your feed →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white
                       rounded-2xl p-8 mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to ConnectSphere</h1>
        <p className="text-blue-100 mb-6">
          Share moments. Build connections. Inspire communities.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/register"
            className="px-6 py-2.5 bg-white text-blue-700 rounded-xl
                       font-semibold hover:bg-blue-50 transition"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-2.5 border border-white text-white rounded-xl
                       font-semibold hover:bg-white hover:bg-opacity-10 transition"
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Public Feed */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Public Posts
          </h2>
          {feedLoading ? (
            <Spinner center />
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-400 py-12">
              No public posts yet.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-64 hidden lg:block flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">
              🔥 Trending
            </h3>
            {trending.map(tag => (
              <Link
                key={tag.id}
                to={`/hashtags/${tag.tag}`}
                className="flex justify-between items-center py-1.5 px-2
                           hover:bg-gray-50 rounded-lg transition"
              >
                <span className="text-sm text-blue-600">#{tag.tag}</span>
                <span className="text-xs text-gray-400 bg-gray-100
                                 px-2 py-0.5 rounded-full">
                  {tag.postCount}
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}