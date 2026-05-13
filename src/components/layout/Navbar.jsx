import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Search, Bell, User, LogOut, Menu, X,
  MessageSquare, Hash, Plus, Shield,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Avatar from '../common/Avatar';
import { getUnreadCount } from '../../api/notificationApi';
import { logout as apiLogout } from '../../api/authApi';
import { useToast } from '../common/Toast';
import './Navbar.css';

const Navbar = ({ onMobileMenuToggle, mobileMenuOpen, onCreatePost }) => {
  const { user, logoutUser } = useAuth();
  const { addToast }         = useToast();
  const navigate             = useNavigate();
  const location             = useLocation();
  const [unread, setUnread]  = useState(0);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef              = useRef(null);

  // Fetch unread badge count
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await getUnreadCount();
        setUnread(res.data.data || 0);
      } catch {}
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    logoutUser();
    navigate('/login');
    addToast('Logged out successfully', 'success');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">◈</span>
          <span className="navbar__logo-text">ConnectSphere</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar__links" aria-label="Main navigation">
          <Link to="/" className={`navbar__link ${isActive('/') ? 'navbar__link--active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </Link>
          <Link
            to="/search"
            className={`navbar__link ${isActive('/search') ? 'navbar__link--active' : ''}`}
          >
            <Search size={20} />
            <span>Search</span>
          </Link>
          <Link
            to="/notifications"
            className={`navbar__link ${isActive('/notifications') ? 'navbar__link--active' : ''}`}
          >
            <Bell size={20} />
            <span>Alerts</span>
            {unread > 0 && (
              <span className="navbar__badge">{unread > 99 ? '99+' : unread}</span>
            )}
          </Link>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Create post */}
          <button
            className="btn btn-primary btn-sm navbar__create-btn"
            onClick={onCreatePost}
            title="New Post"
          >
            <Plus size={16} />
            <span>Post</span>
          </button>

          {/* User dropdown */}
          <div className="navbar__user-wrap" ref={dropRef}>
            <button
              className="navbar__avatar-btn"
              onClick={() => setDropOpen((p) => !p)}
              aria-expanded={dropOpen}
              aria-label="User menu"
            >
              <Avatar
                src={user?.profilePicUrl}
                username={user?.username}
                size={36}
              />
            </button>

            {dropOpen && (
              <div className="navbar__dropdown animate-scale-in">
                <div className="navbar__dropdown-header">
                  <Avatar
                    src={user?.profilePicUrl}
                    username={user?.username}
                    size={44}
                  />
                  <div>
                    <p className="navbar__dropdown-name">{user?.fullName || user?.username}</p>
                    <p className="navbar__dropdown-handle">@{user?.username}</p>
                  </div>
                </div>
                <hr className="divider" />
                <Link
                  to={`/profile/${user?.id}`}
                  className="navbar__dropdown-item"
                  onClick={() => setDropOpen(false)}
                >
                  <User size={16} /> Profile
                </Link>
                <Link
                  to="/notifications"
                  className="navbar__dropdown-item"
                  onClick={() => setDropOpen(false)}
                >
                  <Bell size={16} /> Notifications
                  {unread > 0 && <span className="badge">{unread}</span>}
                </Link>
                {user?.role === 'ADMIN' && (
                  <>
                    <hr className="divider" />
                    <Link
                      to="/admin"
                      className="navbar__dropdown-item"
                      onClick={() => setDropOpen(false)}
                    >
                      <Shield size={16} /> Admin Panel
                    </Link>
                  </>
                )}
                <hr className="divider" />
                <button
                  className="navbar__dropdown-item navbar__dropdown-item--danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="navbar__mobile-toggle"
            onClick={onMobileMenuToggle}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;