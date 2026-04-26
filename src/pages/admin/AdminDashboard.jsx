import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { searchApi } from '../../api/searchApi';
import { notificationApi } from '../../api/notificationApi';
import Spinner from '../../components/common/Spinner';
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users',  value: totalUsers,     color: 'bg-blue-50 text-blue-700' },
          { label: 'Active',       value: activeUsers,    color: 'bg-green-50 text-green-700' },
          { label: 'Suspended',    value: suspendedUsers, color: 'bg-red-50 text-red-700' },
          { label: 'Admins',       value: adminUsers,     color: 'bg-purple-50 text-purple-700' },
        ].map(stat => (
          <div key={stat.label}
               className={`${stat.color} rounded-xl p-4 text-center`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Link
          to="/admin/users"
          className="bg-white rounded-xl border border-gray-200 p-5
                     hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-800">Manage Users</h3>
          <p className="text-sm text-gray-500 mt-1">
            Suspend, reactivate, or delete accounts
          </p>
        </Link>

        <Link
          to="/admin/posts"
          className="bg-white rounded-xl border border-gray-200 p-5
                     hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-semibold text-gray-800">Moderate Posts</h3>
          <p className="text-sm text-gray-500 mt-1">
            Review and remove inappropriate content
          </p>
        </Link>

        <BroadcastCard />
      </div>

      {/* Trending Hashtags */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-3">🔥 Trending Hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {trending.map(tag => (
            <Link
              key={tag.id}
              to={`/hashtags/${tag.tag}`}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full
                         text-sm font-medium hover:bg-blue-100 transition"
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-3xl mb-2">📣</div>
      <h3 className="font-semibold text-gray-800 mb-3">Broadcast</h3>
      <div className="space-y-2">
        <input
          type="text"
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Message"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
        <input
          type="text"
          value={ids}
          onChange={e => setIds(e.target.value)}
          placeholder="User IDs (comma-separated, e.g. 1,2,3)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!msg.trim() || !ids.trim() || mutation.isPending}
          className="w-full py-2 bg-red-600 text-white rounded-lg text-sm
                     hover:bg-red-700 transition disabled:opacity-50 font-medium"
        >
          {mutation.isPending ? 'Sending…' : 'Send Broadcast'}
        </button>
      </div>
    </div>
  );
}