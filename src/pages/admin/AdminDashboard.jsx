import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { searchApi } from '../../api/searchApi';
import { notificationApi } from '../../api/notificationApi';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  // FIX: queryFn must be a function — was `authApi.getAllUsers` (a reference, not a call)
  // React Query calls queryFn() — if it's not a function that returns a Promise, it breaks
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => authApi.getAllUsers(),
  });
  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchApi.getTrending(20),
  });

  // Backend: ApiResponse<List<UserProfileResponse>>
  const users    = usersData?.data?.data || [];
  // Backend: ApiResponse<List<HashtagResponse>>
  const trending = trendingData?.data?.data || [];

  const totalUsers     = users.length;
  const activeUsers    = users.filter(u => u.status === 'ACTIVE').length;
  const suspendedUsers = users.filter(u => u.status === 'SUSPENDED').length;
  const adminUsers     = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="admin-page">
      <h1 className="page-title">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {[
          { label: 'Total Users',  value: totalUsers,     tone: 'admin-stat-card--blue' },
          { label: 'Active',       value: activeUsers,    tone: 'admin-stat-card--green' },
          { label: 'Suspended',    value: suspendedUsers, tone: 'admin-stat-card--red' },
          { label: 'Admins',       value: adminUsers,     tone: 'admin-stat-card--purple' },
        ].map(stat => (
          <div key={stat.label}
               className={`admin-stat-card ${stat.tone}`}>
            <p className="admin-stat-card__value">{stat.value}</p>
            <p className="admin-stat-card__label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="admin-actions-grid">
        <Link
          to="/admin/users"
          className="admin-action-card"
        >
          <div className="admin-action-card__icon">👥</div>
          <h3 className="admin-action-card__title">Manage Users</h3>
          <p className="admin-action-card__text">
            Suspend, reactivate, or delete accounts
          </p>
        </Link>

        <Link
          to="/admin/posts"
          className="admin-action-card"
        >
          <div className="admin-action-card__icon">📝</div>
          <h3 className="admin-action-card__title">Moderate Posts</h3>
          <p className="admin-action-card__text">
            Review and remove inappropriate content
          </p>
        </Link>

        <BroadcastCard />
      </div>

      {/* Trending Hashtags */}
      <div className="section-card">
        <h3 className="section-card__title">🔥 Trending Hashtags</h3>
        <div className="hashtag-list">
          {trending.map(tag => (
            <Link
              key={tag.id}
              to={`/hashtags/${tag.tag}`}
              className="hashtag-pill"
            >
              #{tag.tag} ({tag.postCount})
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function BroadcastCard() {
  const [msg, setMsg] = React.useState('');
  const [ids, setIds] = React.useState('');

  // Backend: POST /api/v1/notifications/bulk
  // DTO: { recipientIds: Long[], type: NotificationType, message: String, targetType: String }
  const mutation = useMutation({
    mutationFn: () => notificationApi.sendBulk({
      recipientIds: ids.split(',').map(s => parseInt(s.trim())).filter(Boolean),
      type: 'BROADCAST',
      message: msg,
      targetType: 'SYSTEM',
    }),
    onSuccess: () => {
      toast.success('Broadcast sent!');
      setMsg('');
      setIds('');
    },
    onError: () => toast.error('Broadcast failed'),
  });

  return (
    <div className="admin-action-card">
      <div className="admin-action-card__icon">📣</div>
      <h3 className="admin-action-card__title">Broadcast</h3>
      <div className="admin-broadcast-form">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Message"
          className="form-input"
        />
        <input
          type="text"
          value={ids}
          onChange={e => setIds(e.target.value)}
          placeholder="User IDs (comma-separated, e.g. 1,2,3)"
          className="form-input"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!msg.trim() || !ids.trim() || mutation.isPending}
          className="danger-button danger-button--full"
        >
          {mutation.isPending ? 'Sending…' : 'Send Broadcast'}
        </button>
      </div>
    </div>
  );
}
