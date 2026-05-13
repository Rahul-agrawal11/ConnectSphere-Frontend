import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <p className="not-found-page__code">404</p>
      <h1 className="not-found-page__title">Page not found</h1>
      <p className="not-found-page__text">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="primary-button"
      >
        Go Home
      </Link>
    </div>
  );
}
