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
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">
          Content Moderation ({allPosts.length})
        </h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter posts…"
          className="admin-filter-input"
        />
      </div>

      {isLoading ? (
        <Spinner center />
      ) : (
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                {['Post', 'Author', 'Stats', 'Visibility', 'Actions'].map(h => (
                  <th key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td className="admin-table__content-cell">
                    <p className="admin-post-excerpt">
                      {post.content}
                    </p>
                    <TimeAgo
                      date={post.createdAt}
                      className="admin-table__timestamp"
                    />
                  </td>
                  <td>
                    User #{post.authorId}
                  </td>
                  <td>
                    <div>❤️ {post.likesCount}</div>
                    <div>💬 {post.commentsCount}</div>
                  </td>
                  <td>
                    <span className="status-badge status-badge--neutral">
                      {post.visibility}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this post?')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="danger-outline-button"
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
