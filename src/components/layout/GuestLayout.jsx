import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, LogIn, UserPlus } from 'lucide-react';
import './GuestLayout.css';

/**
 * GuestLayout wraps all publicly accessible routes.
 * Shows a minimal navbar with Login / Register CTAs.
 * Used for: public feed, public profile, public search.
 */
const GuestLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="guest-layout">
      {/* ── Guest Navbar ──────────────────────────────────────────────── */}
      <header className="guest-navbar">
        <div className="guest-navbar__inner">
          <Link to="/" className="guest-navbar__logo">
            <span className="guest-navbar__logo-icon">◈</span>
            <span className="guest-navbar__logo-text">ConnectSphere</span>
          </Link>

          <div className="guest-navbar__actions">
            <Link to="/search" className="guest-navbar__search-link">
              <Search size={18} />
              <span>Search</span>
            </Link>
            <Link to="/login" className="btn btn-outline btn-sm">
              <LogIn size={15} />
              Log in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              <UserPlus size={15} />
              Join free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Guest Banner ──────────────────────────────────────────────── */}
      <div className="guest-banner">
        <div className="guest-banner__inner">
          <span className="guest-banner__text">
            ✨ You're browsing as a guest.
          </span>
          <button
            className="guest-banner__cta"
            onClick={() => navigate('/register')}
          >
            Create a free account
          </button>
          <span className="guest-banner__sep">or</span>
          <button
            className="guest-banner__login"
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
          <span className="guest-banner__text">
            to like, comment, and follow.
          </span>
        </div>
      </div>

      {/* ── Page Content ──────────────────────────────────────────────── */}
      <div className="guest-layout__body">
        <div className="guest-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default GuestLayout;