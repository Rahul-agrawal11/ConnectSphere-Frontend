import { useState, useEffect, useCallback } from 'react';
import {
  Users, FileText, Bell, Shield, Trash2, Ban, CheckCircle,
  Search, RefreshCw, AlertTriangle, X, Send, ChevronDown,
  Eye, BarChart2,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import { useToast } from '../components/common/Toast';
import {
  getAllUsers, suspendUser, reactivateUser, deleteUser,
  getAllPosts, adminDeletePost, sendBroadcast,
} from '../api/adminApi';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

// ── Helpers ───────────────────────────────────────────────────────────────

const extractList = (res) => {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.content)) return d.content;
  return [];
};

const STATUS_BADGE = {
  true:  { label: 'Active',    cls: 'badge--green'  },
  false: { label: 'Suspended', cls: 'badge--red'    },
};

// ── Sub-components ────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, color }) => (
  <div className="admin-stat-card" style={{ '--accent': color }}>
    <div className="admin-stat-card__icon">{icon}</div>
    <div>
      <div className="admin-stat-card__value">{value ?? '—'}</div>
      <div className="admin-stat-card__label">{label}</div>
    </div>
  </div>
);

const ConfirmModal = ({ message, onConfirm, onCancel, danger = true }) => (
  <div className="admin-modal-overlay" onClick={onCancel}>
    <div className="admin-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
      <div className="admin-modal__icon">
        <AlertTriangle size={28} color={danger ? 'var(--cs-accent)' : 'var(--cs-primary)'} />
      </div>
      <p className="admin-modal__msg">{message}</p>
      <div className="admin-modal__actions">
        <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        <button
          className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ── USERS TAB ─────────────────────────────────────────────────────────────

const UsersTab = () => {
  const { addToast } = useToast();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [confirm, setConfirm] = useState(null); // { type, userId, username }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(extractList(res));
    } catch {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (userId) => {
    try {
      await suspendUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, active: false } : u));
      addToast('User suspended', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to suspend', 'error');
    }
    setConfirm(null);
  };

  const handleReactivate = async (userId) => {
    try {
      await reactivateUser(userId);
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, active: true } : u));
      addToast('User reactivated', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reactivate', 'error');
    }
    setConfirm(null);
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast('User permanently deleted', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
    setConfirm(null);
  };

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return (
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    );
  });

  const confirmAction = (type, user) =>
    setConfirm({ type, userId: user.id, username: user.username });

  return (
    <div className="admin-tab">
      <div className="admin-tab__toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search by name, username or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-search__input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="admin-search__clear">
              <X size={13} />
            </button>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-loading"><Spinner size={32} /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const badge = STATUS_BADGE[String(u.active ?? true)];
                  return (
                    <tr key={u.id} className={!u.active ? 'admin-table__row--dim' : ''}>
                      <td>
                        <div className="admin-user-cell">
                          <Avatar src={u.profilePicUrl} username={u.username} size={32} />
                          <div>
                            <div className="admin-user-cell__name">
                              {u.fullName || u.username}
                            </div>
                            <div className="admin-user-cell__handle">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-table__muted">{u.email}</td>
                      <td>
                        <span className={`admin-badge ${u.role === 'ADMIN' ? 'badge--purple' : 'badge--gray'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="admin-table__muted">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="admin-action-group">
                          {u.active !== false ? (
                            <button
                              className="admin-action-btn admin-action-btn--warn"
                              title="Suspend"
                              onClick={() => confirmAction('suspend', u)}
                            >
                              <Ban size={14} />
                            </button>
                          ) : (
                            <button
                              className="admin-action-btn admin-action-btn--green"
                              title="Reactivate"
                              onClick={() => confirmAction('reactivate', u)}
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            title="Permanently delete"
                            onClick={() => confirmAction('delete', u)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          danger={confirm.type !== 'reactivate'}
          message={
            confirm.type === 'suspend'
              ? `Suspend @${confirm.username}? They won't be able to log in.`
              : confirm.type === 'reactivate'
              ? `Reactivate @${confirm.username}?`
              : `Permanently delete @${confirm.username}? This cannot be undone.`
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.type === 'suspend')    handleSuspend(confirm.userId);
            if (confirm.type === 'reactivate') handleReactivate(confirm.userId);
            if (confirm.type === 'delete')     handleDelete(confirm.userId);
          }}
        />
      )}
    </div>
  );
};

// ── POSTS TAB ─────────────────────────────────────────────────────────────

