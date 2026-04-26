import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Avatar from '../common/Avatar';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="font-bold text-blue-600 text-xl flex-shrink-0">
          ConnectSphere
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm hidden sm:block">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search posts, users, #hashtags…"
            className="w-full px-4 py-2 text-sm bg-gray-100 rounded-full
                       border-transparent focus:outline-none focus:ring-2
                       focus:ring-blue-300 focus:bg-white transition"
          />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Nav Links */}
              <NavLink to="/feed" label="Feed" active={location.pathname === '/feed'} />
              <NavLink to="/posts/create" label="+ Post" active={false} highlight />

              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white
                                   text-xs rounded-full min-w-[18px] h-[18px] flex
                                   items-center justify-center font-medium px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <Avatar
                    src={user?.profilePicUrl}
                    name={user?.username}
                    size={8}
                  />
                  <span className="text-sm font-medium hidden md:block">
                    {user?.username}
                  </span>
                  <span className="text-gray-400 text-xs">▾</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white
                                  border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <MenuLink
                      to={`/profile/${user?.userId}`}
                      label="My Profile"
                      onClick={() => setMenuOpen(false)}
                    />
                    <MenuLink
                      to="/stories"
                      label="Stories"
                      onClick={() => setMenuOpen(false)}
                    />
                    <MenuLink
                      to="/suggestions"
                      label="Suggestions"
                      onClick={() => setMenuOpen(false)}
                    />
                    <MenuLink
                      to="/edit-profile"
                      label="Edit Profile"
                      onClick={() => setMenuOpen(false)}
                    />
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <MenuLink
                          to="/admin"
                          label="⚙ Admin Panel"
                          onClick={() => setMenuOpen(false)}
                        />
                      </>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm
                                 text-red-600 hover:bg-red-50 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                           rounded-lg transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm bg-blue-600 text-white
                           rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active, highlight }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 text-sm rounded-lg font-medium transition
        ${active
          ? 'bg-blue-50 text-blue-600'
          : highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
      {label}
    </Link>
  );
}

function MenuLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
    >
      {label}
    </Link>
  );
}