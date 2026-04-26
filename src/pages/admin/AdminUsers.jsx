import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  ACTIVE:      'bg-green-100 text-green-700',
  SUSPENDED:   'bg-red-100 text-red-700',
  DEACTIVATED: 'bg-gray-100 text-gray-600',
};

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  // FIX: queryFn must be `() => authApi.getAllUsers()` not just `authApi.getAllUsers`
  // Backend: GET /api/v1/auth/admin/users → ApiResponse<List<UserProfileResponse>>
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => authApi.getAllUsers(),
  });
  const allUsers = data?.data?.data || [];
  const users = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Backend: PUT /api/v1/auth/admin/users/{userId}/suspend
  const suspend = useMutation({
    mutationFn: (id) => authApi.suspendUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User suspended');
    },
    onError: () => toast.error('Action failed'),
  });

  // Backend: PUT /api/v1/auth/admin/users/{userId}/reactivate
  const reactivate = useMutation({
    mutationFn: (id) => authApi.reactivateUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User reactivated');
    },
    onError: () => toast.error('Action failed'),
  });

  // Backend: DELETE /api/v1/auth/admin/users/{userId}
  const deleteUser = useMutation({
    mutationFn: (id) => authApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted');
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          User Management ({allUsers.length})
        </h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
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
                {['User', 'Role', 'Status', 'Provider', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar src={u.profilePicUrl} name={u.username} size={8} />
                      <div>
                        <p className="font-medium text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${u.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${STATUS_COLOR[u.status] || 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                    {u.provider?.toLowerCase() || '–'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => {
                            if (window.confirm('Suspend this user?')) suspend.mutate(u.id);
                          }}
                          disabled={suspend.isPending}
                          className="px-2 py-1 text-xs text-red-600 border border-red-200
                                     rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      ) : u.status === 'SUSPENDED' && (
                        <button
                          onClick={() => reactivate.mutate(u.id)}
                          disabled={reactivate.isPending}
                          className="px-2 py-1 text-xs text-green-600 border border-green-200
                                     rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Permanently delete this user?')) {
                            deleteUser.mutate(u.id);
                          }
                        }}
                        disabled={deleteUser.isPending}
                        className="px-2 py-1 text-xs text-gray-400 border border-gray-200
                                   rounded-lg hover:bg-red-50 hover:text-red-600 transition
                                   disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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