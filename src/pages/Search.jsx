import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/searchApi';
import { postApi } from '../api/postApi';
import PostCard from '../components/post/PostCard';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const TABS = [
  { key: 'posts',    label: 'Posts' },
  { key: 'users',    label: 'People' },
  { key: 'hashtags', label: 'Hashtags' },
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get('query') || '';
  const tab   = params.get('type')  || 'posts';
  const [input, setInput] = useState(query);

  useEffect(() => { setInput(query); }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setParams({ query: input.trim(), type: tab });
    }
  };

  const setTab = (t) => setParams({ query, type: t });

  // Post search
  const { data: postData, isLoading: postsLoading } = useQuery({
    queryKey: ['searchPosts', query],
    queryFn: () => postApi.searchPosts(query),
    enabled: !!query && tab === 'posts',
  });

  // User search
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => searchApi.searchUsers(query),
    enabled: !!query && tab === 'users',
  });

  // Hashtag search
  const { data: hashtagData, isLoading: hashtagsLoading } = useQuery({
    queryKey: ['searchHashtags', query],
    queryFn: () => searchApi.searchHashtags(query, 30),
    enabled: !!query && tab === 'hashtags',
  });

  const posts    = postData?.data?.data?.content || [];
  const users    = userData?.data?.data || [];
  const hashtags = hashtagData?.data?.data || [];

  const isLoading = postsLoading || usersLoading || hashtagsLoading;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Box */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search posts, people, #hashtags…"
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl
                     text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm
                     font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {/* Tabs */}
      {query && (
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition
                ${tab === t.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {!query ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p>Search for posts, people or hashtags</p>
        </div>
      ) : isLoading ? (
        <Spinner center />
      ) : (
        <>
          {/* Posts */}
          {tab === 'posts' && (
            posts.length === 0
              ? <EmptyState icon="📭" title="No posts found" subtitle={`No results for "${query}"`} />
              : <div className="space-y-4">
                  {posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            users.length === 0
              ? <EmptyState icon="👤" title="No users found" />
              : <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {users.map(u => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
                    >
                      <Avatar src={u.profilePicUrl} name={u.username} size={10} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.fullName || u.username}
                        </p>
                        <p className="text-sm text-gray-500">@{u.username}</p>
                        {u.bio && (
                          <p className="text-xs text-gray-400 mt-0.5">{u.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
          )}

          {/* Hashtags */}
          {tab === 'hashtags' && (
            hashtags.length === 0
              ? <EmptyState icon="#️⃣" title="No hashtags found" />
              : <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {hashtags.map(tag => (
                    <Link
                      key={tag.id}
                      to={`/hashtags/${tag.tag}`}
                      className="flex items-center justify-between p-4
                                 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-medium text-blue-600">#{tag.tag}</p>
                        <p className="text-xs text-gray-400">
                          {tag.postCount} posts
                        </p>
                      </div>
                      <span className="text-gray-300">›</span>
                    </Link>
                  ))}
                </div>
          )}
        </>
      )}
    </div>
  );
}