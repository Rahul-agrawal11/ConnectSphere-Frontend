import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '../../api/postApi';
import { searchApi } from '../../api/searchApi';
import TimeAgo from 'react-timeago';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function AdminPosts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'posts'],
    queryFn: () => postApi.getPublicFeed(0, 50),
  });
  const allPosts = data?.data?.data?.content || [];
  const posts = allPosts.filter(p =>
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (postId) => {
      await postApi.adminDeletePost(postId);
      await searchApi.removePostIndex(postId).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin', 'posts']);
      toast.success('Post removed');
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Content Moderation ({allPosts.length})
        </h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter posts…"
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-300 transition w-56"
        />
      </div>

      {isLoading ? (
        <Spinner center />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Post', 'Author', 'Stats', 'Visibility', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-800 line-clamp-2 text-xs">
                      {post.content}
                    </p>
                    <TimeAgo
                      date={post.createdAt}
                      className="text-xs text-gray-400 mt-0.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    User #{post.authorId}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>❤️ {post.likesCount}</div>
                    <div>💬 {post.commentsCount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600
                                     rounded-full text-xs">
                      {post.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this post?')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 text-xs text-red-600 border border-red-200
                                 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}