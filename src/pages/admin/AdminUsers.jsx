import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_CLASS = {
  ACTIVE:      'status-badge--success',
  SUSPENDED:   'status-badge--danger',
  DEACTIVATED: 'status-badge--neutral',
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
    <div className="admin-page">
      <div className="page-header">
        <h1 className="page-title">
          User Management ({allUsers.length})
        </h1>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
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
                {['User', 'Role', 'Status', 'Provider', 'Actions'].map(h => (
                  <th key={h}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty-cell">
                    No users found
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-cell">
                      <Avatar src={u.profilePicUrl} name={u.username} size={8} />
                      <div>
                        <p className="admin-user-cell__name">{u.username}</p>
                        <p className="admin-user-cell__email">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${u.role === 'ADMIN' ? 'status-badge--purple' : 'status-badge--neutral'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASS[u.status] || 'status-badge--neutral'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="admin-table__muted-cell">
                    {u.provider?.toLowerCase() || '–'}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => {
                            if (window.confirm('Suspend this user?')) suspend.mutate(u.id);
                          }}
                          disabled={suspend.isPending}
                          className="danger-outline-button"
                        >
                          Suspend
                        </button>
                      ) : u.status === 'SUSPENDED' && (
                        <button
                          onClick={() => reactivate.mutate(u.id)}
                          disabled={reactivate.isPending}
                          className="success-outline-button"
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
                        className="muted-outline-button"
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