const PostsTab = () => {
  const { addToast } = useToast();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery]     = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const res  = await getAllPosts(p, 20);
      const data = res?.data?.data ?? res?.data;
      const list = Array.isArray(data?.content) ? data.content
                 : Array.isArray(data) ? data : [];
      setPosts((prev) => reset ? list : [...prev, ...list]);
      setHasMore(!(data?.last ?? true));
      setPage(p);
    } catch (err) {
      console.error('Failed to load posts:', err);
      const msg = err.response?.data?.message || 'Failed to load posts';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0, true); }, [load]);

  const handleDelete = async (postId) => {
    try {
      await adminDeletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      addToast('Post removed', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove post', 'error');
    }
    setConfirm(null);
  };

  const filtered = query
    ? posts.filter((p) =>
        p.content?.toLowerCase().includes(query.toLowerCase()))
    : posts;

  return (
    <div className="admin-tab">
      <div className="admin-tab__toolbar">
        <div className="admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Filter by content…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-search__input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="admin-search__clear">
              <X size={13} />
            </button>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => load(0, true)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading && posts.length === 0 ? (
        <div className="admin-loading"><Spinner size={32} /></div>
      ) : (
        <>
          <div className="admin-post-list">
            {filtered.length === 0 ? (
              <div className="admin-empty">No posts found</div>
            ) : (
              filtered.map((post) => (
                <div key={post.id} className="admin-post-row">
                  <div className="admin-post-row__meta">
                    <span className="admin-post-row__id">#{post.id}</span>
                    <span className={`admin-badge badge--${
                      post.visibility === 'PUBLIC' ? 'green'
                      : post.visibility === 'PRIVATE' ? 'red' : 'gray'
                    }`}>
                      {post.visibility}
                    </span>
                    <span className="admin-table__muted">
                      Author: {post.authorId}
                    </span>
                    <span className="admin-table__muted">
                      {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="admin-post-row__content">
                    {post.content?.slice(0, 180) || <em>No text content</em>}
                    {post.content?.length > 180 && '…'}
                  </p>
                  <div className="admin-post-row__stats">
                    <span>👍 {post.likesCount ?? 0}</span>
                    <span>💬 {post.commentsCount ?? 0}</span>
                    {post.mediaUrls?.length > 0 && (
                      <span>📎 {post.mediaUrls.length} media</span>
                    )}
                  </div>
                  <button
                    className="admin-action-btn admin-action-btn--danger admin-post-row__del"
                    title="Remove post"
                    onClick={() => setConfirm({ postId: post.id })}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))
            )}
          </div>

          {hasMore && (
            <button
              className="btn btn-outline btn-full"
              onClick={() => load(page + 1)}
              disabled={loading}
            >
              {loading ? <Spinner size={14} /> : 'Load more'}
            </button>
          )}
        </>
      )}

      {confirm && (
        <ConfirmModal
          message="Remove this post? This action cannot be undone."
          onCancel={() => setConfirm(null)}
          onConfirm={() => handleDelete(confirm.postId)}
        />
      )}
    </div>
  );
};

// ── BROADCAST TAB ─────────────────────────────────────────────────────────

const BroadcastTab = () => {
  const { addToast } = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const MAX = 500;

  const handleSend = async () => {
    if (!message.trim()) {
      addToast('Message cannot be empty', 'error');
      return;
    }
    setSending(true);
    try {
      // recipientIds = [] means broadcast to all users
      await sendBroadcast([], message.trim());
      setSent(true);
      setMessage('');
      addToast('Broadcast sent to all users!', 'success');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to send broadcast', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-tab">
      <div className="admin-broadcast">
        <div className="admin-broadcast__header">
          <Bell size={20} color="var(--cs-primary)" />
          <div>
            <h3 className="admin-broadcast__title">Platform Broadcast</h3>
            <p className="admin-broadcast__desc">
              Send an in-app notification to every registered user.
            </p>
          </div>
        </div>

        <div className="admin-broadcast__form">
          <label className="admin-broadcast__label">
            Message
            <span className="admin-broadcast__char">
              {message.length}/{MAX}
            </span>
          </label>
          <textarea
            className="admin-broadcast__textarea"
            rows={5}
            maxLength={MAX}
            placeholder="Write your platform announcement here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="admin-broadcast__actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setMessage('')}
            disabled={!message || sending}
          >
            Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <><Spinner size={14} /> Sending…</>
            ) : sent ? (
              <><CheckCircle size={15} /> Sent!</>
            ) : (
              <><Send size={15} /> Send to All Users</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── MAIN ADMIN PANEL ──────────────────────────────────────────────────────

const TABS = [
  { key: 'users',     label: 'Users',     icon: <Users size={16} />     },
  { key: 'posts',     label: 'Posts',     icon: <FileText size={16} />   },
  { key: 'broadcast', label: 'Broadcast', icon: <Bell size={16} />       },
];

const AdminPanel = () => {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('users');
  const [userCount, setUserCount] = useState(null);

  // Guard: redirect non-admins immediately
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Load stats
  useEffect(() => {
    getAllUsers()
      .then((res) => setUserCount(extractList(res).length))
      .catch(() => {});
  }, []);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="admin-guard">
        <Shield size={48} color="var(--cs-text-muted)" />
        <h2>Access Denied</h2>
        <p>This page is only accessible to administrators.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="admin-header">
        <div className="admin-header__left">
          <div className="admin-header__icon">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="admin-header__title">Admin Panel</h1>
            <p className="admin-header__sub">ConnectSphere Platform Management</p>
          </div>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <div className="admin-stats-row">
        <StatCard
          icon={<Users size={20} />}
          label="Total Users"
          value={userCount}
          color="var(--cs-primary)"
        />
        <StatCard
          icon={<BarChart2 size={20} />}
          label="Platform"
          value="Live"
          color="var(--cs-secondary)"
        />
        <StatCard
          icon={<Shield size={20} />}
          label="Role"
          value="Admin"
          color="var(--cs-accent)"
        />
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab-btn ${tab === t.key ? 'admin-tab-btn--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────────── */}
      <div className="admin-tab-content card">
        {tab === 'users'     && <UsersTab />}
        {tab === 'posts'     && <PostsTab />}
        {tab === 'broadcast' && <BroadcastTab />}
      </div>
    </div>
  );
};

export default AdminPanel;