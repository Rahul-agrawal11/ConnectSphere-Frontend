import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import Avatar from '../components/common/Avatar';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
} from '../api/notificationApi';
import { getProfileById } from '../api/authApi';
import { useToast } from '../components/common/Toast';
import './Notifications.css';

const TYPE_ICON = {
  LIKE:    { icon: '👍', label: 'liked your post' },
  LOVE:    { icon: '❤️', label: 'loved your post' },
  COMMENT: { icon: '💬', label: 'commented on your post' },
  REPLY:   { icon: '↩️', label: 'replied to your comment' },
  FOLLOW:  { icon: '👤', label: 'started following you' },
  MENTION: { icon: '@',  label: 'mentioned you' },
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const NotificationItem = ({ notif, onRead, onDelete }) => {
  const [actor, setActor] = useState(null);
  const typeInfo = TYPE_ICON[notif.type] || { icon: '🔔', label: 'notification' };

  useEffect(() => {
    if (notif.actorId) {
      getProfileById(notif.actorId)
        .then((r) => setActor(r.data.data))
        .catch(() => {});
    }
  }, [notif.actorId]);

  return (
    <div
      className={`notif-item ${!notif.read ? 'notif-item--unread' : ''}`}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      {/* Unread dot */}
      {!notif.read && <span className="notif-item__dot" />}

      {/* Actor avatar with type badge */}
      <div className="notif-item__avatar-wrap">
        <Avatar
          src={actor?.profilePicUrl}
          username={actor?.username || '?'}
          size={44}
        />
        <span className="notif-item__type-badge">{typeInfo.icon}</span>
      </div>

      {/* Content */}
      <div className="notif-item__content">
        <p className="notif-item__text">
          {actor ? (
            <Link
              to={`/profile/${notif.actorId}`}
              className="notif-item__actor"
              onClick={(e) => e.stopPropagation()}
            >
              {actor.fullName || actor.username}
            </Link>
          ) : (
            <span className="notif-item__actor">Someone</span>
          )}{' '}
          {typeInfo.label}
        </p>
        {notif.message && (
          <p className="notif-item__message">{notif.message}</p>
        )}
        <span className="notif-item__time">{timeAgo(notif.createdAt)}</span>
      </div>

      {/* Delete */}
      <button
        className="notif-item__delete"
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        aria-label="Delete notification"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

const Notifications = () => {
  const { addToast }          = useToast();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage]       = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [marking, setMarking] = useState(false);
  const [filter, setFilter]   = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    loadNotifs(0, true);
    loadUnreadCount();
  }, [filter]);

  const loadNotifs = async (pageNum = 0, reset = false) => {
    if (pageNum === 0) setLoading(true);
    try {
      const res  = await getNotifications(pageNum, 20);
      const data = res.data.data;
      const list = (data?.content || []).filter((n) =>
        filter === 'unread' ? !n.read : true
      );
      setNotifs((prev) => reset ? list : [...prev, ...list]);
      setHasMore(!data?.last);
      setPage(pageNum);
    } catch {}
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.data || 0);
    } catch {}
  };

  const handleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(c - 1, 0));
    } catch {}
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await markAllAsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch {
      addToast('Failed to mark all as read', 'error');
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifs((prev) => prev.filter((n) => n.id !== id));
      addToast('Notification deleted', 'info');
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    try {
      await deleteAllNotifications();
      setNotifs([]);
      setUnreadCount(0);
      addToast('All notifications cleared', 'success');
    } catch {
      addToast('Failed to clear notifications', 'error');
    }
  };

  return (
    <div className="notif-page animate-fade-in">
      {/* Header */}
      <div className="notif-page__header">
        <div className="notif-page__title-row">
          <h1 className="notif-page__title">
            <Bell size={22} /> Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="badge notif-page__badge">{unreadCount}</span>
          )}
        </div>

        <div className="notif-page__actions">
          {unreadCount > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleMarkAll}
              disabled={marking}
            >
              {marking
                ? <><Loader2 size={14} className="spinner-icon" /> Marking…</>
                : <><CheckCheck size={14} /> Mark all read</>}
            </button>
          )}
          {notifs.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleDeleteAll}>
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="notif-filters">
        <button
          className={`notif-filter ${filter === 'all' ? 'notif-filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`notif-filter ${filter === 'unread' ? 'notif-filter--active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* List */}
      <div className="notif-list card">
        {loading ? (
          <div className="notif-loading"><Spinner size={32} /></div>
        ) : notifs.length === 0 ? (
          <div className="notif-empty">
            <Bell size={40} strokeWidth={1.5} />
            <h3>No notifications</h3>
            <p>{filter === 'unread' ? 'You\'re all caught up!' : 'Nothing to show yet'}</p>
          </div>
        ) : (
          <>
            {notifs.map((n) => (
              <NotificationItem
                key={n.id}
                notif={n}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
            {hasMore && (
              <button
                className="notif-load-more btn btn-ghost btn-full"
                onClick={() => loadNotifs(page + 1)}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;