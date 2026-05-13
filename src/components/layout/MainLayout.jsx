import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CreatePostModal from '../post/CreatePostModal';
import './MainLayout.css';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const handlePostCreated = useCallback(() => {
    setCreatePostOpen(false);
    window.dispatchEvent(new CustomEvent('cs:postCreated'));
  }, []);

  useEffect(() => {
    const openCreatePostModal = () => {
      setCreatePostOpen(true);
      setMobileMenuOpen(false);
    };

    document.addEventListener('openCreatePost', openCreatePostModal);

    return () => {
      document.removeEventListener('openCreatePost', openCreatePostModal);
    };
  }, []);

  return (
    <>
      <Navbar
        onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        mobileMenuOpen={mobileMenuOpen}
        onCreatePost={() => setCreatePostOpen(true)}
      />

      {mobileMenuOpen && (
        <nav className="mobile-nav animate-fade-in">
          <a href="/" className="mobile-nav__link">🏠 Home</a>
          <a href="/search" className="mobile-nav__link">🔍 Search</a>
          <a href="/notifications" className="mobile-nav__link">🔔 Notifications</a>

          <button
            type="button"
            className="mobile-nav__link mobile-nav__link--btn"
            onClick={() => {
              setCreatePostOpen(true);
              setMobileMenuOpen(false);
            }}
          >
            ✏️ Create Post
          </button>
        </nav>
      )}

      <div className="main-layout">
        <div className="main-layout__content">
          <Outlet />
        </div>

        <Sidebar />
      </div>

      {createPostOpen && (
        <CreatePostModal
          onClose={() => setCreatePostOpen(false)}
          onCreated={handlePostCreated}
        />
      )}
    </>
  );
};

export default MainLayout;