import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';
import { useNotifications } from '../context/NotificationContext';
import TimeAgo from 'react-timeago';
import { Link } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  LIKE:      '❤️',
  COMMENT:   '💬',
  REPLY:     '↩️',
  FOLLOW:    '👤',
  MENTION:   '@',
  BROADCAST: '📣',
};

export default function Notifications() {
  const qc = useQueryClient();
  const { resetCount } = useNotifications();

  // Fetch all notifications (paginated, 50 per page)
  // Backend: GET /api/v1/notifications  → ApiResponse<Page<NotificationResponse>>
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(0, 50),
  });
  const notifications = data?.data?.data?.content || [];

  // Mark ALL as read when page opens
  // Backend: PATCH /api/v1/notifications/read-all → ApiResponse<Integer> (count updated)
  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      resetCount();
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    markAllMutation.mutate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Delete a single notification
  // Backend: DELETE /api/v1/notifications/{notificationId}
  const deleteSingleMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  // FIX: Delete ALL notifications uses a SEPARATE mutation with its own endpoint
  // Backend: DELETE /api/v1/notifications/all
  const deleteAllMutation = useMutation({
    mutationFn: notificationApi.deleteAll,
    onSuccess: () => {
      resetCount();
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications cleared');
    },
    onError: () => toast.error('Clear failed'),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
        <button
          // FIX: was deleteMutation.mutate('all') which called single-delete with 'all'
          // Now uses the correct deleteAllMutation
          onClick={() => deleteAllMutation.mutate()}
          disabled={deleteAllMutation.isPending || notifications.length === 0}
          className="text-sm text-gray-400 hover:text-red-500 transition
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear all
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
        {isLoading ? (
          <div className="py-12"><Spinner center /></div>
        ) : notifications.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon="🔔"
              title="No notifications"
              subtitle="When someone likes or comments on your posts, you'll see it here"
            />
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50
                          transition group ${!notif.isRead ? 'bg-blue-50' : ''}`}
            >
              {/* Type Icon */}
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center
                              justify-center text-lg flex-shrink-0 mt-0.5">
                {TYPE_ICON[notif.type] || '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">{notif.message}</p>
                <TimeAgo
                  date={notif.createdAt}
                  className="text-xs text-gray-400 mt-0.5"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                {notif.deepLinkUrl && (
                  <Link
                    to={notif.deepLinkUrl}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                )}
                <button
                  onClick={() => deleteSingleMutation.mutate(notif.id)}
                  disabled={deleteSingleMutation.isPending}
                  className="text-xs text-gray-400 hover:text-red-500 transition"
                >
                  ✕
                </button>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}