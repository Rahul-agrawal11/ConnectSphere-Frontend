import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { postApi } from '../api/postApi';
import { searchApi } from '../api/searchApi';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/post/PostCard';
import Spinner from '../components/common/Spinner';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const { data: feedData, isLoading: feedLoading } = useQuery({
    queryKey: ['publicFeed'],
    queryFn: () => postApi.getPublicFeed(0, 10),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: () => searchApi.getTrending(10),
  });

  const posts = feedData?.data?.data?.content || [];
  const trending = trendingData?.data?.data || [];

  if (isAuthenticated) {
    return (
      <div className="centered-action">
        <Link
          to="/feed"
          className="primary-button primary-button--lg"
        >
          Go to your feed →
        </Link>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <h1 className="home-hero__title">Welcome to ConnectSphere</h1>
        <p className="home-hero__subtitle">
          Share moments. Build connections. Inspire communities.
        </p>
        <div className="home-hero__actions">
          <Link
            to="/register"
            className="hero-primary-button"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="hero-secondary-button"
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="feed-layout">
        {/* Public Feed */}
        <div className="feed-main">
          <h2 className="section-title">
            Public Posts
          </h2>
          {feedLoading ? (
            <Spinner center />
          ) : posts.length === 0 ? (
            <p className="empty-inline empty-inline--spacious">
              No public posts yet.
            </p>
          ) : (
            <div className="content-list">
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar-panel">
          <div className="sidebar-card sidebar-card--sticky">
            <h3 className="sidebar-card__title">
              🔥 Trending
            </h3>
            {trending.map(tag => (
              <Link
                key={tag.id}
                to={`/hashtags/${tag.tag}`}
                className="trending-link"
              >
                <span className="trending-link__tag">#{tag.tag}</span>
                <span className="trending-link__count">
                  {tag.postCount}
                </span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
